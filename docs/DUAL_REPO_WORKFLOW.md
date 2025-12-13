# Working with forge-core

This guide explains how to develop features that span both `automagik-forge` (main app) and `forge-core` (library dependency).

> **WARNING: NEVER do git operations directly in forge-core!**
> Blocker hooks will reject direct commits AND pushes. Always operate from automagik-forge root.

## Quick Start (For Experienced Developers)

```bash
# 1. Enable dev-core mode (syncs both repos to same branch)
make dev-core BRANCH=feat/my-feature

# 2. Edit files in EITHER or BOTH repos
# Changes auto-rebuild via cargo-watch

# 3. Commit from automagik-forge ROOT ONLY
git add . && git commit -m "feat: your changes"
# → pre-commit hook stages forge-core changes
# → prepare-commit-msg hook commits forge-core with SAME message

# 4. Push - FULLY AUTOMATIC!
git push
# → pre-push hook pushes forge-core first
# → pre-push hook disables Cargo [patch]
# → pre-push hook amends commit with Cargo.lock
# → Push proceeds!

# 5. Create PRs for BOTH repos
make pr-both                # Creates PRs in both repos with RC label
```

> **NOTE:** `make dev-core-off` is NO LONGER NEEDED - the pre-push hook handles everything automatically!

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
  - `pre-push` - **FULLY AUTOMATIC**: pushes forge-core, disables patches, amends commit
  - `forge-core/.git/hooks/pre-commit` - Blocks direct commits in forge-core
  - `forge-core/.git/hooks/pre-push` - Blocks direct pushes in forge-core
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

### 4. Push (Fully Automatic!)

**Just push from automagik-forge root - hooks handle everything:**
```bash
git push
```

**What the pre-push hook does automatically:**
1. Pushes forge-core first (if has unpushed commits)
2. Disables Cargo [patch] overrides (comments out config)
3. Regenerates Cargo.lock with git dependencies
4. Amends commit with config changes
5. Allows forge push to proceed

**Then create PRs:**
```bash
make pr-both   # Creates PRs in both repos with RC label
```

**PR Review:**
- Wait for CI to pass (lint, format, clippy, tests)
- Get approvals from maintainers
- Merge PR to `main` branch

> **NOTE:** `make dev-core-off` is no longer needed - the pre-push hook handles this automatically!

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

### 7. Continue Normal Development

After pushing, the pre-push hook automatically disabled dev-core mode. You're back to normal!

If you need to make more forge-core changes, just run `make dev-core BRANCH=xxx` again.


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

### Push Automatically Disables dev-core

**New Behavior (as of Dec 2025):**
The pre-push hook now automatically disables dev-core mode. You no longer need to run `make dev-core-off` manually.

**What happens on `git push`:**
1. forge-core is pushed first (if has unpushed commits)
2. Cargo [patch] is automatically disabled
3. Cargo.lock is regenerated
4. Commit is amended with config changes
5. Push proceeds

**If you see errors:**
The pre-push hook will show clear error messages if something fails. Common issues:
- forge-core push fails → Check your remote access
- Cargo fetch fails → Network issue or tag doesn't exist yet

### forge-core-only Changes (No automagik-forge Changes)

**Symptom:**
You made changes only in forge-core but automagik-forge has nothing to commit. The hooks require a forge commit to trigger sync.

**Solution:**
The hooks are designed for when BOTH repos have related changes. For forge-core-only changes:

1. Make a related documentation update in automagik-forge (like this file!)
2. Commit from automagik-forge root - hooks sync both repos
3. Both repos get the same commit message

**Why this design:**
- Keeps commits semantically linked across repos
- Prevents orphaned forge-core changes
- Encourages documenting why changes were made

**⚠️ WARNING:** Always commit before abandoning work. Uncommitted changes in forge-core will be lost if you delete the directory.

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
| `git push` | Automatically disables dev-core via pre-push hook |
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

**Note:** The pre-push hook now handles disabling dev-core automatically. Just `git push` from forge root.

---

## Common Pitfalls

### 1. ~~Forgetting to Disable dev-core~~ (SOLVED!)

**Problem:** Push automagik-forge with [patch] active → breaks everyone's build.

**Prevention:** Pre-push hook now **automatically disables** dev-core mode before pushing!

**How it works:** The hook comments out [patch] section, regenerates Cargo.lock, and amends the commit - all automatically.

### 2. Creating forge-core PR Without automagik-forge PR

**Problem:** forge-core changes exist but never get consumed.

**Prevention:** Automation now handles this! sync-forge-core-tag.yml creates the PR automatically.

**Old manual method (no longer needed):** `./scripts/bump-forge-core.sh vX.Y.Z`

### 3. Testing with Mismatched Branches

**Problem:** Local tests pass (wrong forge-core), CI fails (correct forge-core).

**Prevention:** Branch matching enforcement in Makefile (Phase 2).

### 4. GitHub Actions Tag Patterns

**Important:** GitHub's `on.push.tags` uses **glob patterns**, not regex!
- ❌ `v[0-9]+` - Only matches single digit + literal `+` character
- ✅ `v[0-9]*` - Matches any digit sequence (correct glob syntax)

Example patterns in workflow files:
```yaml
tags:
  - 'v[0-9]*.[0-9]*.[0-9]*'        # Matches v0.8.7, v10.20.30
  - 'v[0-9]*.[0-9]*.[0-9]*-rc.*'   # Matches v0.8.7-rc.30
```

### 5. Version Tag Doesn't Exist Yet

**Problem:** Update automagik-forge before forge-core tag exists → CI fails.

**Prevention:** Wait for forge-core pre-release workflow to complete (~15 min).

### 6. Import Ordering in Rust Code

**Problem:** CI fails with `cargo fmt --all -- --check` due to import ordering.

**Prevention:** Always run `cargo fmt --all` before committing Rust code changes.

### 7. forge-core CI Simplification (Dec 2025)

**Change:** forge-core CI was simplified to publish source only to crates.io.

**Removed:**
- Multi-platform binary builds (Linux, Windows, macOS)
- npx-cli packaging
- macOS code signing and notarization
- GitHub pre-release with tgz files

**Why:** crates.io publishes source code, not binaries. Users compile for their platform.

**New flow:** `workflow_dispatch → bump-version → publish-crates.yml`

**Result:** Build time reduced from 10+ minutes to <3 minutes.

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
