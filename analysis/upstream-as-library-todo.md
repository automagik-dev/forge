# Upstream-as-Library Migration TODO

Progress tracker derived from `genie/wishes/upstream-as-library-completion-wish.md`. Update after each milestone to mirror scorecard.

## Phase B – Data & Service Integrity (target +3 → Score 91)
- [x] **B1 – Branch Templates:** Validate trigger + extension integration end-to-end (legacy task writes sync into `forge_task_extensions`; forge API round-trips template + generator).
- [x] **B2 – Config Extraction:** Re-export upstream config primitives via `forge-config`, baseline `generate-types` parity, and ensure consumers depend on the new crate.
- [x] **B3 – Omni Integration:** Wire Omni service to production credentials path, migrate API adapters, and remove legacy duplications.

## Phase C – Frontend Completion (target +3 → Score 94)
- [ ] **C1 – Forge UI Port:** Flesh out `frontend-forge` to cover forge dashboard features and ensure build artifacts embed cleanly in `forge-app`.
- [ ] **C2 – Dual Routing:** Verify `/` serves forge UI and `/legacy` continues to serve upstream with API compatibility (including `/api` + `/legacy/api`).
- [ ] **C3 – API Integration:** Backfill forge-specific endpoints for CLI/UI (branch templates, Omni, config) and update consumers.

## Phase D – Validation & Testing (target +4 → Score 98)
- [ ] **D1 – SQLx Cache:** Regenerate `.sqlx` data with merged migrations.
- [ ] **D2 – Coverage:** Add unit/integration/E2E coverage for Omni, Branch Templates, Config, and forge routes.
- [ ] **D3 – Frontend Quality:** Resolve lint warnings; run `pnpm run lint -- --max-warnings=0` and `pnpm run test:e2e` with logs.
- [ ] **D4 – Regression Harness:** Execute `./scripts/run-forge-regression.sh backend|frontend|cli|all`, capture logs + checksums in `docs/regression/latest/`.

## Phase E – Documentation & Risk Closure (target +2 → Score 100)
- [ ] **E1 – Runbooks:** Author production migration + rollback runbooks and update divergence audit.
- [ ] **E2 – Risk Drills:** Perform rollback rehearsal and upstream sync dry-run; record evidence.

## Cross-cutting Items
- [ ] Update wish scoreboard (`genie/wishes/upstream-as-library-completion-wish.md`) when each phase is complete.
- [ ] Commit progress with semantic messages `feat: phase-<letter> ...` reflecting new scores once a phase is finished.
