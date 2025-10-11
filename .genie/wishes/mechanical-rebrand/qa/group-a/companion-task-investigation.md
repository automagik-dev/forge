# companion-install-task.ts Investigation

## Question
"WTF is this companion-task? I didn't develop this - should be in upstream?"

## Answer
**YES, it EXISTS in upstream!** Only branding text differs.

## File Comparison

**Upstream:** `upstream/frontend/src/utils/companion-install-task.ts`
**Forge:** `forge-overrides/frontend/src/utils/companion-install-task.ts`

### Differences (2 lines only):

```diff
- 'Install and integrate Vibe Kanban Web Companion';
+ 'Install and integrate Automagik Omni Companion';

- vibe-kanban-web-companion
+ web companion
```

**All other 34 lines are identical.**

## What It Actually Does

### Purpose
Provides a **template task description** for AI agents to install the vibe-kanban-web-companion package.

### Usage Location
`upstream/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx`
- Lines 23-24: Imports COMPANION_INSTALL_TASK_TITLE and DESCRIPTION
- Lines 128-129: Uses them when creating a task

### What vibe-kanban-web-companion is
An npm package that provides browser UI components for integration.

### The Task Template Content
Instructions for AI agent to:
1. Detect package manager (pnpm/yarn/npm/bun)
2. Install `vibe-kanban-web-companion` package
3. Detect framework (Next.js/Vite/CRA)
4. Import `<VibeKanbanWebCompanion />` component
5. Render at app root
6. Verify build/type-check passes

## Decision

### ❌ Do NOT move to upstream
**Reason:** Already exists in upstream with identical logic!

### ❌ Do NOT delete from forge-overrides  
**Reason:** Branding text "Automagik Omni Companion" is correct for Forge.

### ✅ KEEP in forge-overrides as branding override
**Reason:** 
- Forge rebrand changes "Vibe Kanban" → "Automagik"
- This override applies that rebrand to the task template
- Group B rebrand script will handle this automatically

## Categorization Update

**Previous:** Listed in "files-to-move-upstream.txt"
**Correct:** This is a **branding override** (like dialog text)

**New Category:** 
- **Type:** Branding-only override (but must KEEP)
- **Action:** KEEP in forge-overrides
- **Reason:** Will be handled by Group B mechanical rebrand script
- **Note:** Not a deletion candidate because it applies legitimate branding

## Summary

- ✅ Exists in upstream
- ✅ Only 2 lines differ (branding text)
- ✅ Should KEEP in forge-overrides (not move, not delete)
- ✅ Will be automated by Group B rebrand script
- ❌ NOT a manual upstream migration item
