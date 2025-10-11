# Upstream-as-Library Migration TODO

Progress tracker derived from `genie/wishes/upstream-as-library-completion-wish.md`. Update after each milestone to mirror scorecard.

## Phase B – Data & Service Integrity (target +3 → Score 91)
- [x] **B1 – Branch Templates:** Validate trigger + extension integration end-to-end (legacy task writes sync into `forge_task_extensions`; forge API round-trips template + generator).
- [x] **B2 – Config Extraction:** Re-export upstream config primitives via `forge-config`, baseline `generate-types` parity, and ensure consumers depend on the new crate.
- [x] **B3 – Omni Integration:** Wire Omni service to production credentials path, migrate API adapters, and remove legacy duplications.

## Phase C – Frontend Completion (target +3 → Score 94)
- [x] **C1 – Forge UI Port:** Flesh out `frontend-forge` to cover forge dashboard features and ensure build artifacts embed cleanly in `forge-app`.
- [x] **C2 – Dual Routing:** Verify `/` serves forge UI and `/legacy` continues to serve upstream with API compatibility (including `/api` + `/legacy/api`).
- [x] **C3 – API Integration:** Backfill forge-specific endpoints for CLI/UI (branch templates, Omni, config) and update consumers.

## Phase D – Validation & Testing (target +4 → Score 98)
- [ ] **D1 – SQLx Cache:** Regenerate `.sqlx` data with merged migrations.
  - Refresh via `cargo sqlx prepare --merged` against `sqlite:dev_assets/db.sqlite`.
  - Spot-check generated JSON files for new queries from Omni worker + forge routes.
  - Add `.sqlx` directory to git (commit alongside Phase D completion).
- [ ] **D2 – Coverage:** Add unit/integration/E2E coverage for Omni, Branch Templates, Config, and forge routes.
  - Add Rust tests for `handle_omni_notification` queue flows (sent, skipped, failure).
  - Extend API tests to cover forge Omni endpoints and branch template toggles.
  - Backfill frontend component tests (Vitest) for Omni settings panel validation rules.
- [ ] **D3 – Frontend Quality:** Resolve lint warnings; run `pnpm run lint -- --max-warnings=0` and `pnpm run test:e2e` with logs.
  - Ensure `frontend-forge` has zero eslint warnings and format drift.
  - Capture command output in `docs/regression/latest/frontend-lint.log` + `frontend-e2e.log`.
- [ ] **D4 – Regression Harness:** Execute `./scripts/run-forge-regression.sh backend|frontend|cli|all`, capture logs + checksums in `docs/regression/latest/`.
  - Run each target sequentially, reusing newly migrated sqlite snapshot.
  - Update checksums + summary table in `docs/regression/latest/README.md`.
  - Link artifact paths inside `analysis/perfect-migration.log` entry.

## Phase E – Documentation & Risk Closure (target +2 → Score 100)
- [ ] **E1 – Runbooks:** Author production migration + rollback runbooks and update divergence audit.
  - Create `docs/runbooks/production-migration.md` describing cutover + validation timeline.
  - Create `docs/runbooks/rollback-procedures.md` with stop-gap + restore instructions.
  - Summarize outcomes in `analysis/perfect-migration.log` and refresh wish scoreboard.
- [ ] **E2 – Risk Drills:** Perform rollback rehearsal and upstream sync dry-run; record evidence.
  - Dry-run `sqlx migrate revert`/`run` on forge migrations and document timings.
  - Execute `cd upstream && git fetch origin && git status` to prove clean sync.
  - Capture shell transcripts under `docs/regression/latest/risk-drills/` and link in runbook.

## Cross-cutting Items
- [ ] Update wish scoreboard (`genie/wishes/upstream-as-library-completion-wish.md`) when each phase is complete.
- [ ] Commit progress with semantic messages `feat: phase-<letter> ...` reflecting new scores once a phase is finished.
