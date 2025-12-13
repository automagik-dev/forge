---
name: forge-core-workflow
description: Quick reference for fully automatic forge-core development workflow
maturity: stable
load_priority: high
---

# forge-core Development Workflow

**CRITICAL:** ONLY command you need to know: `make dev-core`. Everything else is automatic.

## The 3-Step Workflow

```bash
# 1. Start dev-core mode
make dev-core BRANCH=feat/my-feature

# 2. Edit files + commit (from forge root!)
# Edit files in both repos as needed
git add . && git commit -m "feat: your changes"
# → Hooks auto-commit forge-core with same message

# 3. Push (FULLY AUTOMATIC!)
git push
# → Hooks auto-push forge-core
# → Hooks auto-disable patches
# → Hooks auto-regenerate Cargo.lock
# → Hooks auto-amend commit
# → Push proceeds!
```

**That's it.** No `make dev-core-off`. No `make push-both`. Just push.

## What Happens Automatically

### On `git commit` (from forge root):
1. `pre-commit` hook stages all forge-core changes
2. `prepare-commit-msg` hook commits forge-core with same message
3. Both repos have identical commits

### On `git push` (from forge root):
1. `pre-push` hook pushes forge-core first (if has unpushed commits)
2. `pre-push` hook disables Cargo [patch] overrides
3. `pre-push` hook regenerates Cargo.lock with git deps
4. `pre-push` hook amends commit with config changes
5. Push proceeds to origin

## Forbidden Actions

- ❌ `cd forge-core && git commit` - BLOCKED by hook
- ❌ `cd forge-core && git push` - BLOCKED by hook
- ❌ Any git commands inside forge-core directory

## Pre-Flight Checklist

Before ANY forge-core work:

1. ❓ Am I in automagik-forge directory? → `pwd` should show `.../forge`
2. ❓ Is dev-core mode enabled? → `make status` shows "Dev-core: ACTIVE"
3. ❓ Do I have a feature branch? → `git branch --show-current`

## What `make dev-core` Does

1. **Clones forge-core** to `./forge-core/` (if not exists)
2. **Syncs to your branch** - same branch as automagik-forge
3. **Enables Cargo [patch]** - redirects git deps to local paths
4. **Regenerates Cargo.lock** - uses local paths
5. **Installs hooks** - pre-commit, prepare-commit-msg, pre-push

## Common Pitfalls

### ❌ WRONG: Working directly in forge-core
```bash
cd forge-core
git commit                        # ❌ BLOCKED
git push                          # ❌ BLOCKED
```

### ✅ CORRECT: All operations from forge root
```bash
cd /path/to/forge                 # ✅ ALWAYS from root
git add . && git commit           # ✅ Hooks sync forge-core
git push                          # ✅ Hooks handle everything
```

## Key Files

- `scripts/hooks/pre-commit` - Auto-stages forge-core changes
- `scripts/hooks/prepare-commit-msg` - Auto-commits forge-core
- `scripts/hooks/pre-push` - Auto-push + auto-disable patches
- `docs/DUAL_REPO_WORKFLOW.md` - Complete documentation
- `AGENTS.md` (Amendment #11) - Framework rule
