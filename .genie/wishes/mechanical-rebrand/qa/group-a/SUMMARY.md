# Task A - Surgical Override Removal SUMMARY

## Updated Strategy (2025-10-08)

**Decision:** Logo, fonts, and TypeScript shims move to upstream. Only Omni + extended themes remain.

## Final Numbers

- **Starting:** 25 files
- **DELETE:** 13 files (52%)
- **KEEP:** 10 files (40%)
- **MOVE TO UPSTREAM:** 4 items (8%)

## What Stays in forge-overrides (10 files)

### Omni Integration (8 files)
1. `components/omni/OmniCard.tsx` - Settings UI
2. `components/omni/OmniModal.tsx` - Configuration dialog
3. `components/omni/api.ts` - API client
4. `components/omni/types.ts` - TypeScript types
5. `lib/forge-api.ts` - Backend endpoints
6. `pages/settings/GeneralSettings.tsx` - Renders Omni UI
7. `pages/settings/index.ts` - Exports
8. `main.tsx` - Registers Omni modal

### Extended Themes (1 file)
9. `styles/index.css` - Dracula & Alucard themes (720 lines beyond upstream)

### Placeholder (1 file)
10. `.gitkeep`

## What Gets Deleted (13 files)

**Dialogs (7 files):**
- OnboardingDialog.tsx
- DisclaimerDialog.tsx  
- ReleaseNotesDialog.tsx
- PrivacyOptInDialog.tsx
- CreatePRDialog.tsx
- GitHubLoginDialog.tsx
- index.ts

**Other (6 files):**
- layout/navbar.tsx
- tasks/TaskDetails/preview/NoServerContent.tsx
- tasks/TaskDetails/PreviewTab.tsx
- i18n/locales/en/settings.json
- i18n/locales/es/settings.json
- i18n/locales/ja/settings.json

## What Moves to Upstream (4 items)

1. **logo.tsx** → `upstream/frontend/src/components/logo.tsx`
   - Theme-aware dark/light switching logic
   
2. **Font variables** → `upstream/frontend/src/styles/index.css`
   - `--font-primary: 'Alegreya Sans'`
   - `--font-secondary: 'Manrope'`
   
3. **shims.d.ts** → `upstream/frontend/src/types/shims.d.ts`
   - fancy-ansi and @dnd-kit/utilities type declarations
   
4. **companion-install-task.ts** → Update in upstream
   - Only branding text changes

## Evidence Files Created

✅ `.genie/wishes/mechanical-rebrand/qa/group-a/`
- `analysis.md` - Full categorization with rationale
- `files-to-delete.txt` - 13 branding files
- `files-to-keep.txt` - 10 feature files
- `files-to-move-upstream.txt` - 4 items with instructions
- `cleanup.sh` - Executable removal script
- `before-after-metrics.txt` - Baseline metrics
- `SUMMARY.md` - This file

## Next Steps

1. **Human Review & Approval**
   - Review categorization
   - Approve cleanup execution

2. **Execute Cleanup**
   ```bash
   .genie/wishes/mechanical-rebrand/qa/group-a/cleanup.sh
   ```

3. **Upstream Migration** (separate task/PR)
   - Copy logo.tsx to upstream
   - Add font variables to upstream CSS
   - Copy shims.d.ts to upstream
   - Update companion-install-task.ts in upstream

4. **Verify Build**
   ```bash
   cargo check -p forge-app
   pnpm run check
   ```

5. **Test Omni Feature**
   - Start dev environment
   - Configure Omni integration
   - Verify notifications work

## Success Metrics

✅ 52% reduction (exceeds 50% target)
✅ All real features preserved
✅ Clean separation: features vs branding
✅ Upstream migration path documented
⏳ Build verification pending
⏳ Omni feature testing pending
