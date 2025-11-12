# Git Operations UI Implementation - Codebase Exploration Report

## 1. CURRENT GIT OPERATIONS IMPLEMENTATION

### 1.1 Main Component: GitOperations.tsx
**Location:** `/frontend/src/components/tasks/Toolbar/GitOperations.tsx`

#### Core Features:
- **Three Git Action Buttons:**
  1. **Merge Button** - Merges changes into target branch
  2. **PR Button** - Creates PR or pushes to existing PR
  3. **Rebase Button** - Rebases onto target branch

#### Button States & Props:
- `selectedAttempt`: The task attempt being worked on
- `task`: TaskWithAttemptStatus containing merge/attempt info
- `branchStatus`: Git status (commits ahead/behind, conflicts, merges)
- `isAttemptRunning`: Prevents actions while attempt is running
- `branches`: Available branches for UI display

#### State Management:
- **Local States:** `merging`, `pushing`, `rebasing`, `mergeSuccess`, `pushSuccess`
- **Detailed Tooltips Toggle:** `showDetailedTooltips` object tracks which tooltip is expanded
- **Conflict Detection:**
  ```typescript
  conflictsLikely = (branchStatus.conflicted_files?.length > 0) || 
                    (commits_ahead > 0 AND commits_behind > 0)
  ```

### 1.2 Tooltip System (Active Pattern)
**Pattern Used:** Shadcn Tooltip + lucide-react Info button

#### Two-Level Tooltip System:
1. **Simple Tooltip** - Basic action description
2. **Detailed Tooltip** - Multi-part information with conflict warnings

#### Structure for Each Button:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button>
      {icon}
      {label}
      {!disabled && <Info icon onClick={toggle} />}  // Optional info button
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    {disabledReason || (showDetailed ? detailedView : simpleView)}
  </TooltipContent>
</Tooltip>
```

#### Conflict Warning Display:
- Warning appears in detailed tooltip: `⚠️ Merge conflicts present`
- Button border changes to warning color when conflicts likely
- Icon changes to AlertTriangle when conflicts detected

### 1.3 Disabled State Reasons

#### Merge Button Disabled When:
```javascript
- PR already exists for this branch
- Merge in progress
- Merge conflicts present
- Attempt is still running
- No commits ahead of base branch
```

#### PR Button Disabled When:
```javascript
- Push in progress
- Attempt is still running
- Merge conflicts present
- No commits to create/push
```

#### Rebase Button Disabled When:
```javascript
- Rebase in progress
- Attempt is still running
- Merge conflicts present
- Branch is already up-to-date
```

### 1.4 API Hooks (Mutations)

#### useRebase Hook
**File:** `/frontend/src/hooks/useRebase.ts`
- Returns typed error: `Result<void, GitOperationError>`
- Detects conflict types: `merge_conflicts`, `rebase_in_progress`
- Invalidates queries: `branchStatus`, `projectBranches`

#### useMerge Hook
**File:** `/frontend/src/hooks/useMerge.ts`
- Simple mutation with onSuccess/onError callbacks
- Invalidates: `branchStatus`, `projectBranches`

#### usePush Hook
**File:** `/frontend/src/hooks/usePush.ts`
- Simple mutation with onSuccess/onError callbacks
- Invalidates: `branchStatus`

### 1.5 Error Handling
- Error messages set via `setError()` callback
- Displayed in GitActionsDialog as red alert box
- Clears on successful operation
- Specific conflict messages shown in disabled reasons

---

## 2. GIT STATUS & TYPE DEFINITIONS

### 2.1 BranchStatus Type (from shared/types.ts)
```typescript
export type BranchStatus = {
  commits_behind: number | null,
  commits_ahead: number | null,
  has_uncommitted_changes: boolean | null,
  head_oid: string | null,
  uncommitted_count: number | null,
  untracked_count: number | null,
  target_branch_name: string,
  remote_commits_behind: number | null,
  remote_commits_ahead: number | null,
  merges: Array<Merge>,
  is_rebase_in_progress: boolean,
  conflict_op: ConflictOp | null,  // "rebase" | "merge" | "cherry_pick" | "revert"
  conflicted_files: Array<string>  // List of files in conflicted state
}
```

### 2.2 Merge Types
```typescript
export type Merge = 
  | { "type": "direct", id, task_attempt_id, merge_commit, target_branch_name, created_at }
  | { "type": "pr", id, task_attempt_id, created_at, target_branch_name, pr_info }

export type MergeStatus = "open" | "merged" | "closed" | "unknown"

export type PullRequestInfo = {
  number: bigint,
  url: string,
  status: MergeStatus,
  merged_at: string | null,
  merge_commit_sha: string | null
}
```

### 2.3 Conflict Type
```typescript
export type GitOperationError = 
  | { "type": "merge_conflicts", message: string, op: ConflictOp }
  | { "type": "rebase_in_progress" }
```

---

## 3. TRANSLATION STRUCTURE (i18n)

### 3.1 Key File
**File:** `/frontend/src/i18n/locales/en/tasks.json`

### 3.2 Git Operations Keys
```json
{
  "git": {
    "labels": {
      "taskBranch": "Task Branch"
    },
    "status": {
      "commits_one": "commit",
      "commits_other": "commits",
      "conflicts": "Conflicts",
      "upToDate": "Up to date",
      "ahead": "ahead",
      "behind": "behind"
    },
    "states": {
      "merged": "Merged!",
      "merging": "Merging...",
      "merge": "Merge",
      "rebasing": "Rebasing...",
      "rebase": "Rebase",
      "pushed": "Pushed!",
      "pushing": "Pushing...",
      "push": "Push",
      "createPr": "Create PR"
    },
    "errors": {
      "changeTargetBranch": "Failed to change target branch",
      "pushChanges": "Failed to push changes",
      "mergeChanges": "Failed to merge changes",
      "rebaseBranch": "Failed to rebase branch"
    },
    "tooltips": {
      "merge": {
        "simple": "Merge changes into target branch",
        "title": "Merge and complete task",
        "description": "This will merge your changes from the task branch into the target branch. Your work will be integrated and the task can be marked as complete.",
        "technical": "Backend: git merge operation",
        "conflictWarning": "Both you and the target branch have modified the same files. Manual conflict resolution may be required."
      },
      "createPr": {
        "simple": "Create pull request",
        "title": "Create pull request and share work",
        "description": "This will push your changes to the remote repository and create a pull request for team review.",
        "steps": "1. Push to remote branch, 2. Create PR with task details, 3. Notify team",
        "technical": "Backend: git push + GitHub API",
        "conflictWarning": "Your changes conflict with the target branch. Resolve conflicts before creating PR."
      },
      "push": {
        "simple": "Push changes to PR",
        "title": "Push updates to pull request",
        "description": "This will push your latest changes to the existing pull request.",
        "technical": "Backend: git push",
        "conflictWarning": "Your changes conflict with the target branch. Resolve conflicts before pushing."
      },
      "rebase": {
        "simple": "Rebase onto target branch",
        "title": "Rebase and update with latest changes",
        "description": "This will rebase your task branch onto the latest target branch. Your commits will be replayed on top of the target branch's latest changes.",
        "technical": "Backend: git fetch + git rebase",
        "conflictWarning": "The target branch has changes that may conflict with your work. You may need to resolve conflicts during rebase."
      }
    }
  }
}
```

### 3.3 Translation Support
- **Languages:** English (en), Portuguese-BR (pt-BR), Spanish (es), Japanese (ja), Korean (ko)
- **i18n Setup:** react-i18next with namespaces (en/tasks.json, etc.)
- **Usage:** `const { t } = useTranslation('tasks');`

---

## 4. DIALOG COMPONENTS

### 4.1 GitActionsDialog
**File:** `/frontend/src/components/dialogs/tasks/GitActionsDialog.tsx`
- Shows merged PR status OR GitOperations component
- Error display at top in red alert box
- Title: "Git Actions" (translated)

### 4.2 CreatePRDialog
**File:** `/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx`
- Title input (pre-filled with task title + "(automagik-forge)")
- Description textarea (pre-filled with task description)
- Base branch selector (defaults to task target_branch)
- Error handling for GitHub auth/permissions
- Loading state with spinner

### 4.3 RebaseDialog (Modal Dialog)
- Shown via `showModal('rebase-dialog', {...})`
- Allows selecting new target branch and upstream branch
- Returns action: 'confirmed' | 'canceled' + branch selections

---

## 5. VISUAL STYLING PATTERNS

### 5.1 Button Styling
```tsx
// Default colors based on operation type
Merge: "border-success text-success hover:bg-success"
PR: "border-info text-info hover:bg-info"
Rebase: "border-warning text-warning hover:bg-warning"

// When conflicts detected:
"border-warning text-warning hover:bg-warning"

// With AlertTriangle icon replacing normal icon
```

### 5.2 Info Button Pattern
- Small (h-3 w-3) Info icon
- Opacity 50 normal, 100 on hover
- Positioned at end of button text
- Click toggles detailed tooltip
- Only shows when button not disabled/processing

### 5.3 Toast-like Success Messages
```typescript
setMergeSuccess(true);
setTimeout(() => setMergeSuccess(false), 2000);  // Clear after 2 seconds
```

---

## 6. CONFLICT DETECTION & WARNING SYSTEM

### 6.1 Detection Method
```typescript
const conflictsLikely = useMemo(() => {
  if (!branchStatus) return false;
  
  const hasConflictedFiles = (branchStatus.conflicted_files?.length ?? 0) > 0;
  const hasBothModifications = 
    (branchStatus.commits_ahead ?? 0) > 0 && 
    (branchStatus.commits_behind ?? 0) > 0;
  
  return hasConflictedFiles || hasBothModifications;
}, [branchStatus]);
```

### 6.2 Visual Indicators
1. Button border turns to warning color
2. Button icon changes to AlertTriangle
3. Tooltip shows warning message
4. Warning message in detailed tooltip view

### 6.3 Files List
- Stored in `branchStatus.conflicted_files: Array<string>`
- Can be displayed for user reference
- Used in warning calculations

---

## 7. MERGE STATE CALCULATIONS

### 7.1 Merge Info Memoization
Extracts and organizes merge data:
- `hasOpenPR`: Has open/review PR
- `openPR`: The open PR object
- `hasMergedPR`: Has merged PR
- `mergedPR`: The merged PR object
- `hasMerged`: Has any successful merge (direct or PR)
- `latestMerge`: Most recent merge record

### 7.2 PR Button Logic
- If PR already open → Button becomes "Push" (to update PR)
- If no PR → Button is "Create PR"
- Push success shows "Pushed!" label

### 7.3 Panel Visibility
- GitOperations panel hides if PR already merged
- Shows merged PR URL/number in GitActionsDialogContent

---

## 8. FILE ORGANIZATION

### Frontend Structure:
```
frontend/src/
├── components/
│   ├── tasks/Toolbar/
│   │   └── GitOperations.tsx          # Main git action buttons
│   └── dialogs/tasks/
│       ├── GitActionsDialog.tsx       # Dialog wrapper
│       └── CreatePRDialog.tsx         # PR creation form
├── hooks/
│   ├── useRebase.ts                   # Rebase mutation
│   ├── useMerge.ts                    # Merge mutation
│   └── usePush.ts                     # Push mutation
└── i18n/
    └── locales/
        ├── en/tasks.json              # English translations
        ├── pt-BR/tasks.json           # Portuguese translations
        ├── es/tasks.json              # Spanish translations
        ├── ja/tasks.json              # Japanese translations
        └── ko/tasks.json              # Korean translations
```

### Shared Types:
```
shared/
└── types.ts                           # Generated from Rust (DO NOT EDIT)
```

---

## 9. CURRENT UI/UX FLOW

### 9.1 Button Visibility
All three buttons visible when:
- Branch status loaded
- No PR merged (otherwise entire panel hides)

### 9.2 Interaction Flows

#### Merge Flow:
1. User clicks "Merge" button
2. Button becomes disabled if conditions met
3. On click → `performMerge()` via hook
4. On success → "Merged!" label shows, clears after 2s
5. On error → Error message displayed in dialog

#### PR Flow:
1. User clicks "Create PR" (or "Push" if PR exists)
2. Create PR → ShowModal('create-pr', {...})
3. Dialog shows pre-filled form
4. User can edit title/description/base branch
5. On submit → Attempts to create PR
6. On auth error → GitHub login dialog shown
7. On permission error → PAT entry dialog shown
8. On success → Modal closes, PR button becomes "Push"

#### Rebase Flow:
1. User clicks "Rebase"
2. Rebase dialog opens with branch selectors
3. User selects base and upstream branches
4. On confirm → `handleRebaseWithNewBranchAndUpstream()`
5. Conflicts may appear during rebase
6. On error → Conflict details shown in disabled reason

---

## 10. ERROR HANDLING PATTERNS

### 10.1 Types of Errors
1. **Disabled Button Reasons** - Shown in tooltip when button disabled
2. **Operation Errors** - Shown in red alert box in dialog
3. **Git-Specific Errors** - `GitOperationError` type with merge_conflicts/rebase_in_progress

### 10.2 Error Display
- Disabled reason in tooltip (hover to see why button is disabled)
- Alert box for operation failures
- Specific conflict warning messages
- Generic fallback: "Failed to [action] changes"

### 10.3 Error Recovery
- Manual conflict resolution required (button stays disabled)
- User must resolve conflicts in IDE
- Fresh fetch of branch status shows updated conflict state
- Some errors auto-clear on refresh

---

## 11. KEY OBSERVATIONS

### Current Strengths:
1. **Multi-level tooltips** provide context without overwhelming users
2. **Conflict detection** visual cues (color change, icon swap)
3. **State tracking** prevents invalid operations
4. **Translation ready** with full i18n support
5. **Error context** with disabled reasons explains why actions unavailable
6. **Pre-filled forms** make PR creation faster
7. **Typed errors** from API (GitOperationError) for precise handling

### Areas with Missing Context:
1. **Tooltip copy** is hardcoded (not all i18n'd - see conflictWarning)
2. **Button tooltips** don't update based on conflict status dynamically
3. **Conflict resolution UI** exists but flow not in this component
4. **Rebase dialog** implementation separate (not in GitOperations.tsx)
5. **Some disabled reasons** are hardcoded strings (should be translated)

---

## 12. RELATED FILES TO INVESTIGATE

1. `/frontend/src/hooks/useBranchStatus.ts` - Fetches branch status
2. `/frontend/src/contexts/ExecutionProcessesContext.tsx` - Process tracking
3. `shared/types.ts` - All type definitions (generated, read-only)
4. GitHub API integration hooks - For PR operations
5. Modal/Dialog routing system (NiceModal setup)
6. Rebase dialog implementation (separate modal)

