# Backend Requirements for Project Branch Status Feature

## Overview
This document describes the backend API endpoints required to support the project-level branch status and pull functionality in the board view.

## Required Endpoints

### 1. Get Project Branch Status
**Endpoint:** `GET /api/projects/{id}/branch-status`

**Purpose:** Get the git status of the main project repository (similar to task attempt branch status, but for the project's main repo).

**Response Type:** `BranchStatus` (same type as task attempt branch status)

**Expected Response:**
```json
{
  "commits_behind": 3,
  "commits_ahead": 0,
  "has_uncommitted_changes": false,
  "head_oid": "abc123...",
  "uncommitted_count": 0,
  "untracked_count": 0,
  "target_branch_name": "main",
  "remote_commits_behind": 3,
  "remote_commits_ahead": 0,
  "merges": [],
  "is_rebase_in_progress": false,
  "conflicted_files": []
}
```

**Implementation Notes:**
- Should run `git fetch` to get latest remote status
- Should check commits behind/ahead relative to the remote tracking branch
- Should use the project's `git_repo_path` to access the repository

### 2. Pull Project Updates
**Endpoint:** `POST /api/projects/{id}/pull`

**Purpose:** Pull updates from the remote repository into the main project repo.

**Request Body:** None

**Response:** `void` (success/error status)

**Implementation Notes:**
- Should run `git pull` or equivalent on the project's main repository
- Should handle merge conflicts appropriately (return error if conflicts occur)
- Should only pull the current branch
- This is simpler than task attempt rebase - just a straightforward pull

## Integration Points

### Frontend Changes (Already Implemented)
1. ✅ `frontend/src/lib/api.ts` - Added `getBranchStatus` and `pullProject` methods to `projectsApi`
2. ✅ `frontend/src/hooks/useProjectBranchStatus.ts` - New hook to fetch project branch status
3. ✅ `frontend/src/components/breadcrumb.tsx` - Modified to show update button in board view

### Backend Changes (Required)
1. ❌ Add route handler for `GET /api/projects/{id}/branch-status` in `forge-core`
2. ❌ Add route handler for `POST /api/projects/{id}/pull` in `forge-core`
3. ❌ Add git operations service methods for project-level status and pull

## Testing

Once backend is implemented, test:
1. Navigate to `/projects/{projectId}/tasks` (board view)
2. Verify button appears when main repo has commits behind remote
3. Click button and verify pull operation works
4. Verify attempt view rebase button still works (regression test)

## Notes
- The frontend implementation is complete and ready to use once the backend endpoints are available
- The button will show in board view only when `commits_behind > 0`
- Uses polling every 30 seconds to detect remote changes (less frequent than attempt status polling)
- Button text is "Update" (not "Rebase") to differentiate from attempt-level operations
