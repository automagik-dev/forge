# Upstream-as-Library Scaffold & Backend Extraction

Tasks 1 and 2 are now complete. The repository carries the upstream-as-library structure, auxiliary extension crates, a composition binary, and the first slice of forge-specific backend behaviour (Omni, branch templates, config v7, Genie stubs). The notes below capture the up-to-date layout, command expectations, and follow-up guidance for Task 3.

## Directory Layout

```
upstream/                # git submodule placeholder for vibe-kanban
forge-app/               # future composition binary hosting HTTP wiring
forge-extensions/        # forge-only crates (omni, branch templates, config v7, genie)
forge-overrides/         # thin adapters or configuration overrides (empty for now)
frontend-forge/          # placeholder package for forge-specific React app
```

Refer to `upstream/README.md` for submodule guardrails and `frontend-forge/README.md` for frontend extraction notes.

## Hydrating the Upstream Snapshot

1. Ensure you have access to the upstream repository: `https://github.com/namastexlabs/vibe-kanban.git`.
2. From the repository root run:
   ```bash
   git submodule add https://github.com/namastexlabs/vibe-kanban.git upstream
   cd upstream
   git checkout main
   ```
3. To update later: `cd upstream && git fetch origin && git pull --ff-only`.
4. Never modify files inside `upstream/`; apply customisations in `forge-extensions/` or `forge-overrides/` instead.

## Forge Snapshot Workflow

Keep personal forge datasets outside of git history. To hydrate the local snapshot from your `~/.automagik-forge` directory run:

```bash
./scripts/collect-forge-snapshot.sh
```

The script copies data into `dev_assets_seed/forge-snapshot/from_home/`, which stays git-ignored. Committed seeds continue to live under `dev_assets_seed/forge-snapshot/from_repo/`.

## Verification Checklist (Task 1 + Task 2)

Executed locally in the sandbox (all Rust commands with `SQLX_OFFLINE=true`):

- `cargo fmt`
- `cargo check --workspace`
- `cargo clippy --workspace --all-targets`
- `cargo test --workspace`
- `sqlx migrate run --source forge-app/migrations --dry-run` (use an ephemeral SQLite URL such as `sqlite://target/forge_app_tmp.sqlite?mode=rwc`)
- `./scripts/run-upstream-audit.sh` *(blocked offline – fetch attempts now logged in `docs/upstream-diff-fetch.log`)*
- `pnpm install` *(fails in sandbox: npm registry unreachable; rerun on a networked workstation before Task 3)*

Record successful runs in `docs/regression/logs/` when executed outside CI.

## Task 2 Backend Extraction Summary

- **Composition binary** – `forge-app` now bootstraps `ForgeServices`, runs forge-only migrations, and hosts an Axum router.
- **Auxiliary persistence** – branch-template metadata lives in `forge_task_extensions` (plus `forge_project_settings` / `forge_omni_notifications`). New migrations ship in `forge-app/migrations/{001,002}_*.sql` with idempotent guards.
- **Branch template store** – `forge-extensions-branch-templates` exports `BranchTemplateStore`, wrapping SQLx access with automatic schema creation for mixed environments.
- **DB integration** – upstream task queries join the auxiliary table via runtime SQLx queries; inserts/updates persist branch templates through the store while leaving upstream columns `NULL`.
- **Service wiring** – `/api/forge` endpoints expose Omni instance listings, branch-template lookups, and Genie placeholder data. Handlers rely on an `Extension<Arc<ForgeServices>>`, keeping router state `()` compatible with `axum::serve`.
- **Config validation** – `forge-extensions-config::validate` enforces config version consistency during bootstrap.

## Running `forge-app`

```
SQLX_OFFLINE=true \
DATABASE_URL=sqlite://dev_assets_seed/forge-snapshot/from_repo/db.sqlite \
FORGE_APP_ADDR=127.0.0.1:8899 \
cargo run -p forge-app
```

The database must contain upstream tables (`tasks`, etc.). If you need a throwaway database for smoke tests, seed it with upstream migrations before running forge migrations.

Example endpoints:

- `GET /health` → plain text heartbeat.
- `GET /api/forge/omni/instances` → Omni instance list (empty when Omni disabled).
- `GET /api/forge/branch-templates/:task_id` → forge template metadata for a task.
- `GET /api/forge/genie/wishes` → Genie connection summary placeholder.

## Notes for Task 3

- Frontend extraction remains outstanding (`frontend-forge/` is still a stub).
- Re-run `pnpm install`, `pnpm run lint`, and `pnpm run build` once network access is available; update regression baselines after successful runs.
- `scripts/run-forge-regression.sh` assumes a hydrated forge snapshot and a reachable npm registry. Record limitations if these commands remain sandbox-blocked.
- Confirm dual-frontend routing and Genie automation wiring as you move into Task 3.
