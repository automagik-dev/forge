# Upstream vibe-kanban Submodule

This directory is intended to contain the upstream `vibe-kanban` repository as a git submodule.

## IMPORTANT: No upstream files have been modified

This is a placeholder directory. No files from the upstream vibe-kanban repository have been copied or modified here.

## Setup Instructions

To initialize the upstream submodule locally, run the following command from the repository root:

```bash
# Remove this placeholder README first
rm upstream/README.md

# Add the upstream repository as a submodule
git submodule add https://github.com/BloopAI/vibe-kanban.git upstream

# Initialize and checkout the main branch
cd upstream
git checkout main
cd ..

# Update .gitmodules if needed
git add .gitmodules upstream
git commit -m "Add upstream vibe-kanban as submodule"
```

## Why This Placeholder Exists

In sandbox or restricted environments where network access may be limited, we cannot automatically fetch the upstream repository. This README serves as documentation for developers who need to set up the submodule manually.

## Architecture Purpose

The upstream directory will contain the unmodified vibe-kanban codebase, which will be used as a library dependency for the forge-app. This ensures:
- Zero modifications to upstream code
- Clean separation between upstream and forge features
- Easy updates from upstream with no merge conflicts

## Next Steps

After initializing the submodule:
1. The workspace will reference upstream crates via path dependencies
2. Forge extensions will compose with upstream services
3. Both upstream and forge frontends will be served from forge-app

For more details, see `/docs/upstream-as-library-foundation.md`