# Upstream-as-Library Foundation Scaffold

Task 1 establishes the directory skeleton that will host the upstream code, forge-only extensions, and the eventual dual-frontend layout. No business logic moved yet; all existing behaviour remains in the legacy locations.

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

## Verification Checklist

- `cargo check --workspace`
- `cargo check -p forge-app`
- `pnpm install`
- `./scripts/run-upstream-audit.sh`

Record outputs under `docs/regression/logs/` if you execute these outside of CI, especially after hydrating the submodule.

## Task 2 Preview

- Extract Omni, branch-template, config v7, and Genie logic into the corresponding crates.
- Wire `forge-app` to serve both upstream (`upstream/`) and forge (`frontend-forge/`) frontends.
- Move build scripts and tooling to target the new layout once behaviour is migrated.

Document blockers or dependency needs discovered while working on Task 1 before starting the extraction.
