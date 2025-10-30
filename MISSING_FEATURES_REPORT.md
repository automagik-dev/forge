# Missing Features Report - Git Diff v0.5.0-rc.3 vs Current

**Date**: 2025-10-29
**Comparison**: v0.5.0-rc.3 (tmp) vs current HEAD (excluding upstream/)

## Summary

Found **6 missing custom feature sets** from v0.5.0-rc.3 that need restoration:

### 1. Task Template System ✅ CRITICAL
**Files missing**:
- `frontend/src/components/TaskTemplateManager.tsx`
- `frontend/src/components/dialogs/tasks/TaskTemplateEditDialog.tsx`

**What it does**: Allows users to create reusable task templates (global or per-project) with predefined:
- Task descriptions
- Executor profiles
- Git branches
- Custom fields

**Backend support**: Already exists in forge-app `/api/forge/templates/*` routes

---

### 2. Authentication Gate System ✅ IMPORTANT
**Files missing**:
- `frontend/src/components/auth/AuthGate.tsx`

**What it does**:
- Checks `/api/forge/auth-required` endpoint
- Conditionally requires GitHub auth based on `AUTH_REQUIRED` env var
- Wraps entire app to enforce auth policy

**Backend support**: Already exists in forge-app

---

### 3. Keyboard Shortcuts System ✅ IMPORTANT
**Files missing**:
- `frontend/src/contexts/keyboard-shortcuts-context.tsx`
- `frontend/src/hooks/useKeyboardShortcut.ts`
- `frontend/src/components/shortcuts-help.tsx`

**What it does**:
- Centralized keyboard shortcut registry
- Scoped shortcuts (global, dialog, kanban)
- Dynamic enable/disable based on conditions
- Help dialog with `?` key showing all shortcuts
- Grouped by category (Dialog, Kanban, Global, etc.)

**Note**: User explicitly said to keep upstream shortcuts, NOT rc.3 version. But this is the HELP SYSTEM, not the shortcuts themselves.

---

### 4. Forge Attempt Creation Dialog ✅ IMPORTANT
**Files missing**:
- `frontend/src/components/dialogs/tasks/ForgeCreateAttemptDialog.tsx`

**What it does**:
- Enhanced attempt creation with Forge-specific features
- Integrates with ExecutorProfileSelector
- Branch selection
- Task templates integration
- Custom Omni executor options

**Backend support**: Already exists in forge-app

---

### 5. Kanban Widget Integration ⚠️ NEEDS REVIEW
**Files missing**:
- `frontend/src/components/tasks/KanbanHeaderWithWidget.tsx`

**What it does**: Integrates Genie Widget into Kanban header for quick AI access

**Status**: Need to verify if Genie Widget is already in current codebase

---

### 6. Storybook Components 🔵 OPTIONAL
**Files missing**:
- `frontend/src/components/genie-widgets/SubGenieWidget.stories.tsx`

**What it does**: Storybook stories for Genie Widget development

**Priority**: Low - development tooling only

---

## Files Intentionally NOT Restored

### MCP Server Files (✅ CORRECT - Using Upstream MCP)
- `forge-app/src/bin/forge_mcp_advanced_server.rs`
- `forge-app/src/bin/forge_mcp_task_server.rs`
- `forge-app/src/mcp/*.rs`

**Reason**: User integrated 51 advanced tools into upstream MCP. We use upstream's MCP, not forge-app's.

### Build Artifacts & Temporary Files
- `.sqlx/*.json` (258 files - SQLx compile-time verification cache)
- `frontend-OLD-DELETE-AFTER-TESTING/*` (old frontend backup)
- `.github/*` (workflows, templates - updated separately)
- `analysis/*`, `docs/*` (development notes)
- `scripts/*` (various dev scripts)

### Deprecated Features
- `frontend/src/shims/node-*.ts` (Vite 5 doesn't need these)
- `frontend/tailwind.config.cjs` (migrated to .ts)
- `frontend/postcss.config.cjs` (migrated to .mjs)

---

## Action Plan

1. **Restore Task Templates** (TaskTemplateManager + TaskTemplateEditDialog)
2. **Restore AuthGate** (conditional auth enforcement)
3. **Review Keyboard Shortcuts** (Help system only - keep upstream shortcuts)
4. **Restore ForgeCreateAttemptDialog** (enhanced attempt creation)
5. **Review KanbanHeaderWithWidget** (verify Genie Widget exists first)
6. **Test Integration** (ensure all restored features work with current codebase)

---

## Notes

- All backend support already exists in forge-app
- No upstream modifications needed
- Focus on extracting **functionality**, not copying old code
- Verify each component works with current dependency versions
- Test with current TypeScript types from `shared/types.ts`
