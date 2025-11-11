# Git Operations UI - Quick Reference Guide

## Key Files at a Glance

| File | Purpose | Key Content |
|------|---------|-------------|
| `frontend/src/components/tasks/Toolbar/GitOperations.tsx` | Main UI component | 3 buttons (Merge, PR, Rebase) with tooltips |
| `frontend/src/components/dialogs/tasks/GitActionsDialog.tsx` | Modal wrapper | Displays error alerts + GitOperations |
| `frontend/src/components/dialogs/tasks/CreatePRDialog.tsx` | PR creation form | Title, description, branch selector |
| `frontend/src/hooks/useRebase.ts` | Rebase mutation | API call + error handling |
| `frontend/src/hooks/useMerge.ts` | Merge mutation | API call + cache invalidation |
| `frontend/src/hooks/usePush.ts` | Push mutation | API call + cache invalidation |
| `frontend/src/i18n/locales/en/tasks.json` | English translations | All tooltip + error messages |
| `shared/types.ts` | Type definitions | BranchStatus, GitOperationError, etc. |

---

## Quick Code Reference

### Button Disabled Reasons (Hard-coded - Need Translation)
```tsx
// Lines 169-205 in GitOperations.tsx
"PR already exists for this branch"
"Merge in progress"
"Merge conflicts present"
"Attempt is still running"
"No commits ahead of base branch"
"Push in progress"
"No commits to create PR"
"Rebase in progress"
"Branch is already up-to-date"
```

### Tooltip Keys (In tasks.json)
```json
git.tooltips.merge.{simple, title, description, conflictWarning, technical}
git.tooltips.createPr.{simple, title, description, steps, conflictWarning, technical}
git.tooltips.push.{simple, title, description, conflictWarning, technical}
git.tooltips.rebase.{simple, title, description, conflictWarning, technical}
```

### Conflict Detection Logic
```tsx
const conflictsLikely = useMemo(() => {
  if (!branchStatus) return false;
  const hasConflictedFiles = (branchStatus.conflicted_files?.length ?? 0) > 0;
  const hasBothModifications = 
    (branchStatus.commits_ahead ?? 0) > 0 && 
    (branchStatus.commits_behind ?? 0) > 0;
  return hasConflictedFiles || hasBothModifications;
}, [branchStatus]);
```

### Error Extraction from Hook Response
```tsx
catch (error: any) {
  setError(error.message || t('git.errors.pushChanges'));
}

// For rebase with typed error:
catch ((err: Err<GitOperationError>) => {
  const isConflict = err?.error?.type === 'merge_conflicts' || 
                     err?.error?.type === 'rebase_in_progress';
  if (!isConflict) setError(err.message || t('git.errors.rebaseBranch'));
}
```

### Success Message with Auto-clear
```tsx
setMergeSuccess(true);
setTimeout(() => setMergeSuccess(false), 2000);
```

### Tooltip Trigger Pattern
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button onClick={handler} disabled={isDisabled}>
        {icon}
        {label}
        {!disabled && <Info className="..." onClick={toggleTooltip} />}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      {disabledReason || (showDetailed ? detailed : simple)}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Translation Keys Checklist

### Existing in tasks.json:
- ✅ git.tooltips.merge.* (5 keys)
- ✅ git.tooltips.createPr.* (5 keys)
- ✅ git.tooltips.push.* (4 keys)
- ✅ git.tooltips.rebase.* (5 keys)
- ✅ git.states.* (9 keys for button labels)
- ✅ git.errors.* (4 keys for operation errors)

### Missing/Hard-coded in Component:
- ❌ Disabled button reasons (see lines 169-205)
  - "PR already exists for this branch"
  - "Merge in progress"
  - "Merge conflicts present"
  - "Attempt is still running"
  - "No commits ahead of base branch"
  - "Push in progress"
  - "No commits to create PR"
  - "Rebase in progress"
  - "Branch is already up-to-date"

---

## Type Definitions Quick Reference

### BranchStatus
```typescript
conflicted_files: Array<string>           // Files in merge conflict
conflict_op: "rebase" | "merge" | null   // Current conflict operation
is_rebase_in_progress: boolean            // Rebase state
commits_ahead: number | null              // Local commits ahead
commits_behind: number | null             // Remote commits ahead
```

### GitOperationError
```typescript
{ "type": "merge_conflicts", message: string, op: ConflictOp }
{ "type": "rebase_in_progress" }
```

### Merge Info Type
```typescript
{
  hasOpenPR: boolean,           // PR exists in open/review state
  openPR: Merge | null,         // The open PR object
  hasMergedPR: boolean,         // PR has been merged
  mergedPR: Merge | null,       // The merged PR object
  hasMerged: boolean,           // Any merge (direct or PR)
  latestMerge: Merge | null     // Most recent merge
}
```

---

## Component Props Interface

```typescript
interface GitOperationsProps {
  selectedAttempt: TaskAttempt;
  task: TaskWithAttemptStatus;
  projectId: string;
  branchStatus: BranchStatus | null;
  branches: GitBranch[];
  isAttemptRunning: boolean;
  setError: (error: string | null) => void;
  selectedBranch: string | null;
  layout?: 'horizontal' | 'vertical';
}
```

---

## State Management Summary

### Local States in GitOperations:
```tsx
const [merging, setMerging] = useState(false);
const [pushing, setPushing] = useState(false);
const [rebasing, setRebasing] = useState(false);
const [mergeSuccess, setMergeSuccess] = useState(false);
const [pushSuccess, setPushSuccess] = useState(false);
const [showDetailedTooltips, setShowDetailedTooltips] = useState({
  merge: boolean,
  pr: boolean,
  rebase: boolean
});
```

### External Props:
```tsx
gitError: string | null           // From parent dialog
setGitError: (error) => void      // To update parent
branchStatus: BranchStatus | null // From useBranchStatus hook
isAttemptRunning: boolean         // From useAttemptExecution hook
```

---

## Button Visibility Logic

### Entire Panel Hides When:
```tsx
if (mergeInfo.hasMergedPR) {
  return null;  // Hide entire GitOperations component
}
```

### Individual Buttons:
```tsx
// All three buttons always visible when branchStatus exists
// Individual buttons become disabled based on conditions
// Disabled state shown in tooltip with reason
```

---

## Error Flow

1. **Operation Error** → Caught in hook/component
2. **Error Message** → Passed to `setError()`
3. **Display** → Red alert box in GitActionsDialog
4. **User Action** → Fix issue or try different action
5. **Clear** → `setError(null)` on successful operation

---

## Navigation After Success

### Merge Success:
- Button label: "Merged!" (2s then reverts)
- Dialog stays open
- User can close manually or attempt another action

### PR Creation Success:
- Dialog closes automatically
- PR button becomes "Push"
- Branch status refreshed

### Push Success:
- Button label: "Pushed!" (2s then reverts)
- Dialog stays open

---

## Testing Points

### Visual:
- [ ] Buttons appear in correct state
- [ ] Conflict warnings show (color, icon, text)
- [ ] Tooltips display correctly (simple/detailed)
- [ ] Info button appears/hides correctly
- [ ] Success messages animate and clear

### Functional:
- [ ] Disabled reasons shown in tooltip
- [ ] Buttons call correct handlers
- [ ] Errors display in alert box
- [ ] Conflicts prevent invalid operations
- [ ] PR logic switches button between "Create PR" and "Push"

### i18n:
- [ ] All visible text translated
- [ ] Disabled reasons appear in user language
- [ ] Tooltip content translated
- [ ] Error messages translated
