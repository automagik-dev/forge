# Upstream-as-Library Architecture Notes

Automagik Forge now runs entirely on top of the untouched `vibe-kanban` submodule. The `forge-app` composition binary bootstraps the upstream deployment, applies the Forge extension migrations, mounts the upstream API router, and layers Forge-specific routes plus dual frontend bundles. This document captures the updated layout, runtime expectations, and verification commands for day‑to‑day development.

## Directory Layout

```
upstream/                 # git submodule with pristine vibe-kanban sources
crates/                   # patched workspace crates (match upstream but call into extensions)
forge-extensions/         # forge-only Rust crates (branch templates, omni, config, genie)
forge-app/                # composition binary (Axum server + packaging entrypoint)
frontend-forge/           # Forge React application served at '/'
npx-cli/                  # CLI wrapper that bundles forge-app and both frontends
```

Only edit code outside the `upstream/` directory. When the submodule is not hydrated the Forge binary still compiles; populate it locally via:

```bash
git submodule update --init upstream
cd upstream
git checkout main
```

## Runtime Path Resolution

`forge-app` clones the upstream deployment and, in debug builds, reuses `upstream/dev_assets`. For packaged binaries the CLI sets environment variables so that upstream utilities resolve to the extracted bundle:

- `FORGE_BUNDLE_PATH` → root of the extracted zip.
- `XDG_DATA_HOME`, `APPDATA`, `LOCALAPPDATA`, `HOME` → point to the bundle so `utils::assets::asset_dir()` becomes `<bundle>/bloop/vibe-kanban`.
- `BACKEND_PORT` (or `PORT`) → chosen listen port (defaults to 8887).

During the packaging step (`pnpm run build:npx`) the script copies configuration and SQLite seeds to both the bundle root and `bloop/vibe-kanban/` so the upstream deployment can load them without additional setup.

## Backend Composition

`forge-app` performs the following at startup:

1. Calls `DeploymentImpl::new()` from upstream to initialise services, run upstream migrations, and pre-warm caches.
2. Executes Forge migrations from `forge-app/migrations` (auxiliary tables and branch-template data copy).
3. Exposes the upstream API under `/api`, but overrides:
   - `POST /api/tasks/create-and-start`
   - `POST /api/task-attempts`
   so branch templates stored in auxiliary tables influence branch naming.
4. Mounts Forge-specific endpoints under `/api/forge/*` (Omni, branch templates).
5. Serves the Forge frontend at `/` and the upstream frontend bundle at `/legacy` with the same environment fallbacks as before.

## Frontend

- `frontend-forge/` is the only workspace package (`pnpm run build` builds the Forge UI).
- The upstream frontend is built straight from the submodule (`pnpm --dir upstream/frontend run build`) when packaging or testing dual-routing locally.
- Environment overrides: `FORGE_FRONTEND_DIST` and `FORGE_LEGACY_FRONTEND_DIST` can point to alternative build directories when running outside the repository layout.

## CLI / Packaging

`pnpm run build:npx` produces platform zips that contain:

```
automagik-forge            # forge-app binary
frontend-forge-dist/       # forge UI assets
legacy-frontend-dist/      # upstream UI assets
config.json                # default forge config
forge.sqlite               # seeded SQLite snapshot
bloop/vibe-kanban/{config.json,forge.sqlite}  # paths consumed by upstream crates
```

The CLI (`npx-cli/bin/cli.js`) extracts the zip, sets the environment overrides listed above, and launches `forge-app`. Running `npx automagik-forge` from an empty directory should immediately serve:

- `/` → Forge UI
- `/legacy` → upstream UI
- `/api/...` → upstream API with Forge overrides
- `/api/forge/...` → Forge composition endpoints

## Verification Commands

All commands should succeed with the submodule hydrated and the default seeds:

```bash
# Rust
SQLX_OFFLINE=true cargo fmt
SQLX_OFFLINE=true cargo check --workspace
SQLX_OFFLINE=true cargo test --workspace

# Update SQLx offline cache when queries change
DATABASE_URL=sqlite://target/sqlx-dev.sqlite sqlx database create
DATABASE_URL=sqlite://target/sqlx-dev.sqlite sqlx migrate run --source crates/db/migrations
sqlite3 target/sqlx-dev.sqlite < forge-app/migrations/001_auxiliary_tables.sql
sqlite3 target/sqlx-dev.sqlite < forge-app/migrations/002_migrate_branch_template_data.sql
DATABASE_URL=sqlite://target/sqlx-dev.sqlite cargo sqlx prepare --workspace -- --all-targets

# Frontend
pnpm install
pnpm --dir frontend-forge run build
pnpm --dir upstream/frontend run build   # optional; required for legacy UI snapshots

# Packaging smoke
pnpm run build:npx
node npx-cli/bin/cli.js --version
```

## Regression Harness

`./scripts/run-forge-regression.sh` spins up `forge-app`, collects sample responses from `/health`, `/api/forge/*`, rebuilds the CLI bundle, and (when credentials are available) snapshots CLI help/version output. Ensure the SQLite snapshot at `dev_assets_seed/forge-snapshot/from_repo/db.sqlite` exists before running the script or override `FORGE_SNAPSHOT_DB`.

## Key Takeaways

- Keep the submodule pristine; all custom behaviour lives in `forge-app`, `forge-extensions/*`, the patched workspace crates under `crates/`, and `frontend-forge/`.
- `forge-app` composes the upstream router, overriding only the minimal handlers required for Forge features.
- Packaging now ships both frontend bundles and an opinionated config/database layout that aligns with upstream expectations without modifying the upstream sources.
