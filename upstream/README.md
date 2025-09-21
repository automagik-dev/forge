# Upstream Submodule Placeholder

This repository expects the upstream `vibe-kanban` project to live here as a git submodule. The submodule is not initialised automatically in Task 1 to keep the scaffold sandbox-friendly and to avoid pulling upstream sources during review.

## Initialising the Submodule Locally

Run the following commands from the repository root to add the upstream remote and hydrate the submodule directory:

```bash
git submodule add https://github.com/namastexlabs/vibe-kanban.git upstream
cd upstream
git checkout main
```

After cloning you can update the submodule with:

```bash
cd upstream
git fetch origin
git checkout main
git pull --ff-only
```

## Guardrails

- Do not modify files inside `upstream/`; contribute changes to the upstream repository instead.
- Keep the submodule on a clean branch (`main`) so `scripts/run-upstream-audit.sh` can compare against `origin/main` without conflicts.
- If you cannot add the submodule (e.g. offline review), leave this directory empty—the rest of the workspace compiles via forge crates.

Document submodule updates in `docs/regression/logs/` when running the audit harness.
