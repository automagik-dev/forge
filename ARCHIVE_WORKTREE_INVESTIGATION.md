# Archive Task Worktree Cleanup Investigation

## Issue Summary
When a task is archived, the associated git worktree needs to be cleaned up/deleted, but currently this is not happening.

## Current Architecture

### Frontend Flow
**File:** `frontend/src/components/dialogs/tasks/ArchiveTaskConfirmationDialog.tsx`

When user confirms archive:
```typescript
await tasksApi.update(task.id, {
  title: null,
  description: null,
  status: 'archived',
  parent_task_attempt: null,
  image_ids: null,
});
```

This sends a `PUT /api/tasks/{taskId}` request with `status: 'archived'`

### Backend Architecture (Upstream)
The task update endpoint is delegated to the upstream `server` crate at: `namastexlabs/forge-core.git`

**Current Reference:**
- Commit: `89b83cc4d57a629d628e0dd7587b385b810e80cf`
- Path: `server/routes/tasks.rs` (not in this worktree)

The forge-app router imports this:
```rust
use server::routes::{
    self as upstream, approvals, auth, config as upstream_config, containers, drafts, events,
    execution_processes, filesystem, images, projects, tags, task_attempts, tasks,
};
```

And uses the upstream task handler directly:
```rust
.route("/", get(tasks::get_task)
    .put(tasks::update_task)  // <-- Upstream implementation
    .delete(tasks::delete_task),
)
```

### Database Models

**TaskAttempt Model** has these relevant fields:
```rust
pub type TaskAttempt = {
    id: string,
    task_id: string,
    branch: string,
    target_branch: string,
    executor: string,
    worktree_deleted: boolean,  // <-- FLAG EXISTS but not used
    // ... other fields
};
```

The `worktree_deleted` flag exists in the model but there's no indication it's being set during archive.

## Current Behavior

1. **Task Status Update:** ✅ Works - status changed to 'archived'
2. **Worktree Cleanup:** ❌ **Missing** - worktree not deleted when task archived
3. **Database Flag:** ⚠️ Exists but unused - `worktree_deleted` not set to true

## Required Fixes

### 1. Upstream Server Fix (forge-core)
**Location:** `server/src/routes/tasks.rs` (in forge-core repo)

The `update_task` handler needs to:
1. Check if `status` is being set to `'archived'`
2. Find all `TaskAttempt` records for that task
3. For each attempt:
   - Check `forge_task_attempt_config.use_worktree`
   - If true, delete the git worktree
   - Set `worktree_deleted = true`
   - Mark cleanup timestamp

### 2. Worktree Deletion Logic
Should follow this pattern:
```rust
if let Ok(Some(project)) = task.parent_project(&pool).await {
    for attempt in task_attempts {
        if let Ok(Some(config)) = get_config(&pool, attempt.id).await {
            if config.use_worktree {
                // Delete worktree: git worktree remove <branch>
                delete_git_worktree(&project.git_repo_path, &attempt.branch).await?;

                // Mark as deleted in DB
                mark_worktree_deleted(&pool, attempt.id).await?;
            }
        }
    }
}
```

### 3. Database Tables Involved
- `tasks` - status updated to 'archived'
- `task_attempts` - find all for this task
- `forge_task_attempt_config` - check use_worktree flag

## Implementation Strategy

### Option A: Forge Override (Recommended)
Add archive handling in `forge-app/src/router.rs`:

```rust
// Override tasks router to intercept archive requests
fn build_tasks_router_with_forge_override(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    let task_id_router = Router::new()
        .route(
            "/",
            get(tasks::get_task)
                .put(forge_update_task)  // <-- NEW: Custom handler
                .delete(tasks::delete_task),
        )
}

async fn forge_update_task(
    State(deployment): State<DeploymentImpl>,
    axum::Extension(task): axum::Extension<Task>,
    Json(payload): Json<UpdateTask>,
) -> Result<Json<ApiResponse<Task>>, ApiError> {
    // Check if archiving
    if payload.status == Some("archived") {
        cleanup_task_worktrees(&deployment, task.id).await?;
    }

    // Call upstream update
    tasks::update_task(
        State(deployment),
        axum::Extension(task),
        Json(payload),
    ).await
}

async fn cleanup_task_worktrees(
    deployment: &DeploymentImpl,
    task_id: Uuid,
) -> Result<(), ApiError> {
    let pool = &deployment.db().pool;

    // Get task and project
    let task = Task::find_by_id(pool, task_id).await?.ok_or(...)?;
    let project = task.parent_project(pool).await?.ok_or(...)?;

    // Find all attempts for this task
    let attempts = TaskAttempt::fetch_all(pool, Some(task_id)).await?;

    for attempt in attempts {
        // Check if worktree should be cleaned
        let use_worktree: bool = sqlx::query_scalar(
            "SELECT use_worktree FROM forge_task_attempt_config WHERE task_attempt_id = ?"
        )
        .bind(attempt.id)
        .fetch_optional(pool)
        .await?
        .unwrap_or(false);

        if use_worktree {
            // Delete git worktree
            run_git_command(
                &project.git_repo_path,
                &["worktree", "remove", &attempt.branch],
            ).await.ok(); // Ignore errors if worktree already gone

            // Mark as deleted in DB
            sqlx::query(
                "UPDATE task_attempts SET worktree_deleted = true WHERE id = ?"
            )
            .bind(attempt.id)
            .execute(pool)
            .await?;
        }
    }

    Ok(())
}
```

### Option B: Upstream Fix
Add the cleanup logic directly to `server/src/routes/tasks.rs` in forge-core, handling archive status in the update_task function.

## Related Code Locations

### Frontend
- Task archive request: `frontend/src/components/dialogs/tasks/ArchiveTaskConfirmationDialog.tsx:26-46`
- Task status type: `shared/types.ts:45`
- UpdateTask request type: `shared/types.ts:55`

### Backend
- Forge router: `forge-app/src/router.rs:593-613` (tasks router override)
- Forge router: `forge-app/src/router.rs:976-1040` (task_attempts router)
- Router configuration: `forge-app/src/router.rs:76-106`

### Database Schema
- forge_task_attempt_config table (use_worktree flag)
- task_attempts table (worktree_deleted flag)
- tasks table (status field)

## Testing Checklist

- [ ] Create task with worktree
- [ ] Verify git worktree exists: `git worktree list`
- [ ] Archive task via UI
- [ ] Verify worktree deleted: `git worktree list` (should be gone)
- [ ] Verify DB flag updated: `SELECT worktree_deleted FROM task_attempts WHERE id = ?`
- [ ] Verify task status = 'archived': `SELECT status FROM tasks WHERE id = ?`
- [ ] Test multiple attempts for same task
- [ ] Test archive when worktree already deleted
- [ ] Test archived tasks appear in archived view

## Risks & Considerations

1. **Git Worktree State:** May fail if worktree already deleted - need graceful error handling
2. **Concurrent Operations:** Archive during attempt execution could cause conflicts
3. **Disk Space:** Old worktrees may accumulate if delete fails silently
4. **Rollback:** Once deleted, worktree can't be recovered - must be intentional

## Next Steps

1. **Determine Approach:** Choose between Forge override (A) or upstream fix (B)
2. **Implement:** Add worktree cleanup logic
3. **Test:** Verify deletion works across scenarios
4. **Document:** Update task lifecycle documentation
