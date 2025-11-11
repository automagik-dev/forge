# Git Operations UI - Documentation Index

This directory contains comprehensive exploration and documentation of the Git Operations UI implementation.

## Documentation Files

### 1. **EXPLORATION_SUMMARY.txt** (START HERE)
Quick overview of what was explored and key findings.
- Scope covered
- Key files locations
- Identified issues
- Testing recommendations

### 2. **GIT_OPS_EXPLORATION.md** (DETAILED REFERENCE)
Comprehensive deep-dive into the implementation.
- Current git operations UI (GIT operations.tsx)
- Where buttons are rendered
- Tooltip patterns
- Translation structure (i18n setup)
- Git status display
- Error handling patterns
- Conflict detection
- All 12 sections of detailed analysis

### 3. **GIT_OPS_QUICK_REFERENCE.md** (DEVELOPER CHEAT SHEET)
Fast lookup guide for developers.
- Key files table
- Code snippets
- Translation keys checklist
- Type definitions
- Component props
- State management
- Testing checklist

### 4. **GIT_OPS_ARCHITECTURE.md** (VISUAL ARCHITECTURE)
Visual flows and component structure.
- Component hierarchy tree
- Data flow diagrams
- State management structure
- Tooltip system architecture
- Conflict detection flow
- Error handling flow
- Button state machine
- Integration points
- Accessibility features

---

## Key Findings Summary

### What Was Explored ✓

1. **Current Implementation**
   - GitOperations.tsx: Main component with 3 buttons (Merge, PR, Rebase)
   - Two-level tooltip system (simple + detailed)
   - Conflict detection with visual warnings
   - Typed error handling

2. **UI Components**
   - GitActionsDialog: Modal wrapper
   - CreatePRDialog: PR creation form
   - RebaseDialog: Separate modal for branch selection

3. **Data & Types**
   - BranchStatus: Git status information
   - GitOperationError: Typed error responses
   - Merge: PR and direct merge tracking

4. **Internationalization**
   - 5 languages supported (en, pt-BR, es, ja, ko)
   - Translation files in place
   - i18next integration

5. **Error Handling**
   - Conflict detection
   - Operation validation
   - User-friendly error messages
   - Typed API responses

---

## Issues Identified

### Hard-coded Strings (Not Translated)
9 disabled button reasons appear as hard-coded strings in GitOperations.tsx:
- "PR already exists for this branch"
- "Merge in progress"
- "Merge conflicts present"
- "Attempt is still running"
- "No commits ahead of base branch"
- "Push in progress"
- "No commits to create PR"
- "Rebase in progress"
- "Branch is already up-to-date"

**Impact**: When UI language is changed, these messages won't translate.

---

## File Locations

### Main Components
```
frontend/src/components/
├── tasks/Toolbar/
│   └── GitOperations.tsx           (555 lines)
└── dialogs/tasks/
    ├── GitActionsDialog.tsx        (172 lines)
    └── CreatePRDialog.tsx          (215 lines)
```

### Hooks
```
frontend/src/hooks/
├── useRebase.ts                    (63 lines)
├── useMerge.ts                     (31 lines)
└── usePush.ts                      (27 lines)
```

### Translations
```
frontend/src/i18n/locales/
├── en/tasks.json                   (336 lines)
├── pt-BR/tasks.json
├── es/tasks.json
├── ja/tasks.json
└── ko/tasks.json
```

### Type Definitions
```
shared/types.ts (auto-generated, read-only)
```

---

## How to Use These Docs

### For Understanding the Current System
→ Read **EXPLORATION_SUMMARY.txt** first (2 min)
→ Then **GIT_OPS_EXPLORATION.md** (10 min)

### For Implementing Changes
→ Use **GIT_OPS_QUICK_REFERENCE.md** to find code patterns
→ Check **GIT_OPS_ARCHITECTURE.md** for component relationships

### For Visual Learners
→ Start with **GIT_OPS_ARCHITECTURE.md** component trees
→ Reference **GIT_OPS_EXPLORATION.md** for code details

### For Fixing Bugs
→ Check "Issues Identified" section above
→ Use Quick Reference for code locations
→ Follow patterns from Architecture docs

---

## Key Code Patterns

### Two-Level Tooltips
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button>
      {icon}
      {label}
      {!disabled && <Info onClick={toggleTooltip} />}
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    {disabledReason || (showDetailed ? detailed : simple)}
  </TooltipContent>
</Tooltip>
```

### Conflict Detection
```tsx
const conflictsLikely = useMemo(() => {
  const hasConflictedFiles = (branchStatus?.conflicted_files?.length ?? 0) > 0;
  const hasBothModifications = 
    (branchStatus?.commits_ahead ?? 0) > 0 && 
    (branchStatus?.commits_behind ?? 0) > 0;
  return hasConflictedFiles || hasBothModifications;
}, [branchStatus]);
```

### Error Handling
```tsx
catch (error: any) {
  setError(error.message || t('git.errors.pushChanges'));
}
```

---

## Testing Checklist

### Visual
- [ ] Button colors change with conflict state
- [ ] Icons change (GitBranch → AlertTriangle) 
- [ ] Tooltips expand/collapse correctly
- [ ] Success messages appear and clear

### Functional
- [ ] All buttons trigger correct API calls
- [ ] Disabled reasons shown in tooltips
- [ ] Errors display in alert box
- [ ] Conflicts prevent invalid operations
- [ ] PR button switches "Create PR" → "Push"

### i18n
- [ ] Switch language - all text translates
- [ ] Disabled reasons translate (once added)
- [ ] Tooltip content translates
- [ ] Error messages translate

---

## Translation Keys

### Complete (Ready to Use)
- git.tooltips.merge.*
- git.tooltips.createPr.*
- git.tooltips.push.*
- git.tooltips.rebase.*
- git.states.*
- git.errors.*

### Missing (Hard-coded)
- git.disabledReasons.prExists
- git.disabledReasons.mergeInProgress
- git.disabledReasons.conflictsPresent
- git.disabledReasons.attemptRunning
- git.disabledReasons.noCommitsAhead
- git.disabledReasons.pushInProgress
- git.disabledReasons.noCommitsToCreate
- git.disabledReasons.rebaseInProgress
- git.disabledReasons.alreadyUpToDate

---

## Next Steps

1. **For i18n Issues**: Extract hard-coded strings to translation keys
2. **For Feature Work**: Use GitOperations.tsx as pattern
3. **For Bug Fixes**: Check conflict detection and error display
4. **For Testing**: Follow testing checklist above

---

## Questions?

Refer to the detailed documents:
- **What does this component do?** → EXPLORATION_SUMMARY.txt
- **Where is this code?** → GIT_OPS_QUICK_REFERENCE.md
- **How does it work?** → GIT_OPS_EXPLORATION.md
- **How does it fit together?** → GIT_OPS_ARCHITECTURE.md

---

Generated: November 11, 2025
