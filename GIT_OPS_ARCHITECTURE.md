# Git Operations UI - Architecture & Component Tree

## Component Hierarchy

```
Task View / IDE Integration
    |
    ├─ GitActionsDialog (Modal)
    |   ├─ Dialog (shadcn component)
    |   │   ├─ DialogHeader
    |   │   │   └─ DialogTitle: "Git Actions"
    |   │   │
    |   │   └─ DialogContent
    |   │       ├─ Error Alert (red box)
    |   │       │   └─ Error message from setGitError()
    |   │       │
    |   │       └─ GitOperations
    |   │           ├─ Merge Button + Tooltip
    |   │           ├─ PR Button + Tooltip
    |   │           └─ Rebase Button + Tooltip
    |   │
    |   └─ Loader (while loading)
    │
    └─ CreatePRDialog (Modal - Nested)
        ├─ Dialog
        │   ├─ DialogHeader
        │   │   └─ "Create GitHub Pull Request"
        │   │
        │   └─ DialogContent
        │       ├─ Title Input (pre-filled)
        │       ├─ Description Textarea (pre-filled)
        │       ├─ Base Branch Selector (dropdown)
        │       └─ Error Alert (red box)
        │
        └─ DialogFooter
            ├─ Cancel Button
            └─ Create PR Button (with spinner on loading)
```

---

## Data Flow Diagram

```
User Interaction
    |
    v
[GitOperations Component]
    |
    ├─ Branch Status Hook (useBranchStatus)
    |   └─> Backend API: GET /branches/{attemptId}/status
    |       └─> Returns: BranchStatus
    |           ├─ commits_ahead/behind
    |           ├─ conflicted_files[]
    |           ├─ merges[]
    |           └─ conflict_op
    |
    └─ Mutation Hooks
        |
        ├─ Merge Operation (useMerge)
        |   ├─> Backend API: POST /attempts/{attemptId}/merge
        |   └─> Invalidate Queries: [branchStatus, projectBranches]
        |
        ├─ Push Operation (usePush)
        |   ├─> Backend API: POST /attempts/{attemptId}/push
        |   └─> Invalidate Queries: [branchStatus]
        |
        └─ Rebase Operation (useRebase)
            ├─> Backend API: POST /attempts/{attemptId}/rebase
            └─> Invalidate Queries: [branchStatus, projectBranches]
            └─> Returns: Result<void, GitOperationError>
                ├─ Success: branchStatus refreshes
                └─ Error: GitOperationError typed response
```

---

## State Management Structure

```
GitOperations Component State
├─ Operation States
│   ├─ merging: boolean
│   ├─ pushing: boolean
│   ├─ rebasing: boolean
│   ├─ mergeSuccess: boolean (auto-clears after 2s)
│   └─ pushSuccess: boolean (auto-clears after 2s)
│
├─ UI States
│   └─ showDetailedTooltips: {
│       ├─ merge: boolean
│       ├─ pr: boolean
│       └─ rebase: boolean
│     }
│
├─ Derived States (useMemo)
│   ├─ conflictsLikely: boolean
│   │   (hasConflictedFiles || hasBothModifications)
│   │
│   ├─ mergeInfo: {
│   │   ├─ hasOpenPR: boolean
│   │   ├─ openPR: Merge | null
│   │   ├─ hasMergedPR: boolean
│   │   ├─ mergedPR: Merge | null
│   │   ├─ hasMerged: boolean
│   │   └─ latestMerge: Merge | null
│   │ }
│   │
│   ├─ mergeButtonLabel: string
│   │   ("Merge", "Merging...", or "Merged!")
│   │
│   ├─ prButtonLabel: string
│   │   ("Create PR", "Push", "Pushing...", or "Pushed!")
│   │
│   ├─ rebaseButtonLabel: string
│   │   ("Rebase" or "Rebasing...")
│   │
│   └─ [Disabled Reasons]: string | null
│       ├─ getMergeDisabledReason
│       ├─ getPRDisabledReason
│       └─ getRebaseDisabledReason
│
└─ Props (External)
    ├─ selectedAttempt: TaskAttempt
    ├─ task: TaskWithAttemptStatus
    ├─ projectId: string
    ├─ branchStatus: BranchStatus | null
    ├─ branches: GitBranch[]
    ├─ isAttemptRunning: boolean
    └─ setError: (error: string | null) => void
```

---

## Tooltip Architecture

### Two-Level Tooltip System

```
Button Hover
    |
    v
┌─────────────────────────────────┐
│      Simple Tooltip (Default)    │
│  ─────────────────────────────  │
│  "Merge changes into target"    │
│  (One line description)         │
│  Click Info button for more info│
└─────────────────────────────────┘
    |
    | Click Info button
    v
┌──────────────────────────────────────────┐
│     Detailed Tooltip (Expanded)          │
│  ────────────────────────────────────── │
│  Title: "Merge and complete task"       │
│  ─────────────────────────────────────  │
│  Description: "This will merge your...  │
│  Your work will be integrated..."       │
│  ─────────────────────────────────────  │
│  [Conflict Warning if applicable]       │
│  "⚠️ Both you and the target branch     │
│   have modified the same files..."      │
│  ─────────────────────────────────────  │
│  Technical: "Backend: git merge..."     │
└──────────────────────────────────────────┘
    |
    | Button is disabled
    v
┌──────────────────────────────────┐
│    Disabled Reason Tooltip       │
│  ────────────────────────────── │
│  "Merge conflicts present"      │
│  (Shows why button is disabled) │
└──────────────────────────────────┘
```

---

## Conflict Detection Flow

```
BranchStatus Updates
    |
    v
Check: branchStatus.conflicted_files.length > 0
    |
    ├─ YES → conflictsLikely = true
    |
    └─ NO → Check: commits_ahead > 0 AND commits_behind > 0
        |
        ├─ YES → conflictsLikely = true
        |
        └─ NO → conflictsLikely = false

If conflictsLikely = true:
    |
    ├─ Disable merge/pr/rebase buttons
    |
    ├─ Change button colors to warning
    |
    ├─ Replace icons with AlertTriangle
    |
    ├─ Show conflict warning in tooltip:
    |   "⚠️ Both you and the target branch have..."
    |
    └─ Add files list to tooltip if available:
        └─ branchStatus.conflicted_files[]
```

---

## Error Handling Flow

```
User Clicks Button
    |
    v
Mutation Executed (useMerge/useRebase/usePush)
    |
    ├─ Success Path
    |   |
    |   ├─ Clear error: setError(null)
    |   ├─ Set success state: setMergeSuccess(true)
    |   ├─ Auto-clear after 2s
    |   ├─ Invalidate cached queries
    |   └─ Update UI (button label changes)
    |
    └─ Error Path
        |
        ├─ Catch error
        |   └─ error.message || t('git.errors.rebaseBranch')
        |
        ├─ For typed GitOperationError:
        |   ├─ if conflict → Don't show error (button stays disabled)
        |   └─ if other → Show error message
        |
        ├─ Display Error
        |   └─ setError(message)
        |   └─ Alert box appears in dialog
        |   └─ Red background (#fee2e2)
        |
        └─ User Resolution
            ├─ Fix issue in IDE
            ├─ Pull fresh branch status
            └─ Retry operation
```

---

## Button State Machine

```
┌──────────────────────────────────────────────────────────┐
│                    MERGE BUTTON States                   │
└──────────────────────────────────────────────────────────┘

[ENABLED, READY]
    |
    ├─ Icon: GitBranch (success color)
    ├─ Label: "Merge"
    ├─ Tooltip: Simple description
    ├─ Info Icon: Visible (clickable)
    └─ onClick → setMerging(true)
        |
        └─> [LOADING]
            |
            ├─ Icon: GitBranch (spinning or static)
            ├─ Label: "Merging..."
            ├─ Tooltip: "Merge in progress"
            ├─ Disabled: true
            └─ API Call...
                |
                ├─ Success → setMergeSuccess(true)
                |   |
                |   └─> [SUCCESS] (2s auto-clear)
                |       ├─ Icon: GitBranch
                |       ├─ Label: "Merged!"
                |       └─ Back to [ENABLED] after 2s
                |
                └─ Error → setError(message)
                    |
                    └─> [ERROR]
                        ├─ Icon: GitBranch
                        ├─ Label: "Merge"
                        ├─ Tooltip: Error reason
                        ├─ Alert box shown in dialog
                        └─ User must fix and retry

[DISABLED - Conflicts Present]
    |
    ├─ Icon: AlertTriangle (warning color)
    ├─ Label: "Merge"
    ├─ Tooltip: "Merge conflicts present"
    ├─ Color: warning (border/hover)
    └─ Info Icon: Visible (shows conflict details)

[DISABLED - Attempt Running]
    |
    ├─ Icon: GitBranch
    ├─ Label: "Merge"
    ├─ Tooltip: "Attempt is still running"
    └─ Info Icon: Hidden

[DISABLED - No Commits]
    |
    ├─ Icon: GitBranch
    ├─ Label: "Merge"
    ├─ Tooltip: "No commits ahead of base branch"
    └─ Info Icon: Hidden
```

---

## Translation Integration Points

```
useTranslation('tasks')
    |
    ├─ t('git.states.merge')           → Button labels
    ├─ t('git.states.merging')
    ├─ t('git.states.merged')
    |
    ├─ t('git.tooltips.merge.simple')  → Hover text
    ├─ t('git.tooltips.merge.title')   → Detailed view
    ├─ t('git.tooltips.merge.description')
    ├─ t('git.tooltips.merge.conflictWarning')  → Conditional
    ├─ t('git.tooltips.merge.technical')
    |
    ├─ t('git.errors.mergeChanges')    → Error messages
    ├─ t('git.errors.rebaseBranch')
    ├─ t('git.errors.pushChanges')
    |
    └─ Hard-coded Disabled Reasons     ← NEED TRANSLATION
        ├─ "PR already exists..."
        ├─ "Merge in progress"
        ├─ "Merge conflicts present"
        ├─ "Attempt is still running"
        └─ etc. (9 total strings)
```

---

## Integration Points with Other Systems

```
GitOperations Component
    |
    ├─ Dependencies
    |   ├─ useRebase(), useMerge(), usePush() hooks
    |   ├─ useBranchStatus() hook (passed as prop)
    |   ├─ useAttemptExecution() hook (via parent)
    |   ├─ useNavigate() from react-router-dom
    |   ├─ useTranslation() from react-i18next
    |   └─ Shadcn UI components (Tooltip, Button)
    |
    ├─ Parent Component: GitActionsDialog
    |   ├─ Provides: branchStatus, branches, gitError, setGitError
    |   ├─ Receives: setError callback
    |   └─ Can also show: GitActionsDialogContent with merged PR status
    |
    ├─ Child Component: CreatePRDialog (NiceModal)
    |   ├─ Triggered: via NiceModal.show('create-pr')
    |   ├─ Receives: attempt, task, projectId
    |   └─ Actions: Create PR, handle auth errors, close dialog
    |
    ├─ Rebase Dialog (Separate Modal)
    |   ├─ Triggered: via showModal('rebase-dialog')
    |   ├─ Receives: branches, initialTargetBranch, initialUpstreamBranch
    |   └─ Returns: { action, branchName, upstreamBranch }
    |
    └─ Backend API Calls
        ├─ /attempts/{attemptId}/merge
        ├─ /attempts/{attemptId}/push
        ├─ /attempts/{attemptId}/rebase
        ├─ /projects/{projectId}/branches
        └─ /attempts/{attemptId}/branch/status
```

---

## Branch Status Refresh Triggers

```
After Successful Operation
    |
    v
Query Client Invalidation
    |
    ├─ After Merge:
    |   ├─ invalidateQueries(['branchStatus', attemptId])
    |   └─ invalidateQueries(['projectBranches'])
    |
    ├─ After Push:
    |   └─ invalidateQueries(['branchStatus', attemptId])
    |
    └─ After Rebase:
        ├─ invalidateQueries(['branchStatus', attemptId])
        └─ invalidateQueries(['projectBranches'])
    |
    v
Auto-Refetch (React Query)
    |
    v
Component Re-render with Fresh Data
    |
    v
UI Updates
    ├─ Button states change
    ├─ Conflicts disappear/appear
    ├─ Merge info updates
    └─ PR status reflects changes
```

---

## Accessibility Considerations

```
GitOperations Component
    |
    ├─ ARIA Labels
    |   ├─ Button: aria-label={mergeButtonLabel}
    |   ├─ Button: aria-label={prButtonLabel}
    |   └─ Button: aria-label={rebaseButtonLabel}
    |
    ├─ Keyboard Navigation
    |   ├─ Tab through buttons
    |   ├─ Enter to activate
    |   ├─ Info icon clickable with Enter
    |   └─ Tooltip shows on focus
    |
    ├─ Screen Readers
    |   ├─ Disabled state communicated
    |   ├─ Tooltip content announced
    |   ├─ Alert box announced
    |   └─ Success states announced
    |
    └─ Color Contrast
        ├─ Warning color text on background
        ├─ Success color text on background
        ├─ Info color text on background
        └─ Meets WCAG AA standards (likely)
```

