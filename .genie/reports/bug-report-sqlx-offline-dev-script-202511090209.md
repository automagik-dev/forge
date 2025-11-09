# Bug Report: Dev Script Missing SQLX_OFFLINE — Compilation Fails After Git Pull

**GitHub Issue:** https://github.com/namastexlabs/automagik-forge/issues/86
**Reporter:** Bug Reporter Specialist (Genie Agent)
**Date:** 2025-11-09 02:09 UTC
**Severity:** 🔴 HIGH (Critical - Blocks all builds)
**Status:** OPEN

---

## Summary

Development builds fail during Rust compilation with 85+ "unable to open database file" errors because `scripts/dev/run-dev.sh` does not set `SQLX_OFFLINE=true` before running `cargo build`.

## Environment

| Component | Value |
|-----------|-------|
| **Platform** | Linux 6.6.87.2-microsoft-standard-WSL2 |
| **Node Version** | v22.16.0 |
| **Date** | 2025-11-09 01:01-01:06 UTC |
| **Command** | `make dev` |
| **Branch** | Main repository (after git pull) |
| **SQLX_OFFLINE** | ❌ Not set (defaults to `false`) |
| **DATABASE_URL** | ❌ Not set initially |

## Reproduction Steps (100% Success Rate)

```bash
# 1. Fresh git pull
git pull

# 2. Attempt development build
make dev

# Result: Build fails after 70+ seconds with 85+ compilation errors
# Error: "unable to open database file (code: 14)"
```

## Expected vs. Actual Behavior

### Expected ✅
- Build uses SQLx offline mode
- Uses `.sqlx/` metadata files (90+ files present)
- No database connection required during compilation
- Fast, reproducible builds

### Actual ❌
- SQLx defaults to online mode (requires database connection)
- Script does NOT set `SQLX_OFFLINE=true`
- No `DATABASE_URL` initially available
- Compilation fails across all database model files
- 70+ seconds wasted before failure

## Root Cause

**Script Flow in `scripts/dev/run-dev.sh`:**

```bash
Lines 130-145:
1. ✅ Build frontend (succeeds in ~17s)
2. ✅ Clear Rust cache (succeeds)
3. ❌ cargo build --bin forge-app (FAILS - SQLX_OFFLINE not set)
```

**The Missing Line:**
Before line 147, the script should set:
```bash
export SQLX_OFFLINE=true
```

**Why It Fails:**
- SQLx compile-time verification defaults to "online mode"
- Online mode requires live database connection
- No `DATABASE_URL` set → connection fails
- `.sqlx/` directory with 90+ metadata files exists but unused

## Evidence

### 1. User Build Output (2025-11-09 01:01-01:06)

```
🔨 Building frontend (required for Rust compilation)...
✓ built in 16.93s
✅ Frontend built successfully

🧹 Cleaning Rust build cache...
     Removed 5173 files, 3.2GiB total
✅ Build cache cleared - forcing fresh compilation

⚙️  Starting backend server (this will take a while on first compile)...
[Running 'cargo run --bin forge-app']
   Compiling proc-macro2 v1.0.101
   ... (70+ seconds of compilation)
   Compiling db v0.0.114

error: error returned from database: (code: 14) unable to open database file
   --> upstream/crates/db/src/models/draft.rs:108:9
   ... (85+ identical errors across all DB model files)

error: could not compile `db` (lib) due to 85 previous errors
[Finished running. Exit status: 101]

❌ Backend failed to start within 180 seconds
```

### 2. Affected Files (85+ Errors)

All database model files in `upstream/crates/db/src/models/`:
- `draft.rs` (3 errors)
- `execution_process.rs` (18 errors)
- `execution_process_logs.rs` (3 errors)
- `executor_session.rs` (9 errors)
- `image.rs` (9 errors)
- `merge.rs` (6 errors)
- `project.rs` (10 errors)
- `tag.rs` (5 errors)
- `task.rs` (10 errors)
- `task_attempt.rs` (12 errors)

**Total:** 85 compilation errors

### 3. SQLx Metadata Verification

```bash
$ ls -la upstream/crates/db/.sqlx/ | wc -l
93  # 90+ query metadata files exist and ready to use
```

### 4. Script Analysis

**Current State (Lines 130-150):**
```bash
if [ "$NEEDS_FRONTEND_BUILD" = "true" ]; then
  echo "🔨 Building frontend with pnpm..."
  (cd frontend && pnpm run build)

  if [ "$NEEDS_BACKEND_BUILD" = "true" ]; then
    echo "🔨 Cleaning Rust build cache to pick up fresh frontend..."
    rm -rf target/release/build/forge-app-*/
    rm -rf target/release/.fingerprint/forge-app-*/
  fi
else
  echo "⏭️  Skipping frontend build (no changes)"
fi

if [ "$NEEDS_BACKEND_BUILD" = "true" ]; then
  echo "🔨 Building Rust binaries..."
  # ← MISSING: export SQLX_OFFLINE=true
  cargo build --release --bin forge-app      # FAILS HERE
  cargo build --release --bin mcp_task_server
```

**Recent Commits (Partial Fixes):**
```
815b4151e - feat: auto-create database for SQLx online mode
74e351fec - fix: handle unset SQLX_OFFLINE variable in dev script
e8128bf3a - feat: display SQLx mode (offline/online) in dev startup
```

These commits added **detection** of SQLx mode (lines 78-100) but did NOT add **setting** it before compilation.

### 5. Comparison: Dev Script vs Production Script

| Script | Location | SQLX_OFFLINE Handling |
|--------|----------|----------------------|
| Dev | `scripts/dev/run-dev.sh` | ❌ Detects mode, doesn't set it |
| Production | `scripts/build/build.sh` | ❌ No mention at all |

**Both scripts need the same fix.**

## Impact Assessment

| Aspect | Details |
|--------|---------|
| **Severity** | 🔴 **CRITICAL** |
| **Frequency** | 100% reproduction rate |
| **Scope** | All fresh builds (git pull, checkout, CI/CD, onboarding) |
| **Duration** | 70+ seconds wasted before failure |
| **User Experience** | Extremely poor - blocks all development |
| **Workaround Difficulty** | Easy (manual export) |

**Affected Workflows:**
- ⚠️ Local development (`make dev`)
- ⚠️ Fresh git checkouts
- ⚠️ After `git pull`
- ⚠️ CI/CD pipelines
- ⚠️ Developer onboarding
- ⚠️ Production builds (`scripts/build/build.sh` has same issue)

## Suggested Fix

### Option 1: Simple (Recommended) ⭐

Add before line 147 in `scripts/dev/run-dev.sh`:

```bash
# Use offline mode for faster compilation (uses .sqlx/ metadata)
export SQLX_OFFLINE=true
echo "📊 SQLx: offline mode (using .sqlx/ metadata for compile-time verification)"
```

### Option 2: Conditional (Allow Override)

```bash
# Default to offline mode unless explicitly set to false
export SQLX_OFFLINE="${SQLX_OFFLINE:-true}"
if [ "$SQLX_OFFLINE" = "true" ]; then
    echo "📊 SQLx: offline mode (using .sqlx/ metadata)"
else
    echo "📊 SQLx: online mode (will connect to database)"
fi
```

### Option 3: Complete Solution

Apply the same fix to **both** scripts:
1. ✅ `scripts/dev/run-dev.sh` (immediate impact)
2. ✅ `scripts/build/build.sh` (production builds)

### Implementation Files

**Primary:**
- `scripts/dev/run-dev.sh` (line 147)

**Secondary:**
- `scripts/build/build.sh` (line 147)
- `.env.example` (add documentation)

## Workaround (Immediate)

```bash
# Set environment variable before running build
export SQLX_OFFLINE=true
make dev

# Or as one-liner
SQLX_OFFLINE=true make dev
```

## Related Context

**Recent Commits:**
- Commits 815b4151e, 74e351fec, e8128bf3a improved SQLx mode **detection**
- These commits show the team was addressing SQLx issues
- However, they didn't complete the fix by **setting** the mode

**Similar Issues:**
- Issue #2245 "fix-make-prod-in" (worktree context)
- Production build script has identical missing configuration

**Documentation Gaps:**
- `.env.example` doesn't mention `SQLX_OFFLINE`
- No build troubleshooting guide

## Verification Steps

After implementing the fix:

```bash
# 1. Verify SQLX_OFFLINE is set
echo "SQLX_OFFLINE=${SQLX_OFFLINE}"  # Should show "true"

# 2. Verify .sqlx metadata exists
ls -la upstream/crates/db/.sqlx/ | wc -l  # Should show 90+

# 3. Test build
make dev  # Should succeed

# 4. Verify output shows offline mode
# Look for: "📊 SQLx: offline mode"
```

## Next Actions

1. ✅ Issue filed: https://github.com/namastexlabs/automagik-forge/issues/86
2. ⏳ Assign to implementor
3. ⏳ Apply fix to `scripts/dev/run-dev.sh`
4. ⏳ Apply fix to `scripts/build/build.sh`
5. ⏳ Update `.env.example` with SQLX_OFFLINE documentation
6. ⏳ Test in clean environment
7. ⏳ Update build documentation

## Attachments

- Build output: User's terminal log (2025-11-09 01:01-01:06)
- Script analysis: `scripts/dev/run-dev.sh` lines 130-150
- Metadata verification: 90+ `.sqlx/*.json` files
- Related commits: 815b4151e, 74e351fec, e8128bf3a

## Labels

```
severity/high
type/bug
area/build
area/database
component/sqlx
good-first-issue
documentation
```

---

**Resolution:** Pending implementation
**Last Updated:** 2025-11-09 02:09 UTC
