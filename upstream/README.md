# Upstream Vibe-Kanban Submodule Placeholder

This directory serves as a placeholder for the upstream vibe-kanban repository, which should be added as a git submodule.

## Initialization Instructions

To initialize the submodule locally:

1. Ensure the upstream remote is configured:
   ```
   git remote add upstream https://github.com/BloopAI/vibe-kanban.git
   ```

2. Add the submodule:
   ```
   git submodule add https://github.com/BloopAI/vibe-kanban.git upstream
   ```

3. Checkout the main branch:
   ```
   cd upstream
   git checkout main
   cd ..
   ```

4. Commit the submodule reference:
   ```
   git add upstream
   git commit -m \"Add upstream vibe-kanban as submodule\"
   ```

## Important Notes

- **Never modify files inside `upstream/` directly.** All changes should be contributed upstream or handled via `forge-overrides/` or `forge-extensions/`.
- After initialization, update the root `Cargo.toml` to uncomment the `upstream/crates/*` member.
- Run `git submodule update --init --recursive` to ensure the submodule is up-to-date during development.

For sandbox environments where git submodule operations are restricted, this placeholder allows the scaffold to exist without breaking the workspace structure. Once in a full git environment, follow the instructions above to replace this placeholder with the actual submodule.