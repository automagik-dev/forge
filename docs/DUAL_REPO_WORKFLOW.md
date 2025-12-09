# Working with forge-core

This guide explains how to develop features that span both `automagik-forge` (main app) and `forge-core` (library dependency).

> **WARNING: NEVER commit directly in forge-core!**
> A blocker hook will reject direct commits. Always commit from automagik-forge root.

## Quick Start (For Experienced Developers)

```bash
# 1. Enable dev-core mode (syncs both repos to same branch)
make dev-core BRANCH=feat/my-feature

# 2. Edit files in EITHER or BOTH repos
# Changes auto-rebuild via cargo-watch

# 3. Commit from automagik-forge ROOT ONLY
# Hooks auto-sync forge-core with same message
git add . && git commit -m "feat: your changes"
# → pre-commit hook stages forge-core changes
# → prepare-commit-msg hook commits forge-core with SAME message
# → BOTH repos now have identical commits!

# 4. Disable dev-core mode
make dev-core-off

# 5. Push (pre-push hook now allows it)
git push                    # automagik-forge
cd forge-core && git push   # forge-core (already committed by hooks)

# 6. Create PRs for both repos
gh pr create --base main --fill                           # automagik-forge PR
cd forge-core && gh pr create --base main --fill && cd .. # forge-core PR
```

## Complete Workflow

### 1. Enable dev-core Mode

**Prerequisites:**
- Your automagik-forge working directory is clean (no uncommitted changes)
- You're on the branch where you want to work

**Command:**
```bash
# Match branches automatically (RECOMMENDED)
make dev-core BRANCH=feat/my-feature

# This will:
# - Clone forge-core if not present
# - Checkout the specified branch in forge-core
# - Verify both repos are on matching branches
# - Enable Cargo [patch] to use local forge-core
# - Install pre-push safety hook
# - Start dev server with hot reload
```

**What happens:**
- `forge-core` cloned to `./forge-core` directory
- `.cargo/config.toml` [patch] section activated (local paths override git deps)
- `Cargo.lock` regenerated for path dependencies
- **Git hooks installed:**
  - `pre-commit` - Auto-stages forge-core changes
  - `prepare-commit-msg` - Auto-commits forge-core with same message
  - `pre-push` - Blocks push until dev-core is off
  - `forge-core/.git/hooks/pre-commit` - Blocks direct commits in forge-core
- Dev server starts watching both `forge-app/src` AND `forge-core/crates`

**Branch Matching Enforcement:**
The Makefile will ERROR if branches don't match:
```
❌ Branch mismatch detected:
  automagik-forge: feat/ui-improvements
  forge-core:      dev

💡 To fix: make dev-core BRANCH=feat/ui-improvements
```

### 2. Make Changes to forge-core

**Edit files in `./forge-core/crates/...`**

Example locations:
- `forge-core/crates/db/` - Database models and migrations
- `forge-core/crates/services/` - Business logic and task management
- `forge-core/crates/server/` - HTTP server and API routes
- `forge-core/crates/executors/` - Task execution engine

**Hot Reload:**
When you save files in `forge-core/crates`, `cargo-watch` automatically recompiles and restarts the backend. Frontend changes also hot reload.

**Testing:**
Your changes are immediately testable in the running dev server. The app uses your local forge-core code, not the git version.

### 3. Commit Changes (Single-Repo Experience)

> **CRITICAL: Commit from automagik-forge ROOT only!**
> NEVER run `git commit` inside forge-core directory.

**From automagik-forge root:**
```bash
# Stage your changes (both repos)
git add .

# Commit - hooks handle forge-core automatically
git commit -m "feat: add new task scheduling feature"

# What happens:
# 1. pre-commit hook → stages all forge-core changes
# 2. prepare-commit-msg hook → commits forge-core with SAME message
# 3. Both repos now have identical commits!
```

**If you try to commit in forge-core:**
```bash
cd forge-core && git commit -m "..."
# OUTPUT:
# ╔══════════════════════════════════════════════════════════════╗
# ║  COMMIT BLOCKED: Do NOT commit directly in forge-core    ║
# ╚══════════════════════════════════════════════════════════════╝
```

**Best practices:**
- Follow conventional commits: `feat:`, `fix:`, `refactor:`, etc.
- Write descriptive commit messages
- Reference related GitHub issues (e.g., "feat: ... (#123)")

### 4. Disable dev-core and Push

**MUST disable dev-core before pushing:**
```bash
# Back to automagik-forge root
make dev-core-off

# Now push both repos (forge-core was already committed by hooks!)
git push                              # automagik-forge
cd forge-core && git push && cd ..    # forge-core

# Create PRs for both repos
gh pr create --base main --fill                           # automagik-forge
cd forge-core && gh pr create --base main --fill && cd .. # forge-core
```

**PR Review:**
- Wait for CI to pass (lint, format, clippy, tests)
- Get approvals from maintainers
- Merge PR to `main` branch

### 5. Automated Tag Creation & Sync

**After your forge-core PR merges:**

**Step 5a: Maintainer Triggers Release (Manual)**
A maintainer with repo access runs:
```bash
# In forge-core repository via GitHub Actions UI
# Workflow: "Create GitHub Pre-Release"
# Trigger: workflow_dispatch
# Input: version_type (patch, minor, major, prerelease)
```

This creates a tag like `v0.8.5-20251201-143022` and triggers the automation.

**Step 5b: Automated Sync (Automatic)**
When forge-core pre-release.yml completes:
1. ✅ GitHub Actions sends `repository_dispatch` event to automagik-forge
2. ✅ `sync-forge-core-tag.yml` workflow triggers automatically
3. ✅ Creates PR in automagik-forge updating `Cargo.toml` references
4. ✅ PR is auto-labeled with `rc` and `dependencies`

**Step 5c: Automated Version Bump (Automatic)**
When sync PR merges:
1. ✅ `auto-version-bump.yml` detects `rc` label
2. ✅ Runs `unified-release.cjs --action bump-rc`
3. ✅ Updates package.json + Cargo.toml versions
4. ✅ Creates git tag (e.g., `v0.8.5-rc.1`)
5. ✅ Pushes to dev branch

**You don't touch automagik-forge!** The automation handles it.

### 6. Review & Merge automagik-forge Sync PR

**Check the auto-generated PR:**
- Verify the forge-core tag is correct
- CI should pass (tests run with new forge-core version)
- Review the changelog/release notes

**Merge the PR:**
Once CI passes and you've reviewed, merge the sync PR. This triggers the version bump automation (Step 5c above).

### 7. Disable dev-core Mode

**CRITICAL: Before pushing automagik-forge changes:**
```bash
cd .. # Back to automagik-forge root
make dev-core-off
```

**What this does:**
- Comments out [patch] section in `.cargo/config.toml`
- Restores git dependency references
- Regenerates `Cargo.lock` with git deps
- Verifies build works with git dependencies

**Verify with:**
```bash
make status
# Should show: Dev-core: OFF (git deps)
# Ready to push: YES
```

### 8. Continue Normal Development

You're back to normal! forge-core changes are now available to everyone via the git tag.

If you need to make more forge-core changes, repeat from Step 1.

---

## Tag Creation Process (Automated by CI)

**Workflow:** forge-core `.github/workflows/pre-release.yml`

**Trigger:** Manual `workflow_dispatch` by maintainer

**Process:**
1. Maintainer selects version bump type (patch, minor, major, prerelease)
2. CI bumps version in package.json + Cargo.toml files
3. CI builds all platforms (Linux, macOS, Windows, ARM)
4. CI creates GitHub pre-release with binaries
5. CI sends `repository_dispatch` event to automagik-forge ✨ **NEW**

**Tag Format:** `vX.Y.Z-YYYYMMDD-HHMMSS`

Example: `v0.8.5-20251201-143022`

---

## Branch Strategy

**Rule:** forge-core and automagik-forge branches MUST match during dev-core development.

**Enforced by:** Makefile (Phase 2)

**Examples:**

✅ **Correct:**
```bash
# In automagik-forge on branch: feat/task-scheduling
make dev-core BRANCH=feat/task-scheduling
# forge-core checks out: feat/task-scheduling
```

❌ **Incorrect (will be blocked):**
```bash
# In automagik-forge on branch: feat/ui-improvements
make dev-core BRANCH=dev
# ERROR: Branch mismatch!
```

**Why?**
Prevents confusing scenarios where local tests pass (using wrong forge-core branch) but CI fails (using correct branch).

---

## Troubleshooting

### "Branch mismatch detected" Error

**Symptom:**
```
❌ Branch mismatch detected:
  automagik-forge: feat/ui
  forge-core:      dev
```

**Solution:**
```bash
# Option 1: Use matching branch
make dev-core BRANCH=feat/ui

# Option 2: Switch automagik-forge branch
git checkout dev
make dev-core BRANCH=dev
```

### "Tag not found" CI Error

**Symptom:**
CI fails with `error: failed to get 'vX.Y.Z-...' as a dependency of package...`

**Cause:**
automagik-forge Cargo.toml references a forge-core tag that doesn't exist yet.

**Solution:**
Wait for forge-core pre-release workflow to complete. Tag creation takes 10-15 minutes (builds 6 platforms).

### "dev-core still active" Push Blocked

**Symptom:**
```
🛑 PUSH BLOCKED: dev-core mode is ACTIVE
```

**Solution:**
```bash
make dev-core-off
git push
```

**Why:** Pushing with [patch] active breaks everyone's build (they pull .cargo/config.toml with local paths).

### Cargo Fetch Errors After Tag Update

**Symptom:**
`cargo fetch` fails after bumping forge-core tag.

**Cause:**
Cargo.lock cached old git revision.

**Solution:**
```bash
rm Cargo.lock
cargo fetch
```

### Changes Not Hot Reloading

**Symptom:**
Edited forge-core files but dev server didn't rebuild.

**Solution:**
1. Check `FORGE_WATCH_PATHS` environment variable is set
2. Restart dev-core: Ctrl+C, then `make dev-core`
3. Verify file is in `forge-core/crates/` (not somewhere else)

---

## Commands Reference

### Dev-Core Lifecycle

| Command | Purpose |
|---------|---------|
| `make dev-core` | Enable local forge-core (dev branch) |
| `make dev-core BRANCH=x` | Enable with specific branch |
| `make dev-core-off` | Disable, restore git deps |
| `make dev-core-status` | Show dev-core mode details |

### Status & Validation

| Command | Purpose |
|---------|---------|
| `make status` | Cross-repo status (mode, branches, changes) |
| `make check-versions` | Validate version consistency |
| `make dev-core-check` | Health check / diagnostics |

### Commit & Push (Cross-Repo)

| Command | Purpose |
|---------|---------|
| `make commit-both` | Commit to both repos (same message) |
| `make push-both` | Push both repos (same branch) |
| `make pr` | Create linked PRs in both repos |

**Note:** `push-both` and `pr` require dev-core-off first (safety check).

---

## Common Pitfalls

### 1. Forgetting to Disable dev-core

**Problem:** Push automagik-forge with [patch] active → breaks everyone's build.

**Prevention:** Pre-push hook blocks this automatically (unless bypassed with `--no-verify`).

**Fix:** Force-push after `make dev-core-off`.

### 2. Creating forge-core PR Without automagik-forge PR

**Problem:** forge-core changes exist but never get consumed.

**Prevention:** Automation now handles this! sync-forge-core-tag.yml creates the PR automatically.

**Old manual method (no longer needed):** `./scripts/bump-forge-core.sh vX.Y.Z`

### 3. Testing with Mismatched Branches

**Problem:** Local tests pass (wrong forge-core), CI fails (correct forge-core).

**Prevention:** Branch matching enforcement in Makefile (Phase 2).

### 4. Version Tag Doesn't Exist Yet

**Problem:** Update automagik-forge before forge-core tag exists → CI fails.

**Prevention:** Wait for forge-core pre-release workflow to complete (~15 min).

**Detection:** CI now validates tag existence before building (Phase 5).

---

## Architecture: How It Works

### Normal Mode (Git Dependencies)

```
automagik-forge Cargo.toml:
  forge-core = { git = "...", tag = "v0.8.4-..." }

Cargo fetches:
  https://github.com/namastexlabs/forge-core.git @ tag
```

### Dev-Core Mode (Local Dependencies)

```
.cargo/config.toml [patch] section:
  [patch."https://github.com/namastexlabs/forge-core.git"]
  db = { path = "forge-core/crates/db" }
  services = { path = "forge-core/crates/services" }
  ...

Cargo uses:
  ./forge-core/crates/* (local files)
```

### The Automation Flow

```
Developer creates forge-core PR
  ↓ (merge)
dev branch updated
  ↓ (manual trigger)
Maintainer runs pre-release.yml
  ↓ (automated)
Tag created (e.g., v0.8.5-20251201-143022)
  ↓ (repository_dispatch)
automagik-forge sync-forge-core-tag.yml triggers
  ↓ (automated)
PR created: Update Cargo.toml tags
  ↓ (human review + merge)
auto-version-bump.yml triggers
  ↓ (automated)
automagik-forge version bumped (v0.8.5-rc.1)
  ↓ (automated)
CI builds + deploys
```

---

## Getting Help

**Documentation:**
- This file: Complete workflow guide
- `DEVELOPER.md`: General development setup
- `CONTRIBUTING.md`: Contribution guidelines

**Commands:**
```bash
make help          # All available make targets
make dev-help      # Cross-repo commands help
make status        # Current repo states
```

**Issues:**
- Branch mismatch? Check `make status`
- Version errors? Run `make check-versions`
- CI failures? Check `.github/workflows/test.yml` logs
- Still stuck? Ask in #dev channel or create GitHub issue
