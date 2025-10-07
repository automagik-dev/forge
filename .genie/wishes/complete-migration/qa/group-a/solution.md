# Group A Solution: Sync Dependencies from Upstream

## Root Cause (Confirmed)

The Forge architecture uses an **overlay pattern**:

```typescript
// frontend/vite.config.ts
'@': [
  path.resolve(__dirname, '../forge-overrides/frontend/src'),
  path.resolve(__dirname, '../upstream/frontend/src'),
],
```

This means:
1. `frontend/src/App.tsx` imports from `@/components`, `@/pages`, etc.
2. Vite resolves these to `forge-overrides/frontend/src` OR `upstream/frontend/src`
3. **But** dependencies are NOT inherited through Vite path aliases!

## The Problem

- `upstream/frontend/package.json` declares ~60+ dependencies
- `frontend/package.json` only declares `react` and `react-dom`
- When frontend code imports from `@/` (which resolves to upstream), it uses upstream components
- **Those upstream components need their dependencies to be in frontend/node_modules**

## The Fix

**Copy ALL dependencies from upstream/frontend to frontend/package.json**

This is NOT duplication - it's **explicit declaration** of what the frontend actually uses.

### Why This Is Correct

1. The frontend **DOES** use these dependencies (via upstream code)
2. pnpm workspace strategy means versions are deduped at the root
3. If upstream updates a dependency, we can sync it via automated tooling
4. This is how the overlay pattern is **supposed** to work

### Implementation

Merge `upstream/frontend/package.json` dependencies into `frontend/package.json`:

```json
{
  "name": "automagik-forge-frontend",
  "dependencies": {
    // All upstream/frontend dependencies
    "@codemirror/lang-json": "^6.0.2",
    // ... etc
  },
  "devDependencies": {
    // All upstream/frontend devDependencies
  }
}
```

Then run `pnpm install` and the build will succeed.

## Why Option 1 Was Misleading

The task description said "add upstream/frontend to pnpm workspace for automatic dependency sync."

This was **partially correct**:
- ✅ Adding to workspace is needed (done)
- ❌ Dependencies are NOT automatically synced through workspace membership alone
- ✅ We still need to explicitly copy dependencies

The workspace membership helps with:
- Version deduplication
- Shared node_modules hoisting
- Cross-package references

But it doesn't auto-merge package.json dependencies.

## Next Steps

1. Generate merged package.json (script or manual)
2. Run `pnpm install`
3. Test `cd frontend && pnpm run build`
4. Capture success evidence
