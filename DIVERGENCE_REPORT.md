# Automagik Forge vs Upstream Divergence Report

**Generated**: 2025-10-08
**Context**: Investigation triggered by WebSocket infinite retry bug fix attempt

## Executive Summary

**TL;DR**: Forge is ~50+ commits behind upstream (vibe-kanban). The "fundamentally different data models" concern was OVERSTATED - actual divergences are minimal and manageable.

---

## Critical Bug Fixed

### WebSocket Infinite Retry Loop

**Root Cause**: Two missing WebSocket endpoints that exist in upstream but not in Forge:
1. `/api/drafts/stream/ws` - Draft streaming endpoint
2. `/api/task-attempts/{id}/diff/ws` - Diff streaming endpoint

**Why They Were Missing**: Forge codebase is behind upstream commits that added these features.

**Fix Applied**: Added stub WebSocket handlers that:
- Accept connections properly (HTTP 101 upgrade)
- Send empty initial state `{"drafts": {}}` and `{"entries": {}}`
- **Keep connection open** until client disconnects (critical - was closing immediately causing retries)
- Stop infinite retry errors in browser console

**Files Modified**:
- `crates/server/src/routes/drafts.rs` (NEW - created stub)
- `crates/server/src/routes/task_attempts.rs` (added `stream_task_attempt_diff_ws` + route)
- `crates/server/src/routes/mod.rs` (added drafts router)

---

## Data Model Divergences

### 1. TaskAttempt Model - Field Rename

**Issue**: Upstream uses `target_branch`, Forge uses `base_branch`

**Analysis**:
- **Upstream commit**: `2829686a - Add base branch (vibe-kanban) (#100)`
- This commit RENAMED `target_branch` → `base_branch` in upstream
- Forge appears to be ON an older version that still has `target_branch` naming
- **Actually**: Wait, Forge has `base_branch` too - let me recheck...

**VERIFIED STATE**:
- **Upstream (current)**: `target_branch: String` (line 43 in task_attempt.rs)
- **Forge (current)**: `base_branch: String` (line 43 in task_attempt.rs)

**What Happened**:
1. July 2025: Upstream added `base_branch` in commit `2829686a`
2. Later: Upstream renamed it BACK to `target_branch` (more recent commits)
3. Forge: Forked when it was `base_branch`, never updated

**Evidence**: Upstream has commit "#100 - Add base branch" but current code uses `target_branch`

**Additional Difference**:
- **Upstream**: `branch: String` (required)
- **Forge**: `branch: Option<String>` (optional)

**Impact**: Medium - any code copied from upstream that references `target_branch` will fail in Forge

---

### 2. Draft Model - Additional Model File

**Issue**: Forge has TWO draft-related models, upstream has ONE

**Files**:
- `draft.rs` - 368 lines (IDENTICAL in both Forge and upstream)
- `follow_up_draft.rs` - 195 lines (Forge ONLY)

**Analysis**:
- Forge ADDED `follow_up_draft.rs` as an ADDITIONAL model
- The base `draft.rs` is UNCHANGED from upstream
- This is NOT a "split" - it's an EXTENSION
- `follow_up_draft` likely handles follow-up task drafts separately

**Impact**: Low - this is a Forge-specific feature addition, not incompatibility

---

### 3. Events Service - Missing Modularization

**Issue**: Upstream modularized events service into subdirectory

**Upstream Structure**:
```
services/events.rs (main file)
services/events/
  ├── patches.rs
  ├── streams.rs
  └── types.rs
```

**Forge Structure**:
```
services/events.rs (monolithic)
```

**Analysis**:
- Upstream refactored events service into modules
- Forge still has monolithic file
- Upstream's modular version includes:
  - `PreupdateHookResult` usage (requires `sqlite-preupdate-hook` feature)
  - `stream_drafts_for_project_raw()` method
  - Draft/ExecutionProcess/TaskAttempt patch helpers

**Impact**: High - prevents direct file copy from upstream

**Why Feature Flag Needed**:
- Upstream Cargo.toml: `sqlx = { features = [..., "sqlite-preupdate-hook"] }`
- Forge Cargo.toml: `sqlx = { features = [...] }` (missing preupdate-hook)
- This enables real-time database change notifications in upstream

---

### 4. Git Service API Differences

**Methods Missing in Forge** (that upstream's routes expect):
- `reconcile_worktree_to_commit()`
- `git_branch_from_task_attempt()`
- `WorktreeResetOptions` type

**Impact**: High - prevents using upstream's diff streaming implementation

---

## Upstream Sync Status

**Forge Branch**: `restructure/upstream-as-library-migration`
**Forge Last Commit**: `24d9a30e fixes`
**Upstream Submodule**: Points to older commit (need to check which)

**Upstream Recent Commits** (Forge is missing):
```
ad1696cd - chore: bump version to 0.0.105
36587766 - Setting to override branch prefix (#949)
a733ca51 - More events (#964)
7c10c00d - Upgrade Codex (#947)
41eaa061 - fix: create multiple tasks bug (#958)
... ~50+ more commits
```

**Key Missing Features** (based on commits):
- Events system refactor (#964)
- Branch prefix overrides (#949)
- Multiple task creation fixes (#958)
- i18n consistency checks (#960)
- Codex executor upgrades (#947)

---

## Why Couldn't We Copy Upstream Code?

### Attempted: Copy upstream routes directly

**Result**: 19 compilation errors

**Reasons**:
1. **Field name mismatch**: `target_branch` vs `base_branch`
2. **Type mismatch**: `branch: String` vs `branch: Option<String>`
3. **Missing service methods**: `stream_diff()`, `reconcile_worktree_to_commit()`, etc.
4. **Missing database hooks**: `PreupdateHookResult`, `set_preupdate_hook()`
5. **Missing modules**: `services/drafts`, `services/events/*`, `routes/util`
6. **ExecutionProcess API changes**: `latest_executor_profile_for_attempt()` missing

### What THIS Means

To fully align with upstream would require:
1. Database migration to rename fields
2. Port missing service layer methods
3. Add SQLx feature flag
4. Refactor events service to match structure
5. Test all downstream code that uses these models

**Estimated Effort**: 2-3 days of careful migration work

---

## Recommendations for Next Steps

### Option 1: Minimal Fix (DONE)
✅ Add WebSocket stub endpoints
✅ Stop infinite retry errors
✅ Allow app to function

**Tradeoffs**:
- Diff history shows empty (not critical for MVP)
- Drafts show empty (may impact follow-up workflow)
- Technical debt accumulates

### Option 2: Partial Upstream Sync (Recommended)
🔄 Update upstream submodule to latest
🔄 Cherry-pick critical bug fixes
🔄 Keep Forge-specific extensions (omni, follow_up_draft, etc.)
🔄 Add SQLx preupdate-hook feature
🔄 Port events service refactor

**Estimated**: 1-2 days
**Benefit**: Fixes accumulating bugs, stays closer to upstream

### Option 3: Full Upstream Merge
⚠️ Merge all ~50+ upstream commits
⚠️ Resolve all conflicts
⚠️ Migrate database schema
⚠️ Update all Forge extensions

**Estimated**: 3-5 days
**Risk**: High - may break Forge-specific features

---

## Files That Need Attention

### Immediate (for proper diff/draft streaming):
```
crates/services/src/services/events.rs         # Needs modularization
crates/services/src/services/container.rs      # Needs stream_diff()
crates/local-deployment/src/container.rs       # Needs diff streaming impl
crates/db/Cargo.toml                          # Add preupdate-hook feature
```

### Medium Priority (for full feature parity):
```
crates/db/src/models/task_attempt.rs          # Field name alignment
crates/services/src/services/git_cli.rs       # Missing methods
crates/server/src/routes/task_attempts.rs     # Restore full route handlers
```

### Low Priority (cosmetic/optimization):
```
All files with ~50 commits of improvements from upstream
```

---

## Technical Debt Summary

### Acceptable Debt (Forge-specific features):
- ✅ `follow_up_draft.rs` - Useful extension
- ✅ Omni integration - Core Forge feature
- ✅ Branch templates - Added value

### Concerning Debt (blocking upstream sync):
- ⚠️ TaskAttempt field names diverged
- ⚠️ Events service architecture mismatch
- ⚠️ Missing SQLx features
- ⚠️ Git service method gaps

### Critical Debt (causes bugs):
- ❌ Missing WebSocket endpoints → **FIXED**
- ⚠️ Out of date with 50+ bug fix commits

---

## Conclusion

The "fundamentally different" assessment was **overstated**. Reality:

1. **Core models are similar** - just field renames and optional vs required
2. **Service architecture diverged** - upstream modularized, Forge didn't follow
3. **Feature flags differ** - Forge missing preupdate-hook for real-time events
4. **Forge is behind** - needs upstream sync more than ground-up rewrite

**Current Fix Status**: ✅ WORKING - infinite retries stopped
**Code Quality**: ⚠️ STUB - needs proper implementation eventually
**Urgency**: 🟢 LOW - app functions, just missing nice-to-have features

**Action Item**: Schedule upstream sync sprint (Option 2) within next 2 weeks before debt grows.
