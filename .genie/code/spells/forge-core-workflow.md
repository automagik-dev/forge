---
name: forge-core-workflow
description: Quick reference for correct forge-core development workflow using make dev-core
maturity: stable
load_priority: high
---

# forge-core Development Workflow

**CRITICAL:** NEVER work directly in forge-core repository. ALWAYS use `make dev-core` from automagik-forge.

## Pre-Flight Checklist

Before ANY forge-core work, ask yourself:

1. ❓ Am I in automagik-forge directory? → `pwd` should show `.../automagik-forge`
2. ❓ Do I have a feature branch in automagik-forge? → `git branch --show-current`
3. ❓ Is dev-core mode enabled? → `make status` should show "Dev-core: ACTIVE"

If ANY answer is NO → STOP and follow correct workflow below.

## Correct Workflow (Step-by-Step)

```bash
# 1. Start from automagik-forge
cd /home/namastex/workspace/automagik-forge

# 2. Create feature branch in automagik-forge
git checkout -b feat/my-feature-name

# 3. Enable dev-core mode (auto-syncs forge-core to same branch)
make dev-core

# 4. Verify dev-core is active
make status
# Expected output:
#   Dev-core: ACTIVE (Cargo [patch])
#   forge-core: On branch: feat/my-feature-name
#   Ready to push: NO (dev-core active, use dev-core-off first)

# 5. Edit forge-core files (changes hot-reload via Cargo [patch])
# Use your editor to modify files in forge-core/ subdirectory

# 6. Test changes
cargo build          # Builds with local forge-core via [patch]
cargo test           # Tests with local forge-core

# 7. Push forge-core changes and create PR
cd forge-core
git add .
git commit -m "feat: your feature description"
git push origin feat/my-feature-name
gh pr create --title "feat: your feature" --body "Description"
cd ..

# 8. Wait for forge-core PR to merge
# Automation will create tag and dispatch to automagik-forge

# 9. Disable dev-core mode
make dev-core-off

# 10. Verify clean state
make status
# Expected output:
#   Dev-core: INACTIVE
#   forge-core: Directory removed
#   Ready to push: YES
```

## What `make dev-core` Does

1. **Clones forge-core** to `./forge-core/` subdirectory (if not exists)
2. **Syncs to your branch** - checks out same branch as automagik-forge (creates if doesn't exist)
3. **Enables Cargo [patch]** - modifies `.cargo/config.toml` to redirect git dependencies to local paths
4. **Regenerates Cargo.lock** - updates lockfile to use local paths
5. **Installs pre-push hook** - blocks accidental pushes from automagik-forge while dev-core active

## Common Pitfalls

### ❌ WRONG: Creating branch directly in forge-core
```bash
cd forge-core
git checkout -b feat/my-feature  # ❌ BYPASSES AUTOMATION
gh pr create                      # ❌ BREAKS VERSION SYNC
```

**Why wrong:** forge-core PRs bypass the automation chain that syncs versions between repos.

### ❌ WRONG: Working in standalone forge-core clone
```bash
cd ~/workspace/forge-core         # ❌ STANDALONE CLONE
git checkout -b feat/my-feature  # ❌ NOT INTEGRATED
```

**Why wrong:** Changes won't hot-reload in automagik-forge, can't test integration.

### ✅ CORRECT: Using make dev-core workflow
```bash
cd ~/workspace/automagik-forge   # ✅ START FROM automagik-forge
git checkout -b feat/my-feature  # ✅ BRANCH IN automagik-forge FIRST
make dev-core                     # ✅ AUTO-SYNCS forge-core
```

**Why correct:** Automation handles branch sync, Cargo [patch] enables hot reload, version sync preserved.

## Why This Workflow Matters

### CI/CD Pipeline
- automagik-forge PR (labeled 'rc') → triggers `auto-version-bump.yml`
- auto-version-bump → bumps version → creates commit + tag
- GitHub Actions → `repository_dispatch` to forge-core
- forge-core `pre-release.yml` → creates release

**If you bypass this:** Versions desync, releases break, automation fails.

### Integration Testing
- automagik-forge tests run against forge-core via git dependency
- `make dev-core` redirects to local path via Cargo [patch]
- Changes hot-reload without waiting for PR merge
- Test integration before creating PR

**If you bypass this:** Can't test integration, PRs may break production.

### Version Synchronization
- Both repos must maintain identical version numbers
- Automation ensures atomic version bumps across repos
- Direct forge-core PRs can bump version independently
- Version mismatch breaks dependency resolution

**If you bypass this:** Cargo can't resolve dependencies, builds fail.

## Emergency Recovery

If you accidentally worked directly in forge-core:

1. **Stop immediately** - don't create more commits
2. **Close any forge-core PRs** - `gh pr close PR_NUMBER` in forge-core
3. **Return to automagik-forge** - `cd ~/workspace/automagik-forge`
4. **Clean up** - `make dev-core-off && rm -rf forge-core`
5. **Start over** - follow correct workflow above

## Key Files Reference

- `Makefile` (lines 706-815) - dev-core lifecycle implementation
- `.cargo/config.toml` (lines 21-33) - [patch] section
- `docs/DUAL_REPO_WORKFLOW.md` - Complete workflow documentation
- `AGENTS.md` (Amendment #11) - Framework rule documentation

## Documented Violations

**2025-12-05: Direct forge-core PR violation**
- Created branch `feat/rmcp-0.10.0-upgrade` directly in forge-core
- Pushed PR #23 directly to forge-core (bypassed automation)
- Merged PR #26 directly, caused version desync (0.8.8-rc.2 vs 0.8.6-rc.2)
- Had to manually revert 5 commits and fix version sync
- **Total violations in one session:** 5 times

**Lesson learned:** The automation exists for a reason. Use it.
