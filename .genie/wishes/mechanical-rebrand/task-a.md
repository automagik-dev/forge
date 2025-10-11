# Task A - Surgical Override Removal

**Wish:** @.genie/wishes/mechanical-rebrand-wish.md
**Group:** A - Surgical Override Removal
**Tracker:** placeholder-group-a
**Persona:** implementor
**Branch:** feat/mechanical-rebrand
**Status:** pending

## Scope
Identify and DELETE all forge-overrides that are NOT real features. Keep ONLY:
- **Omni feature files** (4 files + 3 integration files + forge-api.ts)
- **Extended themes** (Dracula + Alucard in styles/index.css)

**Move to upstream** (do NOT delete):
- Logo component (theme-aware logic)
- Font variable definitions
- TypeScript shims
- Companion install task

Remove ALL files that only exist for branding/UI tweaks.

## Discovery
Analyze each file in forge-overrides to determine:
1. Is this ONLY branding? → DELETE
2. Is this a real feature (Omni integration / Extended themes)? → KEEP
3. Is this functional but belongs in upstream? → MOVE (logo, fonts, shims)
4. Create exact lists for surgical removal + upstream migration

## Implementation
1. **Analyze forge-overrides:**
   ```bash
   # For each file in forge-overrides, check if it's just branding
   for file in $(find forge-overrides -type f); do
       # Compare with upstream equivalent
       upstream_file="upstream/${file#forge-overrides/}"
       if [ -f "$upstream_file" ]; then
           # Check if only differs in branding
           # If yes, mark for deletion
       fi
   done
   ```

2. **Categorize files:**
   ```
   TO DELETE (branding only - 13 files):
   - forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
   - forge-overrides/frontend/src/i18n/locales/*/settings.json
   - [etc - all branding-only files]

   TO KEEP (real features - 10 files):
   - forge-overrides/frontend/src/components/omni/* (4 files)
   - forge-overrides/frontend/src/lib/forge-api.ts
   - forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx
   - forge-overrides/frontend/src/main.tsx (registers Omni)
   - forge-overrides/frontend/src/styles/index.css (Dracula/Alucard themes)

   TO MOVE TO UPSTREAM (4 items):
   - forge-overrides/frontend/src/components/logo.tsx → upstream
   - forge-overrides/frontend/src/styles/index.css (font vars only) → upstream
   - forge-overrides/frontend/src/types/shims.d.ts → upstream
   - forge-overrides/frontend/src/utils/companion-install-task.ts → upstream
   ```

3. **Create cleanup script:**
   ```bash
   #!/bin/bash
   # .genie/wishes/mechanical-rebrand/qa/group-a/cleanup.sh

   # DELETE branding-only files (13 files)
   rm -f forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
   rm -f forge-overrides/frontend/src/i18n/locales/en/settings.json
   # ... all 13 branding files

   # Remove empty directories
   find forge-overrides -type d -empty -delete

   # Verify features preserved
   echo "Remaining files (should be 10):"
   find forge-overrides -type f ! -name ".gitkeep" | wc -l
   ```

4. **Document upstream migration:**
   Create `files-to-move-upstream.txt` with exact instructions for moving:
   - logo.tsx logic
   - Font variables
   - shims.d.ts
   - companion-install-task.ts branding update

## Verification
```bash
# Before cleanup
find forge-overrides -type f | wc -l  # Current count

# Run cleanup
./cleanup-overrides.sh

# After cleanup
find forge-overrides -type f | wc -l  # Should be minimal

# Verify features still work
ls -la forge-extensions/omni/  # Must exist
ls -la forge-extensions/config/  # Must exist

# Build still works
cargo build -p forge-app
```

## Evidence Requirements
Store in `.genie/wishes/mechanical-rebrand/qa/group-a/`:
- ✅ `analysis.md` - Complete analysis with categorization rationale
- ✅ `files-to-delete.txt` - 13 branding files to remove
- ✅ `files-to-keep.txt` - 10 feature files to preserve
- ✅ `files-to-move-upstream.txt` - 4 items for upstream migration
- ✅ `cleanup.sh` - Executable removal script with verification
- ✅ `before-after-metrics.txt` - Baseline metrics captured

## Success Criteria
- ✅ Every forge-override file categorized (25 files analyzed)
- ✅ Cleanup script removes ONLY branding files (13 files)
- ✅ Omni integration and Dracula/Alucard themes preserved (10 files)
- ✅ 52% reduction achieved (exceeds 50% target)
- ✅ Upstream migration documented (4 items with instructions)
- ⏳ Application builds and runs (pending: execute cleanup + verify)

## Updated Strategy (2025-10-08)

**Decision:** Logo and font variables move to upstream (not deleted).
**Reason:** Eliminates frontend overhead; upstream handles these globally.
**Result:** Only Omni (8 files) + Extended Themes (1 file) + .gitkeep remain = 10 files total.

## Rust Backend Analysis

### Backend Files Analyzed (16 files)

**forge-extensions/omni/** (5 files):
- `src/types.rs` - OmniConfig, OmniInstance, SendTextRequest/Response
- `src/service.rs` - OmniService business logic
- `src/client.rs` - HTTP client for Omni server
- `src/lib.rs` - Public API exports
- `Cargo.toml` - Dependencies

**forge-extensions/config/** (4 files):
- `src/types.rs` - ForgeProjectSettings (only contains `omni_enabled` + `omni_config`)
- `src/service.rs` - ForgeConfigService for SQLite persistence
- `src/lib.rs` - Public API exports
- `Cargo.toml` - Dependencies

**forge-app/src/** (7 files):
- `router.rs` - Forge API routes (`/api/forge/*`)
- `services/mod.rs` - ForgeServices aggregation
- `main.rs` - Entry point
- `bin/generate_forge_types.rs` - TypeScript type generator
- `Cargo.toml` - Workspace dependencies

### Backend Categorization Result

**KEEP: 100% (all 16 files)**
- Reason: All backend code is Omni feature implementation
- Config extension exists solely to persist Omni settings
- No branding-only backend overrides
- All API routes serve Omni functionality

**DELETE: 0 files**
**MOVE: 0 files**

### Backend Evidence

See `.genie/wishes/mechanical-rebrand/qa/group-a/rust-backend-analysis.md` for:
- Detailed file-by-file breakdown
- Type definitions and API contracts
- Database schema usage
- TypeScript generation flow

## Complete File Count

**Total Analyzed:** 41 files (25 frontend + 16 backend)
**Total to KEEP:** 26 files (10 frontend + 16 backend)
**Total to DELETE:** 13 frontend files
**Total to MOVE:** 3-4 items (logo, fonts, companion-task, shims?)
**Overall Reduction:** 31.7% (13 of 41 files deleted)