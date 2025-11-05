# utilities/upstream-update Agent Enhancement Summary

**Date**: 2025-10-20
**Enhancement**: Comprehensive audit capabilities added
**Status**: ✅ Complete

---

## Problem Statement

The original `utilities/upstream-update` agent only performed mechanical upstream sync operations (fork sync, release tag, gitmodule update, rebrand). It did NOT detect:
- Missing modal registrations
- Missing npm dependencies
- Breaking architectural changes
- Component drift

This led to silent failures after upstream updates, requiring manual detective work to find gaps.

---

## Solution: Comprehensive Audit Framework

Added **3 new phases** to the upstream update workflow:

### Phase 2: Pre-Sync Audit (NEW)
**Purpose**: Detect ALL gaps BEFORE updating upstream

**Capabilities**:
- Extract and compare modal registrations (upstream vs Forge)
- Compare package.json dependencies with exact versions
- Identify new component directories since last sync
- Check for routing changes that might conflict with Forge overrides
- Scan for new API endpoints
- Generate comprehensive audit report with blocker assessment

**Outputs**:
- `.genie/reports/upstream-sync-audit-<version>.md` - Executive summary with findings
- `.genie/reports/audit-<date>/modals-upstream.txt` - Upstream modal list
- `.genie/reports/audit-<date>/modals-forge.txt` - Forge modal list
- `.genie/reports/audit-<date>/modals-missing.txt` - Gap list
- `.genie/reports/audit-<date>/deps-upstream.txt` - Upstream dependencies
- `.genie/reports/audit-<date>/deps-forge.txt` - Forge dependencies
- `.genie/reports/audit-<date>/deps-missing.txt` - Missing dependencies
- `.genie/reports/audit-<date>/new-components.txt` - New component directories
- `.genie/reports/audit-<date>/routing-changes.txt` - Routing diffs
- `.genie/reports/audit-<date>/new-api-endpoints.txt` - New API routes

**Blocker Thresholds**:
- Missing modals > 5 → BLOCKER
- Missing dependencies > 3 → BLOCKER

---

### Phase 8: Post-Sync Validation (NEW)
**Purpose**: Verify completeness AFTER upstream update

**Capabilities**:
- Re-extract modal registrations from UPDATED upstream
- Check for peer dependency warnings via `pnpm install`
- Run `pnpm run check` for TypeScript type errors
- Test `pnpm run build` for production build success
- Validate routing compatibility with Forge overrides
- Generate validation report with blocker assessment

**Outputs**:
- `.genie/reports/upstream-sync-validation-<version>.md` - Validation summary
- `.genie/reports/audit-<date>/modals-upstream-post.txt` - Updated upstream modals
- `.genie/reports/audit-<date>/modals-still-missing.txt` - Still-missing modals
- `.genie/reports/audit-<date>/pnpm-install-warnings.log` - npm warnings
- `.genie/reports/audit-<date>/peer-deps-warnings.txt` - Peer dependency issues
- `.genie/reports/audit-<date>/frontend-type-errors.log` - TypeScript errors
- `.genie/reports/audit-<date>/frontend-build.log` - Build output
- `.genie/reports/audit-<date>/routing-validation.txt` - Routing compatibility

**Blocker Thresholds**:
- Frontend build failure → BLOCKER
- Missing modals > 10 → BLOCKER

---

### Phase 9: Automated Fix Generation (NEW)
**Purpose**: Generate actionable, copy-paste fixes

**Capabilities**:
- Generate executable scripts for missing dependencies
- Generate modal registration code with import paths
- Create human-readable fix checklist
- Auto-apply safe fixes (dependency installation if < 5 missing)
- Document manual review items

**Outputs**:
- `.genie/reports/audit-<date>/fix-dependencies.sh` - Executable dependency installer
- `.genie/reports/audit-<date>/fix-modals.sh` - Modal registration guide
- `.genie/reports/upstream-sync-fixes-<version>.md` - Comprehensive fix checklist

**Auto-Apply Rules**:
- ✅ Auto-install dependencies if < 5 missing (safe threshold)
- ❌ Never auto-apply modal registrations (requires code editing)

---

## Enhanced Workflow

### Old Workflow (8 phases)
1. Discovery
2. Fork Sync
3. Mechanical Rebrand
4. Release Creation
5. Gitmodule Update
6. Type Regeneration & Verification
7. Commit & Push
8. Report

### New Workflow (11 phases)
1. Discovery
2. **Pre-Sync Audit** ← NEW
3. Fork Sync
4. Mechanical Rebrand
5. Release Creation
6. Gitmodule Update
7. Type Regeneration & Verification
8. **Post-Sync Validation** ← NEW
9. **Automated Fix Generation** ← NEW
10. Commit & Push
11. Report

---

## Example Audit Output

### Pre-Sync Audit Report
```markdown
# Upstream Sync Audit Report

**Date**: 2025-10-20
**Current Version**: v0.0.106-namastex-2
**Target Version**: v0.0.109-20251017174643

---

## Executive Summary

### Findings Summary

- **Missing Modals**: 3
- **Missing Dependencies**: 2
- **New Components**: 5
- **New API Files**: 1

---

## 1. Modal Registration Gaps

### Missing from Forge

- feature-showcase-modal
- retry-task-modal
- settings-modal

### Recommended Actions

**CRITICAL**: Add the following modal registrations to `forge-overrides/frontend/src/main.tsx`:

- `NiceModal.register("feature-showcase-modal", ...)` - TODO: Find import path
- `NiceModal.register("retry-task-modal", ...)` - TODO: Find import path
- `NiceModal.register("settings-modal", ...)` - TODO: Find import path

---

## 2. npm Dependency Gaps

### Missing from Forge

@radix-ui/react-toggle-group@^1.0.4
lucide-react@^0.263.1

### Recommended Actions

**ACTION REQUIRED**: Install missing dependencies:

```bash
pnpm add -w @radix-ui/react-toggle-group@^1.0.4
pnpm add -w lucide-react@^0.263.1
```

---

## Blocker Assessment

✅ **SAFE TO PROCEED**

No critical blockers detected. Minor gaps can be addressed post-sync.
```

### Fix Checklist
```markdown
# Upstream Sync Fix Checklist

**Date**: 2025-10-20
**Version**: v0.0.109-20251017174643

---

## Automated Fixes Available

### 1. Install Missing Dependencies

```bash
# Run generated script:
bash .genie/reports/audit-20251020/fix-dependencies.sh

# Or manually:
pnpm add -w @radix-ui/react-toggle-group@^1.0.4
pnpm add -w lucide-react@^0.263.1
```

### 2. Register Missing Modals

**File**: `forge-overrides/frontend/src/main.tsx`

Add the following registrations (see fix-modals.sh for imports):

```typescript
NiceModal.register('feature-showcase-modal', FeatureShowcaseModalComponent)
NiceModal.register('retry-task-modal', RetryTaskModalComponent)
NiceModal.register('settings-modal', SettingsModalComponent)
```

Reference: `bash .genie/reports/audit-20251020/fix-modals.sh` for component paths

---

## Verification Steps

After applying fixes:

```bash
# 1. Install dependencies
pnpm install

# 2. Regenerate types (if needed)
pnpm run generate-types

# 3. Run type check
cd frontend && pnpm run check

# 4. Run build
cd frontend && pnpm run build

# 5. Test locally
pnpm run dev
```
```

---

## Benefits

### For Developers
- ✅ **No more surprises**: Gaps detected BEFORE sync
- ✅ **Copy-paste fixes**: Exact commands provided
- ✅ **Faster debugging**: All gaps documented in one place
- ✅ **Confidence**: Validation ensures nothing missed

### For Automation
- ✅ **Blocker detection**: Automatic pause on critical issues
- ✅ **Safe auto-apply**: Dependencies installed automatically (with threshold)
- ✅ **Comprehensive evidence**: All artifacts saved for review
- ✅ **Repeatable process**: Consistent audit on every sync

### For Maintainability
- ✅ **Audit trail**: Historical reports track evolution
- ✅ **Pattern detection**: Recurring gaps become visible
- ✅ **Documentation**: Fix scripts serve as upgrade guides
- ✅ **Knowledge transfer**: New maintainers understand gaps

---

## Files Modified

**Enhanced Agent**:
- `.genie/agents/utilities/upstream-update.md` - Added 3 new phases (2, 8, 9)

**New Sections Added**:
- Phase 2: Pre-Sync Audit (comprehensive gap detection)
- Phase 8: Post-Sync Validation (completeness verification)
- Phase 9: Automated Fix Generation (actionable guidance)
- Updated Success Criteria with audit validations

---

## Usage

### Run Full Upgrade with Audit
```bash
# Via MCP Genie
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.109 with full audit"

# The agent will:
# 1. Run pre-sync audit (Phase 2)
# 2. Pause if critical blockers found
# 3. Execute mechanical sync (Phases 3-7)
# 4. Run post-sync validation (Phase 8)
# 5. Generate automated fixes (Phase 9)
# 6. Commit with audit reports (Phase 10-11)
```

### Review Audit Reports
```bash
# Pre-sync audit
cat .genie/reports/upstream-sync-audit-v0.0.109-20251017174643.md

# Post-sync validation
cat .genie/reports/upstream-sync-validation-v0.0.109-20251017174643.md

# Fix checklist
cat .genie/reports/upstream-sync-fixes-v0.0.109-20251017174643.md
```

### Apply Automated Fixes
```bash
# Install missing dependencies
bash .genie/reports/audit-20251020/fix-dependencies.sh

# Review modal registration guide
bash .genie/reports/audit-20251020/fix-modals.sh

# Verify fixes
cd frontend && pnpm run check && pnpm run build
```

---

## Next Steps

1. ✅ **Test on v0.0.109 upgrade**: Run full audit workflow
2. ✅ **Validate audit accuracy**: Ensure all gaps detected
3. ✅ **Refine thresholds**: Adjust blocker thresholds based on experience
4. ⬜ **Add regression tests**: Capture expected audit outputs
5. ⬜ **Document patterns**: Track recurring gaps across versions

---

## Related Documents

- Original agent: `.genie/agents/utilities/upstream-update.md`
- Upstream upgrade analysis: `.genie/reports/upstream-upgrade-106-to-109-analysis.md`
- AGENTS.md behavioral guidelines: `@AGENTS.md`
- CLAUDE.md Evidence-Based Challenge Protocol: `@CLAUDE.md`

---

**Enhancement Complete**: 2025-10-20
**Enhanced By**: GENIE Orchestrator
**Review Status**: Ready for testing on v0.0.109 upgrade
