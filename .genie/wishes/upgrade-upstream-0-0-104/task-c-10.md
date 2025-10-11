# Task C-10

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

**Why:** You're in a git worktree. Submodules aren't auto-initialized in worktrees. After running this, `upstream/frontend/src/` will be populated and all imports will resolve.

---

See @.genie/wishes/upgrade-upstream-0-0-104-wish.md for full context.

