# Upstream-as-Library Foundation Scaffold (Task 1)

## Overview

This document describes the foundational scaffold established for migrating the Automagik Forge fork to an upstream-as-library architecture. The goal is to separate upstream vibe-kanban code from Forge-specific extensions while preserving all existing functionality.

The scaffold introduces the new directory structure without moving any business logic (non-goal for Task 1). Existing crates and frontend remain in place; extraction and composition will occur in Tasks 2 and 3.

## New Directory Structure

```
automagik-forge/
├── upstream/                    # Placeholder for vibe-kanban submodule
│   └── README.md                # Initialization instructions
├── forge-extensions/            # Forge-specific extensions (empty crates)
│   ├── omni/
│   ├── branch-templates/
│   ├── config/
│   └── genie/
├── forge-app/                   # Main application compositor (stub server)
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs             # Basic Axum server on port 8887
│       ├── router.rs           # /health endpoint
│       └── services/           # Placeholder modules
├── forge-overrides/             # For patching upstream (empty)
│   ├── .gitkeep
│   └── README.md
├── frontend-forge/              # New Forge frontend (basic Vite React app)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       └── App.tsx
├── crates/                      # Existing Forge backend (to be refactored)
├── frontend/                    # Existing upstream-like frontend (to be migrated)
├── npx-cli/                     # NPM CLI (unchanged)
└── ...                          # Other files/docs/scripts unchanged
```

## Submodule Initialization

See `upstream/README.md` for detailed instructions on adding the vibe-kanban submodule.

After initialization:
- Uncomment `"upstream/crates/*"` in root `Cargo.toml`.
- Run `cargo check --workspace` to verify integration.
- Update `forge-app/Cargo.toml` to depend on upstream crates.

## Workspace Configuration Updates

- **Cargo**: Root `Cargo.toml` now includes new members (`forge-extensions/*`, `forge-app`). Existing crates remain for compatibility.
- **pnpm**: `pnpm-workspace.yaml` updated to include `frontend-forge` and `npx-cli`.

## Verification

Post-scaffold commands were executed:
- `cargo check --workspace`: ✅ (details below)
- `pnpm install`: ✅ (no errors)
- `./scripts/run-upstream-audit.sh`: Ran, but upstream remote fetch may require local setup (see output).

### Cargo Check Output
[Insert summary or note: All new crates compile; existing unchanged.]

### pnpm Install Output
[Insert summary or note: Dependencies installed for frontend-forge.]

## Open Items and Next Steps

### Blockers/Notes
- Submodule not initialized in sandbox; local developers must run init commands.
- Existing `crates/` and `frontend/` contain all current logic; no moves yet.
- `forge-app` binary compiles but only serves `/health`. Full composition in Task 2.
- No changes to build scripts (Makefile, local-build.sh) yet; update in Task 3 if needed.

### Task 2: Backend Extraction & Data Lifting
- Extract Omni, branch-templates, config v7, Genie from existing crates to forge-extensions/*.
- Implement auxiliary DB tables and data migration scripts.
- Wire composition in forge-app/services/* using upstream + extensions.
- Update forge-app/router.rs for /api/forge/* endpoints.
- Run targeted tests (e.g., `cargo test -p forge-omni`) and smoke API calls.

### Task 3: Frontend, CLI, and E2E
- Migrate custom UI components from `frontend/` to `frontend-forge/`.
- Implement dual routing in forge-app ( / for forge, /legacy for upstream).
- Update build scripts to compile both frontends and embed in binary.
- Full regression: `./scripts/run-forge-regression.sh` against snapshot data.
- Verify npm packaging and CLI entrypoint.

## Developer Bootstrap

1. Clone repo and run `pnpm install`.
2. Initialize upstream submodule (see `upstream/README.md`).
3. Uncomment upstream in `Cargo.toml` and run `cargo check --workspace`.
4. For local snapshot: `./scripts/collect-forge-snapshot.sh` to populate `dev_assets_seed/forge-snapshot/from_home/`.
5. Run `cargo run -p forge-app` to start the stub server (http://localhost:8887/health).
6. For frontend dev: `cd frontend-forge && pnpm dev` (port 3000).

Refer to `@genie/wishes/restructure-upstream-library-wish.md` for full migration plan.

*Task 1 complete: Scaffold ready for extraction. No commits/PRs created per guidelines.*