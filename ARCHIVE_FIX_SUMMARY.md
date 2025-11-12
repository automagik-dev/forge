# Archive Worktree Cleanup - Fix Summary

## The Problem

When a task is archived, it should clean up its git worktrees. Currently it doesn't.

```
┌─────────────────────────────────────────┐
│  User clicks "Archive Task"              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ API: PUT /tasks/{id} │
        │ status: 'archived'   │
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │ Forge-core:          │
        │ update_task()        │
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │ DB: status updated   │
        │ to 'archived'        │
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────────────┐
        │ ❌ MISSING:                  │
        │ - No worktree cleanup        │
        │ - worktree_deleted not set   │
        │ - Git branches remain        │
        │ - Disk space wasted          │
        └──────────────────────────────┘
```

## Root Cause

**File:** `forge-core/crates/server/src/routes/tasks.rs:215-249`

The `update_task()` function only updates task metadata:
- title, description, status, parent_task_attempt, image_ids

It **does NOT** check if status changed to 'archived' and cleanup worktrees.

## The Solution

Add archive handling to `update_task()` by:

1. **Detect archive transition**
   ```rust
   if status == "archived" && existing_task.status != "archived" {
       handle_task_archive(&deployment, existing_task.id).await;
   }
   ```

2. **Background cleanup task** (non-blocking)
   - Fetch all task attempts
   - Collect `container_ref` (worktree paths)
   - Call `cleanup_worktrees_direct()`
   - Update `worktree_deleted = true`

3. **Reuse existing infrastructure**
   - `WorktreeCleanupData` struct (already exists)
   - `cleanup_worktrees_direct()` function (already exists)
   - Pattern from `delete_task()` (already working)

## Code Location

### File to Modify
```
forge-core/crates/server/src/routes/tasks.rs
```

### Existing Pattern (delete_task)
Lines 251-350 show the correct pattern for worktree cleanup. Archive handler follows same pattern but doesn't delete the task itself.

### What Already Exists
- ✅ `WorktreeCleanupData` struct (container.rs:53-57)
- ✅ `cleanup_worktrees_direct()` function (container.rs:60-83)
- ✅ Database field `worktree_deleted` (task_attempt.rs:46)
- ✅ `container_ref` field holds worktree path (task_attempt.rs:41)

## Implementation Size

**Lines of code:** ~70 lines
- Modify `update_task()`: Add 5-line status check
- Add `handle_task_archive()` function: ~65 lines

**Complexity:** Low
- Reuses existing cleanup infrastructure
- No database schema changes
- No API changes
- Follows established patterns

## Testing

```bash
# 1. Create task (creates worktree)
POST /api/tasks/create-and-start

# 2. Verify worktree exists
$ git worktree list
/path/.git/worktrees/forge/abc123-task-name

# 3. Archive task (via UI or API)
PUT /api/tasks/{task_id}
{"status": "archived"}

# 4. Wait for async cleanup (~1 second)
$ sleep 2

# 5. Verify worktree deleted
$ git worktree list
# Empty - worktree is gone!

# 6. Verify database flag
$ sqlite3 forge.db
SELECT worktree_deleted FROM task_attempts WHERE task_id = ?
# Returns: 1 (true)
```

## Impact Analysis

| Aspect | Impact |
|--------|--------|
| **Performance** | Minimal - async background task |
| **Disk Space** | Positive - cleans up old worktrees |
| **API Compatibility** | Full - no breaking changes |
| **Database Schema** | None - fields already exist |
| **Error Handling** | Graceful - continues if one fails |
| **Backward Compat** | 100% - old archives still work |

## Next Steps

1. **Implement** in forge-core upstream
2. **Test** with single and multiple attempts
3. **Deploy** to forge-core repository
4. **Update** forge-app dependency to new commit
5. **Verify** in production with archived tasks

## Detailed Documents

For complete implementation details, see:
- `DEEP_ARCHIVE_ANALYSIS.md` - Full technical analysis
- `ARCHIVE_WORKTREE_INVESTIGATION.md` - Initial investigation (now superseded)

---

## Quick Reference: File Locations

```
This Repository (automagik-forge)
├── frontend/src/components/dialogs/tasks/
│   └── ArchiveTaskConfirmationDialog.tsx    (sends archive request)
└── forge-app/src/router.rs                  (routes to upstream)

Upstream Repository (forge-core)
├── crates/server/src/routes/
│   └── tasks.rs                             (update_task - NEEDS FIX)
├── crates/services/src/services/
│   └── container.rs                         (cleanup_worktrees_direct)
└── crates/db/src/models/
    └── task_attempt.rs                      (TaskAttempt model)
```
