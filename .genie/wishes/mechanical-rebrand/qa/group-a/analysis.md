# Group A - Surgical Override Removal Analysis (UPDATED)

## Analysis Date
2025-10-08 (Updated after upstream submodule initialization)

## Total Files in forge-overrides
25 files total (excluding .gitkeep)

## Executive Summary

**Decision:** Only **Omni integration** and **extended themes (Dracula/Alucard)** remain in forge-overrides.

**Everything else** either:
- Deleted (branding-only, 13 files)
- Moved to upstream (logo, fonts, shims, 4 items)

## Final Categorization

### ✅ KEEP in forge-overrides - Real Features (10 files)

**Omni Integration Feature** (4 files):
- `forge-overrides/frontend/src/components/omni/OmniCard.tsx` - UI settings card
- `forge-overrides/frontend/src/components/omni/OmniModal.tsx` - Configuration modal
- `forge-overrides/frontend/src/components/omni/api.ts` - API client functions
- `forge-overrides/frontend/src/components/omni/types.ts` - TypeScript definitions

**Forge Backend Integration - Omni API** (1 file):
- `forge-overrides/frontend/src/lib/forge-api.ts` - Endpoints for ForgeProjectSettings (Omni config) and Omni instances

**Settings Integration - Omni UI** (3 files):
- `forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx` - Renders OmniCard in settings
- `forge-overrides/frontend/src/pages/settings/index.ts` - Settings page exports
- `forge-overrides/frontend/src/main.tsx` - Registers OmniModal

**Extended Themes** (1 file):
- `forge-overrides/frontend/src/styles/index.css` - Dracula & Alucard themes + custom fonts
  - Lines 8-13: Font variables (`--font-primary`, `--font-secondary`)
  - Lines 270-347: Dracula theme (official spec compliant)
  - Lines 306-346: Alucard theme (light version of Dracula)
  - Lines 430-874: Dracula syntax highlighting and UI fixes
  - Upstream only has `.dark` theme (266 lines vs forge 986 lines)

**Placeholder** (1 file):
- `forge-overrides/.gitkeep` - Git directory placeholder

### ❌ DELETE - Branding Only (13 files)

**Dialog Branding** (7 files):
- `forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx`
- `forge-overrides/frontend/src/components/dialogs/global/DisclaimerDialog.tsx`
- `forge-overrides/frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx`
- `forge-overrides/frontend/src/components/dialogs/global/PrivacyOptInDialog.tsx`
- `forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx`
- `forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx`
- `forge-overrides/frontend/src/components/dialogs/index.ts`

**Layout Branding** (1 file):
- `forge-overrides/frontend/src/components/layout/navbar.tsx`

**Task Preview Branding** (2 files):
- `forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx`
- `forge-overrides/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx`

**i18n Branding** (3 files):
- `forge-overrides/frontend/src/i18n/locales/en/settings.json`
- `forge-overrides/frontend/src/i18n/locales/es/settings.json`
- `forge-overrides/frontend/src/i18n/locales/ja/settings.json`

### 📦 MOVE TO UPSTREAM (4 items)

**Logo Component** (1 file):
- `forge-overrides/frontend/src/components/logo.tsx`
- **Action:** Copy to `upstream/frontend/src/components/logo.tsx`, update during rebrand

**Font Variables** (partial):
- `forge-overrides/frontend/src/styles/index.css` (lines 8-13 only)
- **Action:** Add to `upstream/frontend/src/styles/index.css`

**TypeScript Shims** (1 file):
- `forge-overrides/frontend/src/types/shims.d.ts`
- **Action:** Copy to `upstream/frontend/src/types/shims.d.ts`

**Companion Install Task** (1 file):
- `forge-overrides/frontend/src/utils/companion-install-task.ts`
- **Action:** Update branding in upstream

## File Count Metrics

- **KEEP:** 10 files (40.0%)
- **DELETE:** 13 files (52.0%)
- **MOVE:** 4 items
- **Reduction:** 52.0% ✅

## After Cleanup State

10 files remaining in forge-overrides (Omni + themes only)
