# Group A Analysis: Workspace Strategy Limitations

## Executed Steps

1. ✅ Added `upstream/frontend` to `pnpm-workspace.yaml`
2. ✅ Ran `pnpm install` successfully
3. ❌ Build failed with dependency resolution errors

## Root Cause

The workspace strategy alone is **insufficient** because:

### Problem
- `frontend/package.json` only declares `react` and `react-dom` as dependencies
- `frontend/src/App.tsx` imports from **many** upstream packages:
  - `react-router-dom`
  - `react-i18next`
  - `@sentry/react`
  - `@ebay/nice-modal-react`
  - `react-hotkeys-hook`
  - etc.

### Why Workspace Strategy Failed
- pnpm workspaces allow packages to **reference each other**, but don't automatically merge dependencies
- `frontend/` can't import from `upstream/frontend/node_modules` without explicitly declaring those dependencies
- Adding `upstream/frontend` to the workspace only makes it **visible**, not automatically **inherited**

## Build Error Details

```
[vite]: Rollup failed to resolve import "react-router-dom" from "/home/namastex/workspace/automagik-forge/frontend/src/App.tsx".
```

### Missing Dependencies in frontend/package.json
Based on `frontend/src/App.tsx` imports:
- `react-router-dom` (critical)
- `react-i18next` (critical)
- `@sentry/react` (critical)
- `@ebay/nice-modal-react` (critical)
- `react-hotkeys-hook` (critical)
- Plus many more from components, pages, hooks, etc.

## Required Fix

**Option 1 does NOT work as designed.** We need to either:

### Alternative A: Copy All Dependencies
Copy every dependency from `upstream/frontend/package.json` to `frontend/package.json`:
```json
{
  "dependencies": {
    "@codemirror/lang-json": "^6.0.2",
    "@codemirror/language": "^6.11.2",
    // ... ~60+ dependencies
  }
}
```

**Pros:**
- Explicit control over versions
- Standard pnpm workspace pattern

**Cons:**
- Massive duplication (~60+ dependencies)
- Manual sync required when upstream updates
- Violates DRY principle

### Alternative B: Extend Upstream Package
Make `frontend/package.json` extend or inherit from `upstream/frontend/package.json`:
```json
{
  "dependencies": {
    "vibe-kanban": "workspace:*"
  }
}
```

**Pros:**
- Automatic dependency inheritance
- Minimal duplication

**Cons:**
- Requires build system changes
- More complex setup

### Alternative C: Monolithic Import (Recommended)
Instead of reimplementing the frontend, **import upstream as a library**:
1. Keep `upstream/frontend` as the canonical source
2. Use Vite's alias system to override specific components
3. Import upstream App.tsx and selectively override routes/components

This is how Forge should have been designed from the start.

## Evidence Files

- `workspace-diff.txt`: pnpm-workspace.yaml changes
- `build-failure.log`: Full build error output
- `analysis.md`: This document

## Recommendation

**PAUSE GROUP A** and escalate to human for architecture decision:

1. Should we duplicate all ~60+ dependencies to frontend/package.json? (Easy but unmaintainable)
2. Should we redesign the frontend to import upstream as a library? (Correct but larger scope)
3. Should we explore package.json inheritance mechanisms? (Complex but clean)

The workspace strategy (Option 1) **cannot work** without one of the above approaches.
