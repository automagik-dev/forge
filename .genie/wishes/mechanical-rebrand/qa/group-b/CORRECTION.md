# Group B Correction - Script Scope Issue

## Issue Identified
Original script (committed in 4fdc39ae) processed ALL folders:
- `upstream/` ✅ (CORRECT - this is the vibe-kanban submodule)
- `frontend/` ❌ (WRONG - should not rebrand)
- `forge-overrides/` ❌ (WRONG - Group A should delete branding files)

## Root Cause
Misunderstood the architecture:
- **upstream/** = read-only vibe-kanban submodule (NEEDS rebranding after `git submodule update`)
- **forge-overrides/** = Automagik Forge custom files (should NOT contain vibe→forge translations)
- **frontend/** = Automagik Forge custom files (should NOT contain vibe→forge translations)

Group A's job was to DELETE branding-only files from forge-overrides/
Group B's job is to rebrand ONLY the upstream/ submodule after pulls

## Files Incorrectly Modified in Commit 4fdc39ae
1. forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx
2. forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
3. forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
4. forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx
5. forge-overrides/frontend/src/main.tsx
6. forge-overrides/frontend/src/utils/companion-install-task.ts
7. frontend/README.md
8. frontend/package.json
9. frontend/tsconfig.json

**These files should have been DELETED by Group A, not rebranded by Group B!**

## Corrected Script
New `scripts/rebrand.sh` now:
- ✅ Processes ONLY `upstream/` folder (line 68)
- ✅ Verifies references in `upstream/` only (lines 92-104)
- ✅ Clear messaging: "Processing ONLY upstream/ folder"

## Current State
- upstream/ folder is EMPTY (submodule not initialized)
- Script is correct but cannot be tested without upstream submodule
- forge-overrides files were modified but shouldn't exist (per Group A's task)

## Next Actions
1. Revert forge-overrides/frontend changes (should be deleted by Group A)
2. Initialize upstream submodule: `git submodule update --init --recursive`
3. Test script on actual upstream vibe-kanban code
4. Coordinate with Group A to complete file deletions

## Corrected Understanding
**Mechanical Rebrand Workflow:**
1. Pull upstream: `git submodule update --remote upstream`
2. Run rebrand script: `./scripts/rebrand.sh` (processes ONLY upstream/)
3. Commit: `git add upstream/ && git commit -m 'chore: rebrand after upstream merge'`

**NOT:**
- ❌ Rebrand forge-overrides (those are OUR files, already branded)
- ❌ Rebrand frontend (that's OUR entrypoint, already branded)
- ❌ Keep branding-only overrides (Group A deletes them)
