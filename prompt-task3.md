# Task 3 – Frontend and Composition Finalisation

## Objective
Complete the migration by moving remaining forge-specific functionality (frontend customisations) to the extension architecture, wiring the new APIs end-to-end, and validating that the composed application works without touching upstream sources. Genie stays documentation-only—no new HTTP endpoints are added for it.

## Prerequisites
- Task 1 and Task 2 merged; backend features now live in `forge-extensions` and served via `forge-app`.
- Auxiliary tables and migrations are in place; legacy backend code no longer references forge-only logic.

## In-Scope Work
1. **Frontend extraction**
   - Move modified forge UI components from `frontend/src` into a new `frontend-forge/` (or reuse existing `frontend/` if already fork-specific) that consumes the upstream frontend via dual routing.
   - Ensure `forge-app` serves both: new forge UI at `/` and upstream UI under `/legacy` via static embedding or proxy, as defined in the architecture wish.
   - Update API clients to call the new `/api/forge/*` endpoints.
2. **Genie/Claude documentation guardrails**
   - Confirm Genie remains documentation-only (wish files, `.claude/` assets) with no runtime services.
   - Update prep docs to clarify how operators use Genie materials post-migration.
3. **Routing & composition**
   - Flesh out the stub routes from Task 2 so they call real services (list Omni instances, manage branch templates, serve config data).
   - Implement error handling, logging, and feature toggles driven by config v7.
4. **Testing & validation**
   - Add unit/integration tests for branch template and Omni APIs.
   - Ensure `pnpm run build` (or `pnpm run check` + `pnpm run lint`) passes for the frontend.
   - Smoke-test the dual frontend: document how to run `cargo run -p forge-app` and access both UIs.
5. **Documentation & cleanup**
   - Update developer docs with migration results, runbooks, and rollback instructions.
   - Mark legacy forge code paths as deprecated or remove them when safely replaced.
   - Prepare a checklist for cutting over production (upstream submodule update procedure, config migrations, etc.).

## Out of Scope
- Upstream code modifications (should remain untouched).
- Dropping legacy database columns (schedule only after production validation).
- Updating CI/CD pipelines beyond necessary path adjustments (can be follow-up if large).

## Deliverables
- Frontend assets relocated and runnable via the new composition router.
- Completed Genie integration accessible via extension services/APIs.
- `forge-app` router exposing both upstream and forge UIs, with SSR/static embedding tested.
- Updated npm/pnpm workspace configuration referencing new frontend package (if renamed).
- Documentation capturing the full migration and usage of the new architecture.

## Acceptance Checklist
- [ ] `cargo check --workspace` and `cargo test --workspace` (or targeted crate tests) pass.
- [ ] `pnpm install` (if needed) plus `pnpm run lint` and `pnpm run build` (or `pnpm run check`) succeed; include logs.
- [ ] Running `cargo run -p forge-app` serves both `/health` and `/legacy` routes, with screenshots or curl output for verification.
- [ ] Genie documented usage clarified (no HTTP endpoints, documentation-only workflow confirmed).
- [ ] Old forge-specific code removed/disabled from legacy locations, preventing regressions.
- [ ] Documentation updated (README section + `/docs/upstream-as-library-migration.md`) describing end-to-end usage, migration steps, remaining risks, and rollback.

## Required Verification Steps (record results)
1. `cargo check --workspace`
2. `cargo test --workspace` (or targeted crates for newly extracted functionality)
3. `pnpm run lint` and `pnpm run build`
4. Manual dual-frontend check: start forge-app and capture evidence of both UIs.
5. Frontend hitting new APIs (e.g., run `pnpm run dev` and demonstrate Omni list request hitting `/api/forge/omni/instances`).

## Current Implementation Notes
- `forge-app` now fronts the upstream API and adds Forge overrides; the CLI launches it directly (no separate upstream binary).
- Forge UI is served from `/`, upstream UI from `/legacy`, with static asset discovery via `FORGE_FRONTEND_DIST`, `FORGE_LEGACY_FRONTEND_DIST`, and fallback to bundle paths.
- Branch template flows moved to `/api/forge/branch-templates/:task_id`; task and attempt creation endpoints compute branch names through the extension store before delegating to upstream services.
- Packaging copies the seeded config/database to both the bundle root and `bloop/vibe-kanban/`; the CLI sets `XDG_DATA_HOME`, `APPDATA`, and `HOME` so upstream utilities pick them up automatically.

## Completion Criteria
- Prep document updated to **READY_FOR_WISH** with all decisions logged.
- Release notes drafted summarising architecture shift, dependency updates, and follow-up tasks (e.g., drop legacy DB columns, CI updates).
- No TODOs remain in code except intentionally tracked issues.
