# Group B Evidence - Bulletproof Rebrand Script (CORRECTED)

## ⚠️ CORRECTION NOTICE

The original script (commit 4fdc39ae) had a **scope error**:
- ❌ Processed `upstream/`, `frontend/`, `forge-overrides/`
- ✅ Should ONLY process `upstream/` (the vibe-kanban submodule)

See **CORRECTION.md** for full details.

## Evidence Files

1. **CORRECTION.md** - ⚠️ Scope issue identified and fixed
2. **pattern-list.md** - Complete list of ALL patterns replaced
3. **README.md** - This file (corrected)
4. **README-old.md** - Original (incorrect) README

## Corrected Script Location

`scripts/rebrand.sh` - Now processes ONLY `upstream/` folder

### Key Fix
```bash
# OLD (WRONG - line 89):
find upstream frontend forge-overrides ...

# NEW (CORRECT - line 68):
find upstream ...  # ONLY upstream/
```

## Current State

- ✅ Script corrected to process ONLY `upstream/`
- ⚠️ `upstream/` folder is EMPTY (submodule not initialized)
- ⚠️ Cannot test script without upstream submodule
- ⚠️ Previous commit modified wrong files (should be deleted by Group A)

## Corrected Workflow

**After upstream submodule update:**
```bash
git submodule update --remote upstream  # Pull vibe-kanban changes
./scripts/rebrand.sh                    # Rebrand ONLY upstream/
git add upstream/                        # Stage changes
git commit -m 'chore: rebrand after upstream merge'
```

## Files Incorrectly Modified (Commit 4fdc39ae)

These should have been DELETED by Group A, not rebranded:
1. forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx
2. forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
3. forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
4. forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx
5. forge-overrides/frontend/src/main.tsx
6. forge-overrides/frontend/src/utils/companion-install-task.ts
7. frontend/README.md
8. frontend/package.json
9. frontend/tsconfig.json

## Testing Requirements

```bash
# 1. Initialize upstream
git submodule update --init --recursive

# 2. Verify upstream has vibe-kanban
grep -r "vibe-kanban" upstream | wc -l  # > 0

# 3. Run script
./scripts/rebrand.sh

# 4. Verify zero references
grep -r "vibe-kanban" upstream | wc -l  # = 0
```

## Success Criteria (CORRECTED)

- ✅ Script replaces ALL pattern variants (18+)
- ✅ Script FAILS if ANY reference remains
- ✅ **Processes ONLY upstream/** ← FIXED
- ⏳ Zero references (pending upstream init)
- ⏳ Build verification (pending upstream init)
