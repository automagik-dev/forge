# Automagik Forge Upstream Sync - Remaining Tasks

This document tracks all remaining differences between v0.5.0-rc.3 (our custom version) and current HEAD (after upstream v0.0.113 sync).

**Status**: 137 files differ between v0.5.0 and current version

## ✅ Completed Items

1. **Genie Widgets** - Fully restored (17 files)
2. **Release Notes Dialog** - Fixed with static releases.json
3. **Footer Component** - Fixed with NPM version checking
4. **Logo Component** - Restored theme-aware branding
5. **Navbar** - Restored custom branding with Discord
6. **DisclaimerDialog** - Removed Vibe Kanban docs link
7. **TasksLayout** - Simplified right panel structure
8. **DiffsPanel** - Added virtual scrolling for performance
9. **Auth Components** - Removed (as approved)
10. **Keyboard Shortcuts** - Removed custom version (use upstream)
11. **ForgeCreateAttemptDialog** - Removed (use upstream)
12. **Shims** - Removed (not needed)

## 🔴 Critical Missing Backend (`forge-app/` Crate)

### ⚠️ MAJOR DISCOVERY:

**WE HAD AN ENTIRE `forge-app/` CRATE THAT WAS LOST IN THE UPSTREAM SYNC!**

In v0.5.0, we had:
- `forge-app/` - Separate Rust crate that wraps upstream
- `forge-app/migrations/` - Our own migrations with `forge_` prefixed tables
- `forge-app/src/router.rs` - Router that mounts `/api/forge/*` routes alongside upstream `/api/*`
- `forge-app/src/mcp/` - MCP server wrappers
- `forge-app/src/bin/generate_forge_types.rs` - Type generator for `shared/forge-types.ts`
- `forge-app/src/services/` - Forge-specific services

### Architecture Pattern (v0.5.0):

```
forge-app/              ← Our extension layer
├── migrations/         ← forge_global_settings, forge_project_settings, forge_omni_notifications
├── src/
│   ├── router.rs      ← /api/forge/* + wraps /api/* from upstream
│   ├── mcp/           ← MCP server wrappers
│   └── services/      ← Forge services
└── upstream/          ← Git submodule (unchanged)
    └── crates/        ← Upstream code
```

This is a **LAYERED ARCHITECTURE** - not modifying upstream, but wrapping it!

### What Needs to be Restored:

**✅ We had all of this in v0.5.0:**

1. **`forge-app/Cargo.toml`** - Separate crate
2. **`forge-app/migrations/`** (3 files):
   - `20251008000001_forge_omni_tables.sql` - Forge tables (forge_global_settings, forge_project_settings, forge_omni_notifications)
   - `20251020000001_add_agent_task_status.sql` - Added 'agent' status
   - `20251027000000_create_forge_agents.sql` - Forge agents tables

3. **`forge-app/src/router.rs`** - Had these routes:
   - GET `/api/forge/auth-required`
   - GET/PUT `/api/forge/config`
   - GET/PUT `/api/forge/projects/{project_id}/settings`
   - GET `/api/forge/omni/status`
   - GET `/api/forge/omni/instances`
   - POST `/api/forge/omni/validate`
   - GET `/api/forge/omni/notifications`
   - GET `/api/forge/releases`
   - GET `/api/forge/master-genie/{attempt_id}/neurons`
   - GET `/api/forge/neurons/{neuron_attempt_id}/subtasks`
   - GET/POST `/api/forge/agents`

4. **`forge-app/src/mcp/`** - MCP server wrappers
5. **`forge-app/src/bin/generate_forge_types.rs`** - Type generator
6. **`forge-app/src/services/notification_hook.rs`** - Omni notification service

### Action Required:

**Restore the entire `forge-app/` directory from v0.5.0!**

This is not about modifying upstream - it's about restoring our wrapper layer.

## 📋 Frontend Files to Review

### High Priority (User Customizations)

| File | Status | Description | Action Needed |
|------|--------|-------------|---------------|
| `public/forge-clear.png` | ❌ DELETED | Dark theme logo PNG | ✅ Have SVG version |
| `public/forge-dark.png` | ❌ DELETED | Light theme logo PNG | ✅ Have SVG version |
| `public/favicon*.png` | ❌ DELETED | Old favicons | Check if new ones exist |
| `public/ide/cursor.svg` | ❌ DELETED | Cursor IDE icon | Check if still used |
| `public/ide/windsurf.svg` | ❌ DELETED | Windsurf IDE icon | Check if still used |
| `contexts/keyboard-shortcuts-context.tsx` | ❌ DELETED | Custom shortcuts | ✅ Approved removal |
| `hooks/useKeyboardShortcut.ts` | ❌ DELETED | Custom shortcuts | ✅ Approved removal |
| `components/shortcuts-help.tsx` | ❌ DELETED | Custom shortcuts | ✅ Approved removal |
| `components/tasks/KanbanHeaderWithWidget.tsx` | ❌ DELETED | Column header customization | Need to check if replaced |

### Medium Priority (Configuration & Settings)

| File | Status | Description | Action Needed |
|------|--------|-------------|---------------|
| `pages/settings/ProjectSettings.tsx` | ✅ ADDED | New upstream feature | Review changes |
| `pages/full-attempt-logs.tsx` | ✅ ADDED | New upstream feature | Review changes |
| `contexts/ApprovalFormContext.tsx` | ✅ ADDED | New upstream feature | Review changes |
| `hooks/useProjects.ts` | ✅ ADDED | New upstream hook | Review changes |
| `hooks/useScriptPlaceholders.ts` | ✅ ADDED | New upstream hook | Review changes |
| `pages/settings/AgentSettings.tsx` | 🔄 MODIFIED | Settings page | Check for improvements |
| `pages/settings/GeneralSettings.tsx` | 🔄 MODIFIED | Settings page | Check for improvements |
| `pages/settings/McpSettings.tsx` | 🔄 MODIFIED | Settings page | Check for improvements |

### Low Priority (Upstream Improvements)

| File | Status | Description | Action Needed |
|------|--------|-------------|---------------|
| `components/ui/ActionsDropdown.tsx` | 🔄 MODIFIED | UI improvements | Review changes |
| `components/ui/file-search-textarea.tsx` | 🔄 MODIFIED | UI improvements | Review changes |
| `components/ui/markdown-renderer.tsx` | 🔄 MODIFIED | UI improvements | Review changes |
| `components/NormalizedConversation/*.tsx` | 🔄 MODIFIED | Type changes | Current version uses `any` for compatibility |
| `hooks/useConversationHistory.ts` | 🔄 MODIFIED | Upstream updates | Review changes |
| `i18n/locales/*/*.json` | 🔄 MODIFIED | Translation updates | Auto-merge safe |

### Build & Configuration Files

| File | Status | Description | Action Needed |
|------|--------|-------------|---------------|
| `.eslintrc.cjs` | 🔄 MODIFIED | ESLint config | Check for improvements |
| `.prettierrc.json` | ✅ ADDED | Prettier config | Review settings |
| `postcss.config.cjs` | ❌ DELETED | PostCSS config | Check if needed |
| `tailwind.config.cjs` | ❌ DELETED | Tailwind config | Check replacement |
| `tsconfig.json` | 🔄 MODIFIED | TypeScript config | Review changes |
| `vite.config.ts` | 🔄 MODIFIED | Vite config | Review changes |
| `package.json` | 🔄 MODIFIED | Dependencies | Review changes |

## 🔧 Next Steps

### Phase 1: Critical Backend (Omni)
1. Create database migration for `forge_config` table
2. Implement `crates/services/src/omni.rs` service
3. Create `crates/server/src/routes/forge.rs` routes
4. Test Omni integration end-to-end

### Phase 2: Missing Assets
1. Check if new favicon files exist in upstream
2. Verify IDE icons (cursor.svg, windsurf.svg) are still needed
3. Confirm PNG logos are replaced by SVG versions

### Phase 3: Configuration Files
1. Review `.prettierrc.json` settings
2. Check why `postcss.config.cjs` was deleted
3. Review `tailwind.config` changes (cjs → mjs?)
4. Compare `tsconfig.json` and `vite.config.ts` improvements

### Phase 4: New Upstream Features
1. Review `ProjectSettings.tsx` page
2. Review `full-attempt-logs.tsx` page
3. Review `ApprovalFormContext.tsx` functionality
4. Test new hooks: `useProjects`, `useScriptPlaceholders`

### Phase 5: UI/UX Improvements
1. Review ActionsDropdown simplifications
2. Review file-search-textarea improvements
3. Review markdown-renderer updates
4. Check conversation history improvements

### Phase 6: Type Safety & Code Quality
1. Review NormalizedConversation type changes
2. Consider restoring stricter types where possible
3. Review ESLint config improvements

## 📊 Statistics

- **Total Files Different**: 137
- **Added Files**: 7
- **Deleted Files**: 18
- **Modified Files**: 112

### Breakdown by Category

- ✅ **Completed**: 12 items
- 🔴 **Critical (Backend)**: 5 endpoints + 1 migration + 1 service
- 📋 **To Review**: 125+ files
- ⚠️ **Potential Issues**: Type compatibility, deleted assets

## 🎯 Priority Order

1. **CRITICAL**: Implement Omni backend (blocks frontend feature)
2. **HIGH**: Review deleted assets (favicons, IDE icons)
3. **HIGH**: Check KanbanHeaderWithWidget replacement
4. **MEDIUM**: Review new upstream pages/features
5. **MEDIUM**: Review configuration file changes
6. **LOW**: Review UI component improvements
7. **LOW**: Review i18n translation updates

---

**Last Updated**: 2025-10-29
**Branch**: `fix/upstream-sync`
**Base Version**: v0.0.113
**Target**: Restore v0.5.0-rc.3 features while keeping upstream improvements
