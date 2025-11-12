# Deep Analysis: Archive Worktree Cleanup Issue

## Executive Summary

The archive functionality is **incomplete**. When a task is archived:
- ✅ Task status is updated to 'archived' in the database
- ❌ Git worktrees are NOT cleaned up
- ❌ The `worktree_deleted` flag is NOT set to true

This is a critical gap because:
1. **Disk space waste**: Worktrees accumulate on disk indefinitely
2. **Resource leak**: Unnecessary git branches remain in repository
3. **Inconsistent state**: Database says archived but worktree still exists

The delete_task function already has full worktree cleanup logic that should be adapted for archive.

---

## Architecture Analysis

### 1. Current Task Update Flow

**Frontend:** `frontend/src/components/dialogs/tasks/ArchiveTaskConfirmationDialog.tsx`
```typescript
await tasksApi.update(task.id, {
  status: 'archived',
  // ... clear other fields
});
```

**API Route:** `forge-app/src/router.rs:600-602`
```rust
.route("/", get(tasks::get_task)
    .put(tasks::update_task)  // ← Delegates to upstream
    .delete(tasks::delete_task),
)
```

**Upstream Implementation:** `forge-core/crates/server/src/routes/tasks.rs:215-249`
```rust
pub async fn update_task(
    Extension(existing_task): Extension<Task>,
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<UpdateTask>,
) -> Result<ResponseJson<ApiResponse<Task>>, ApiError> {
    // 1. Merge payload with existing values
    let title = payload.title.unwrap_or(existing_task.title);
    let description = /* handle ... */;
    let status = payload.status.unwrap_or(existing_task.status);  // ← Gets 'archived'

    // 2. Call database update
    let task = Task::update(
        &deployment.db().pool,
        existing_task.id,
        existing_task.project_id,
        title,
        description,
        status,  // ← Status set to 'archived'
        parent_task_attempt,
    ).await?;

    // 3. Update images if provided
    if let Some(image_ids) = &payload.image_ids {
        TaskImage::delete_by_task_id(&deployment.db().pool, task.id).await?;
        TaskImage::associate_many_dedup(&deployment.db().pool, task.id, image_ids).await?;
    }

    // ❌ MISSING: No worktree cleanup when status == 'archived'
    Ok(ResponseJson(ApiResponse::success(task)))
}
```

### 2. Delete Task Flow (Reference Implementation)

**Upstream:** `forge-core/crates/server/src/routes/tasks.rs:251-350+`

The `delete_task` function shows the **correct pattern** we need to follow:

```rust
pub async fn delete_task(
    Extension(task): Extension<Task>,
    State(deployment): State<DeploymentImpl>,
) -> Result<(StatusCode, ResponseJson<ApiResponse<()>>), ApiError> {
    // Step 1: Validate no running processes
    if deployment.container().has_running_processes(task.id).await? {
        return Err(ApiError::Conflict("Task has running execution processes...".to_string()));
    }

    // Step 2: Gather task attempts
    let attempts = TaskAttempt::fetch_all(&deployment.db().pool, Some(task.id))
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch task attempts for task {}: {}", task.id, e);
            ApiError::TaskAttempt(e)
        })?;

    // Step 3: Get project for git repo path
    let project = task
        .parent_project(&deployment.db().pool)
        .await?
        .ok_or_else(|| ApiError::Database(SqlxError::RowNotFound))?;

    // Step 4: Build cleanup data for each attempt's worktree
    let cleanup_data: Vec<WorktreeCleanupData> = attempts
        .iter()
        .filter_map(|attempt| {
            attempt
                .container_ref
                .as_ref()
                .map(|worktree_path| WorktreeCleanupData {
                    attempt_id: attempt.id,
                    worktree_path: PathBuf::from(worktree_path),
                    git_repo_path: Some(project.git_repo_path.clone()),
                })
        })
        .collect();

    // Step 5: Database transaction - delete task and break parent-child relationships
    let mut tx = deployment.db().pool.begin().await?;

    let mut total_children_affected = 0u64;
    for attempt in &attempts {
        let children_affected = Task::nullify_children_by_attempt_id(&mut *tx, attempt.id).await?;
        total_children_affected += children_affected;
    }

    let rows_affected = Task::delete(&mut *tx, task.id).await?;

    if rows_affected == 0 {
        return Err(ApiError::Database(SqlxError::RowNotFound));
    }

    tx.commit().await?;

    // Step 6: Background cleanup of worktrees
    tokio::spawn(async move {
        let span = tracing::info_span!("background_worktree_cleanup", task_id = %task_id);
        let _enter = span.enter();

        tracing::info!(
            "Starting background cleanup for task {} ({} worktrees)",
            task_id,
            cleanup_data.len()
        );

        if let Err(e) = cleanup_worktrees_direct(&cleanup_data).await {
            tracing::error!("Background worktree cleanup failed: {}", e);
        } else {
            tracing::info!("Completed background cleanup for task {}", task_id);
        }
    });

    Ok((StatusCode::OK, ResponseJson(ApiResponse::success(()))))
}
```

### 3. WorktreeCleanupData Structure

**Location:** `forge-core/crates/services/src/services/container.rs:53-57`

```rust
pub struct WorktreeCleanupData {
    pub attempt_id: Uuid,
    pub worktree_path: PathBuf,
    pub git_repo_path: Option<PathBuf>,
}
```

This is used by the cleanup function to actually delete git worktrees.

### 4. Cleanup Function

**Location:** `forge-core/crates/services/src/services/container.rs:60-83`

```rust
pub async fn cleanup_worktrees_direct(data: &[WorktreeCleanupData]) -> Result<(), ContainerError> {
    for cleanup_data in data {
        tracing::debug!(
            "Cleaning up worktree for attempt {}: {:?}",
            cleanup_data.attempt_id,
            cleanup_data.worktree_path
        );

        if let Err(e) = WorktreeManager::cleanup_worktree(
            &cleanup_data.worktree_path,
            cleanup_data.git_repo_path.as_deref(),
        )
        .await
        {
            tracing::error!(
                "Failed to cleanup worktree for task attempt {}: {}",
                cleanup_data.attempt_id,
                e
            );
            // Continue with other cleanups even if one fails
        }
    }
    Ok(())
}
```

Key points:
- Uses `WorktreeManager::cleanup_worktree()` to actually delete git worktrees
- Graceful error handling: continues with other cleanups if one fails
- Does NOT require database access (direct cleanup)

### 5. TaskAttempt Model

**Location:** `forge-core/crates/db/src/models/task_attempt.rs:37-54`

```rust
#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct TaskAttempt {
    pub id: Uuid,
    pub task_id: Uuid,
    pub container_ref: Option<String>,  // ← Path to worktree (e.g., "/path/to/.git/worktrees/forge/xxx")
    pub branch: String,                 // ← Git branch name
    pub target_branch: String,
    pub executor: String,
    pub worktree_deleted: bool,         // ← Flag to mark cleanup
    pub setup_completed_at: Option<DateTime<Utc>>,
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
    pub cache_creation_tokens: Option<i32>,
    pub cache_read_tokens: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

Key insight: **`container_ref` holds the worktree path, not the `branch` field.**

The `branch` field is just the git branch name (e.g., "forge/abc123-fix-auth").
The `container_ref` is the actual filesystem path to the worktree.

---

## The Bug: Archive Path

When a task transitions to 'archived' status:

```
Task status: "pending" → "archived"
    ↓
Task::update() called
    ↓
Database: status updated to 'archived'
    ↓
TaskAttempts: Still exist with container_ref pointing to active worktrees
    ↓
worktree_deleted: Still FALSE
    ↓
Worktree on disk: Still exists, taking up space, cluttering git
```

### Why This Happens

The `update_task` function only updates task metadata:
- title
- description
- status
- parent_task_attempt
- image_ids

It does **NOT** handle the case where status changes to 'archived' and worktrees need cleanup.

---

## Solution: Archive Handler

The fix needs to be in the **upstream forge-core**, specifically in:
`forge-core/crates/server/src/routes/tasks.rs`

### Modified update_task Function

```rust
pub async fn update_task(
    Extension(existing_task): Extension<Task>,
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<UpdateTask>,
) -> Result<ResponseJson<ApiResponse<Task>>, ApiError> {
    // Current logic for merging payload with existing values
    let title = payload.title.unwrap_or(existing_task.title);
    let description = match payload.description {
        Some(s) if s.trim().is_empty() => None,
        Some(s) => Some(s),
        None => existing_task.description,
    };
    let status = payload.status.unwrap_or(existing_task.status.clone());
    let parent_task_attempt = payload
        .parent_task_attempt
        .or(existing_task.parent_task_attempt);

    // Update task in database
    let task = Task::update(
        &deployment.db().pool,
        existing_task.id,
        existing_task.project_id,
        title,
        description,
        status.clone(),
        parent_task_attempt,
    )
    .await?;

    // Update images if provided
    if let Some(image_ids) = &payload.image_ids {
        TaskImage::delete_by_task_id(&deployment.db().pool, task.id).await?;
        TaskImage::associate_many_dedup(&deployment.db().pool, task.id, image_ids).await?;
    }

    // ✅ NEW: Handle archive status
    if status == "archived" && existing_task.status != "archived" {
        // Task is being archived for the first time
        // Cleanup worktrees asynchronously
        handle_task_archive(&deployment, existing_task.id).await;
    }

    Ok(ResponseJson(ApiResponse::success(task)))
}

/// Handle worktree cleanup when task is archived
async fn handle_task_archive(deployment: &DeploymentImpl, task_id: Uuid) {
    tokio::spawn(async move {
        let span = tracing::info_span!("archive_task_worktree_cleanup", task_id = %task_id);
        let _enter = span.enter();

        // Fetch task and attempts
        let pool = deployment.db().pool.clone();

        let task = match Task::find_by_id(&pool, task_id).await {
            Ok(Some(t)) => t,
            _ => {
                tracing::error!("Failed to find task {} for archive cleanup", task_id);
                return;
            }
        };

        let attempts = match TaskAttempt::fetch_all(&pool, Some(task_id)).await {
            Ok(a) => a,
            Err(e) => {
                tracing::error!("Failed to fetch attempts for task {}: {}", task_id, e);
                return;
            }
        };

        let project = match task.parent_project(&pool).await {
            Ok(Some(p)) => p,
            _ => {
                tracing::error!("Failed to find project for task {}", task_id);
                return;
            }
        };

        // Build cleanup data
        let cleanup_data: Vec<WorktreeCleanupData> = attempts
            .iter()
            .filter_map(|attempt| {
                attempt
                    .container_ref
                    .as_ref()
                    .map(|worktree_path| WorktreeCleanupData {
                        attempt_id: attempt.id,
                        worktree_path: PathBuf::from(worktree_path),
                        git_repo_path: Some(project.git_repo_path.clone()),
                    })
            })
            .collect();

        if cleanup_data.is_empty() {
            tracing::debug!("No worktrees to cleanup for archived task {}", task_id);
            return;
        }

        tracing::info!(
            "Starting worktree cleanup for archived task {} ({} worktrees)",
            task_id,
            cleanup_data.len()
        );

        // Perform cleanup
        if let Err(e) = cleanup_worktrees_direct(&cleanup_data).await {
            tracing::error!("Failed to cleanup worktrees for archived task {}: {}", task_id, e);
        } else {
            // Mark worktrees as deleted in database
            for attempt in &attempts {
                if let Err(e) = sqlx::query(
                    "UPDATE task_attempts SET worktree_deleted = TRUE, updated_at = datetime('now') WHERE id = ?"
                )
                .bind(attempt.id)
                .execute(&pool)
                .await
                {
                    tracing::error!("Failed to mark worktree_deleted for attempt {}: {}", attempt.id, e);
                } else {
                    tracing::debug!("Marked worktree_deleted=true for attempt {}", attempt.id);
                }
            }

            tracing::info!("Completed worktree cleanup for archived task {}", task_id);
        }
    });
}
```

### Key Design Decisions

1. **Async Background Task**: Uses `tokio::spawn()` to avoid blocking the HTTP response
   - User gets immediate feedback
   - Cleanup happens asynchronously

2. **Graceful Error Handling**: Continues with other cleanups if one fails
   - One broken worktree shouldn't prevent cleanup of others

3. **Database Updates**: Marks `worktree_deleted = true` after successful cleanup
   - Provides audit trail
   - Prevents duplicate cleanup attempts

4. **Condition Check**: Only cleanup if status changed TO archived
   ```rust
   if status == "archived" && existing_task.status != "archived"
   ```
   - Prevents cleanup on updates to already-archived tasks
   - Prevents cleanup if status is null (merge conflict)

---

## Implementation Location

**File:** `forge-core/crates/server/src/routes/tasks.rs`

### Changes Required:

1. Import at top:
```rust
use std::path::PathBuf;  // Already imported for delete_task
use services::services::container::WorktreeCleanupData;  // Already imported
```

2. Modify `update_task()` function (lines 215-249)
   - Add status comparison check
   - Call new `handle_task_archive()` function

3. Add new `handle_task_archive()` async function (after `delete_task`)

### No Changes Needed:

- ✅ Database models already have `worktree_deleted` field
- ✅ `WorktreeCleanupData` structure already exists
- ✅ `cleanup_worktrees_direct()` function already exists
- ✅ Imports already in place for all needed types

---

## Testing Strategy

### Unit Test Cases:

1. **Archive with single worktree**
   - Create task → Create attempt → Archive task
   - Verify: worktree deleted, worktree_deleted = true

2. **Archive with multiple attempts**
   - Create task → Create 2+ attempts → Archive task
   - Verify: All worktrees deleted, all marked as deleted

3. **Archive already-archived task**
   - Archive → Archive again (no-op)
   - Verify: No double cleanup, no errors

4. **Archive with missing worktree**
   - Create task → Create attempt → Manually delete worktree → Archive
   - Verify: Graceful error handling, still marked as deleted

5. **Archive with running execution process**
   - Create task → Start execution → Archive
   - Verify: Either blocks or cleans up anyway (depends on design decision)

### Integration Tests:

```bash
# Create task with worktree
curl -X POST /api/tasks/create-and-start

# Verify worktree exists
git worktree list | grep forge/

# Archive task via UI or API
curl -X PUT /api/tasks/{id} -d '{"status":"archived"}'

# Wait for async cleanup
sleep 2

# Verify worktree deleted
git worktree list | grep forge/  # Should be empty

# Verify DB flag
SELECT worktree_deleted FROM task_attempts WHERE task_id = ?  # Should be 1
```

---

## Deployment Impact

### Backward Compatibility:

- ✅ No breaking changes to API or database schema
- ✅ Existing archived tasks will still work (cleanup won't happen, but no errors)
- ✅ New archives will cleanup properly

### Performance:

- Minimal: Async background task, doesn't block HTTP response
- One database update per attempt
- Git worktree removal is fast (just rm -rf)

### Safety:

- Graceful error handling
- Logs all cleanup operations
- `worktree_deleted` flag provides audit trail

---

## Migration for Existing Archives

To cleanup old archived tasks with lingering worktrees:

```rust
// One-time cleanup script
pub async fn cleanup_archived_task_worktrees(pool: &SqlitePool) -> Result<u64, Box<dyn std::error::Error>> {
    let rows = sqlx::query(
        r#"
        SELECT DISTINCT ta.id, ta.container_ref, p.git_repo_path
        FROM task_attempts ta
        JOIN tasks t ON t.id = ta.task_id
        JOIN projects p ON p.id = t.project_id
        WHERE t.status = 'archived'
          AND ta.worktree_deleted = FALSE
          AND ta.container_ref IS NOT NULL
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mut cleanup_data = Vec::new();
    for row in &rows {
        let attempt_id: Uuid = row.get("id");
        let container_ref: String = row.get("container_ref");
        let git_repo_path: String = row.get("git_repo_path");

        cleanup_data.push(WorktreeCleanupData {
            attempt_id,
            worktree_path: PathBuf::from(container_ref),
            git_repo_path: Some(PathBuf::from(git_repo_path)),
        });
    }

    cleanup_worktrees_direct(&cleanup_data).await?;

    // Mark all as cleaned
    sqlx::query(
        "UPDATE task_attempts SET worktree_deleted = TRUE WHERE status = 'archived' AND worktree_deleted = FALSE"
    )
    .execute(pool)
    .await?;

    Ok(rows.len() as u64)
}
```

---

## Summary Table

| Aspect | Current | After Fix |
|--------|---------|-----------|
| Archive status update | ✅ Works | ✅ Works |
| Worktree cleanup | ❌ Missing | ✅ Background task |
| worktree_deleted flag | ⚠️ Unused | ✅ Updated |
| Error handling | N/A | ✅ Graceful |
| Performance impact | Minimal | Minimal |
| API compatibility | N/A | Fully compatible |

