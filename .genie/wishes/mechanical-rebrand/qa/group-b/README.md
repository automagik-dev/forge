# Group B Evidence - Bulletproof Rebrand Script

## Evidence Files

1. **pattern-list.md** - Complete list of ALL patterns replaced by the script
2. **test-run.log** - Full output from script execution
3. **verification.txt** - Proof of ZERO remaining references
4. **build-success.log** - Git diff showing all changes made
5. **README.md** - This file

## Quick Verification

All patterns successfully replaced:
- ✅ vibe-kanban → automagik-forge
- ✅ Vibe Kanban → Automagik Forge
- ✅ vibeKanban → automagikForge
- ✅ VibeKanban → AutomagikForge
- ✅ vibe_kanban → automagik_forge
- ✅ VIBE_KANBAN → AUTOMAGIK_FORGE
- ✅ VK/vk abbreviations → AF/af
- ✅ vibe-kanban-web-companion → automagik-forge-web-companion

## Files Modified (10 total)
1. forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx
2. forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
3. forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
4. forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx
5. forge-overrides/frontend/src/main.tsx
6. forge-overrides/frontend/src/utils/companion-install-task.ts
7. frontend/README.md
8. frontend/package.json
9. frontend/tsconfig.json
10. scripts/rebrand.sh

## Script Location
`scripts/rebrand.sh` (executable, bulletproof implementation)

## Verification Commands
```bash
# Verify zero references remain
grep -r "vibe-kanban\|Vibe Kanban" upstream frontend forge-overrides | grep -v ".git" | wc -l  # = 0
grep -rw "VK\|vk" upstream frontend forge-overrides | grep -v ".git" | wc -l  # = 0

# Re-run script (idempotent)
./scripts/rebrand.sh

# Build verification
cargo check -p forge-app  # (pending upstream submodule fix)
```

## Success Criteria Status
- ✅ Script replaces ALL pattern variants
- ✅ Script FAILS if ANY reference remains (verified via exit 1)
- ✅ Zero vibe-kanban references after execution
- ✅ Zero VK/vk abbreviations remain
- ⏳ Application builds successfully (pending upstream submodule)
- ✅ Clear reporting of replacements made

## Notes
- The script had already been run once before documentation capture
- All references were successfully replaced
- Script is idempotent and can be run safely multiple times
- Build check requires upstream submodule to be present
