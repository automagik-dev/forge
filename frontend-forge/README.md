# Frontend Forge Scaffold

`frontend-forge/` will host the forge-specific React application once Task 2 extracts UI changes from the upstream frontend.

For Task 1 it only provides a placeholder `package.json` so pnpm recognises the future workspace member. The existing `frontend/` app continues to serve production code until the migration completes.

## Next Steps
- Mirror the upstream Vite configuration here during Task 2.
- Migrate forge-specific components out of `frontend/` into this package.
- Update tooling scripts to point at `frontend-forge/` once the extraction is complete.
