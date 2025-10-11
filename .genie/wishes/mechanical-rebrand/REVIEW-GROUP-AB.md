# Review: Groups A & B Completion Status

## Executive Summary

**Group A Status:** ⚠️ **INCOMPLETE** - Cleanup script created but NOT executed
**Group B Status:** ✅ **COMPLETE** - Script corrected to proper scope

## Group A - Surgical Override Removal

### Expected Outcome
Delete 14-15 branding-only files, keep 10 feature files (Omni + themes)

### Current State
**Files in forge-overrides:** 25 files (should be 10)

**Files that SHOULD be deleted (15):**
1. ✗ forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx
2. ✗ forge-overrides/frontend/src/components/dialogs/global/DisclaimerDialog.tsx
3. ✗ forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
4. ✗ forge-overrides/frontend/src/components/dialogs/global/PrivacyOptInDialog.tsx
5. ✗ forge-overrides/frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx
6. ✗ forge-overrides/frontend/src/components/dialogs/index.ts
7. ✗ forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
8. ✗ forge-overrides/frontend/src/components/layout/navbar.tsx
9. ✗ forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx
10. ✗ forge-overrides/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx
11. ✗ forge-overrides/frontend/src/i18n/locales/en/settings.json
12. ✗ forge-overrides/frontend/src/i18n/locales/es/settings.json
13. ✗ forge-overrides/frontend/src/i18n/locales/ja/settings.json
14. ✗ forge-overrides/frontend/src/types/shims.d.ts
15. ✗ forge-overrides/frontend/src/utils/companion-install-task.ts

**Files that SHOULD remain (10):**
1. ✓ forge-overrides/frontend/src/components/omni/OmniCard.tsx
2. ✓ forge-overrides/frontend/src/components/omni/OmniModal.tsx
3. ✓ forge-overrides/frontend/src/components/omni/api.ts
4. ✓ forge-overrides/frontend/src/components/omni/types.ts
5. ✓ forge-overrides/frontend/src/lib/forge-api.ts
6. ✓ forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx
7. ✓ forge-overrides/frontend/src/pages/settings/index.ts
8. ✓ forge-overrides/frontend/src/main.tsx
9. ✓ forge-overrides/frontend/src/styles/index.css
10. ✓ forge-overrides/frontend/src/components/logo.tsx (or move to upstream)

### What Needs to Happen
```bash
# Execute the cleanup script
.genie/wishes/mechanical-rebrand/qa/group-a/cleanup.sh
```

### Evidence Status
- ✅ Analysis complete (FINAL-SUMMARY.md)
- ✅ Cleanup script created
- ✅ Files categorized (files-to-delete.txt, files-to-keep.txt)
- ✅ Backend analysis complete (16 files kept)
- ✗ Cleanup NOT executed
- ✗ Verification NOT performed

### Success Criteria
| Criterion | Status | Notes |
|-----------|--------|-------|
| Every file categorized | ✅ | 41 files analyzed |
| Cleanup script created | ✅ | cleanup.sh ready |
| Omni/themes preserved | ✅ | 10 files identified |
| 50%+ reduction target | ⏳ | Will be 60% after cleanup |
| **Cleanup executed** | ❌ | **NOT RUN** |
| Build verification | ⏳ | Pending cleanup execution |

---

## Group B - Bulletproof Rebrand Script

### Expected Outcome
Script that rebrands ONLY `upstream/` folder after submodule updates

### Current State
**Script location:** `scripts/rebrand.sh`
**Script scope:** ✅ Processes ONLY `upstream/` (line 68)
**Verification scope:** ✅ Checks ONLY `upstream/` (lines 92-104)

### Correction Applied
Original script (commit 4fdc39ae) incorrectly processed `upstream frontend forge-overrides`.
Corrected to process ONLY `upstream`.

### Why This Matters
- **upstream/** = read-only vibe-kanban submodule → NEEDS rebranding
- **forge-overrides/** = Automagik Forge files → already branded
- **frontend/** = Automagik Forge files → already branded

### Current Limitations
- ⚠️ `upstream/` folder is EMPTY (submodule not initialized)
- ⚠️ Cannot test script without upstream submodule
- ✅ Script logic is correct

### Evidence Status
- ✅ Script corrected (processes ONLY upstream/)
- ✅ Correction documented (CORRECTION.md)
- ✅ Pattern list complete (18+ patterns)
- ✅ Architecture understanding documented
- ✗ Full test blocked (upstream/ empty)

### Success Criteria
| Criterion | Status | Notes |
|-----------|--------|-------|
| Replaces ALL patterns | ✅ | 18+ patterns |
| Fails if references remain | ✅ | Exit 1 logic |
| **Processes ONLY upstream/** | ✅ | **CORRECTED** |
| Zero references after run | ⏳ | Cannot test - upstream empty |
| Build verification | ⏳ | Cannot test - upstream empty |
| Clear reporting | ✅ | Progress tracking implemented |

---

## Overall Completion Status

### What's Complete ✅
1. **Group A Analysis** - All 41 files categorized
2. **Group A Script** - cleanup.sh created and ready
3. **Group B Script** - rebrand.sh corrected to proper scope
4. **Group B Documentation** - Correction and evidence complete

### What's Incomplete ❌
1. **Group A Execution** - cleanup.sh NOT run
2. **Group B Testing** - upstream/ submodule not initialized

### Blocking Issues
1. **Group A:** 15 branding files still exist in forge-overrides
   - **Action:** Run `.genie/wishes/mechanical-rebrand/qa/group-a/cleanup.sh`
   - **Expected result:** 25 files → 10 files (60% reduction)

2. **Group B:** Cannot test without upstream submodule
   - **Action:** Initialize upstream: `git submodule update --init --recursive`
   - **Expected result:** upstream/ contains vibe-kanban code to rebrand

---

## Recommended Actions

### Immediate (Group A)
```bash
# 1. Run cleanup script
.genie/wishes/mechanical-rebrand/qa/group-a/cleanup.sh

# 2. Verify file count
find forge-overrides -type f ! -name ".gitkeep" | wc -l  # Should be 10

# 3. Verify no vibe-kanban references remain
grep -r "vibe-kanban" forge-overrides | wc -l  # Should be 0

# 4. Test build
cargo check -p forge-app
```

### Future (Group B - when upstream exists)
```bash
# 1. Initialize upstream submodule
git submodule update --init --recursive

# 2. Verify upstream has vibe-kanban references
grep -r "vibe-kanban" upstream | wc -l  # Should be > 0

# 3. Run rebrand script
./scripts/rebrand.sh

# 4. Verify zero references
grep -r "vibe-kanban" upstream | wc -l  # Should be 0

# 5. Build verification
cargo check -p forge-app
```

---

## Verification Checklist

### Group A
- [ ] Execute cleanup.sh
- [ ] Verify 10 files remain in forge-overrides
- [ ] Verify Omni files preserved
- [ ] Verify themes preserved (styles/index.css)
- [ ] Verify no vibe-kanban references in forge-overrides
- [ ] Test application builds
- [ ] Capture evidence (before/after metrics)

### Group B
- [x] Script processes ONLY upstream/
- [x] Script has comprehensive patterns
- [x] Script fails if references remain
- [x] Correction documented
- [ ] Initialize upstream submodule (blocked)
- [ ] Test script on real vibe-kanban code (blocked)
- [ ] Verify zero references after run (blocked)
- [ ] Build verification (blocked)

---

## Summary

**Group A:** Ready to execute, but cleanup script NOT run yet. Files still exist.
**Group B:** Script corrected and ready, but cannot test without upstream submodule.

**Next step:** Run Group A cleanup script to complete the surgical removal.
