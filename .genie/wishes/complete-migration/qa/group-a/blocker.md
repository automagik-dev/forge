# Group A Blocker: Fundamental Architecture Issue

## Status: BLOCKED

Group A implementation has revealed a **fundamental architectural problem** with the Forge overlay pattern.

## Problem Summary

The current architecture attempts to:
1. Build from `frontend/` as the root directory
2. Use Vite path aliases to pull code from `../upstream/frontend/src` and `../forge-overrides/frontend/src`
3. Declare dependencies in `frontend/package.json`

**This doesn't work because:**
- When Vite/Rollup processes files from `/upstream/frontend/src`, it resolves `import "lodash"` relative to those files
- Those files are OUTSIDE the build root (`frontend/`)
- Node module resolution fails because `upstream/frontend/` has no `node_modules` (or package.json)
- Even though we've added lodash to `frontend/package.json`, Rollup can't find it when processing upstream files

## What We Tried

### Attempt 1: pnpm Workspace
✅ Added `upstream/frontend` to `pnpm-workspace.yaml`
❌ Dependencies aren't automatically inherited

### Attempt 2: Merge Dependencies
✅ Copied all upstream dependencies to `frontend/package.json`
✅ Added missing `lodash` dependency
❌ Rollup still can't resolve them from upstream files

### Attempt 3: Custom Overlay Resolver
✅ Created custom Vite plugin to resolve `@/` imports
✅ Fixed resolution for @/ imports from anywhere
❌ Can't fix regular imports (`import "lodash"`) from files outside root

### Attempt 4: Vite fs.allow Config
✅ Allowed Vite to serve files from parent directories
❌ Doesn't fix Rollup's module resolution for those files

## Root Cause

**Vite/Rollup resolves bare imports (like `"lodash"`) relative to the importing file's location.**

When processing `/home/user/automagik-forge/upstream/frontend/src/pages/settings/GeneralSettings.tsx`:
- Rollup looks for `lodash` in `/home/user/automagik-forge/upstream/frontend/node_modules/`
- That directory doesn't exist
- Rollup fails, even though lodash IS installed in `/home/user/automagik-forge/node_modules/.pnpm/`

## Correct Architectures

### Option A: Build from Upstream (Recommended)
Change the build to work from `upstream/frontend/` as the root:

```
upstream/frontend/
├── src/               # Original source
├── vite.config.ts    # Build config
├── package.json      # Dependencies
└── node_modules/     # pnpm symlinks
```

Apply Forge overlays via:
1. Vite path aliases pointing to `../../forge-overrides/frontend/src`
2. Or copy overrides into upstream during build

**Pros:**
- Natural module resolution
- Upstream dependencies work out of box
- Standard Vite patterns

**Cons:**
- Modifies upstream directory (but it's a submodule, can be dirty)
- Requires different build scripts

### Option B: Copy Upstream to Frontend
Copy ALL upstream source into `frontend/src/` during build:

```bash
# Pre-build step
rm -rf frontend/src
cp -r upstream/frontend/src frontend/src
cp -r forge-overrides/frontend/src/* frontend/src/  # Overlay
pnpm --filter frontend run build
```

**Pros:**
- Simple, standard build
- All files in one place

**Cons:**
- Must re-copy on every build
- Duplicates source code
- Harder to track what's overridden

### Option C: Symlink Upstream
Symlink upstream into frontend:

```bash
ln -s ../upstream/frontend/src frontend/upstream-src
# Update imports to use ./upstream-src/...
```

**Cons:**
- Still requires changing all imports
- Messy directory structure

## Recommended Path Forward

**Use Option A: Build from upstream/frontend with Forge overlays**

1. Move build to `upstream/frontend/`
2. Update `upstream/frontend/vite.config.ts` to add forge-overrides alias
3. Update package scripts to `cd upstream/frontend && pnpm run build`
4. Copy build output back to `frontend/dist/` if needed

## Evidence

See captured logs:
- `build-failure.log` - Final lodash resolution error
- `workspace-diff.txt` - pnpm workspace changes
- `solution.md` - Attempted dependency merge
- `analysis.md` - Initial architecture analysis

## Next Steps

**Human Decision Required:**
1. Which architecture should we implement? (A, B, or C)
2. Are we willing to modify upstream directory? (It's a submodule)
3. Should we redesign the Forge overlay system entirely?

This is a **critical architecture decision** that affects all of Forge, not just frontend dependencies.
