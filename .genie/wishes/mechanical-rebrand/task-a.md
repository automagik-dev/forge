# Task A - Surgical Override Removal

**Wish:** @.genie/wishes/mechanical-rebrand-wish.md
**Group:** A - Surgical Override Removal
**Tracker:** placeholder-group-a
**Persona:** implementor
**Branch:** feat/mechanical-rebrand
**Status:** pending

## Scope
Identify and DELETE all forge-overrides that are NOT real features. Keep ONLY:
- Omni feature files
- Config feature files
- Other actual functionality

Remove ALL files that only exist for branding/UI tweaks.

## Discovery
Analyze each file in forge-overrides to determine:
1. Is this ONLY branding? → DELETE
2. Is this a real feature (omni/config/etc)? → KEEP
3. Create exact lists for surgical removal

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
   TO DELETE (branding only):
   - forge-overrides/frontend/src/components/logo.tsx
   - forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
   - [etc - all branding-only files]

   TO KEEP (real features):
   - forge-overrides/frontend/src/components/omni/*
   - forge-overrides/frontend/src/components/config/*
   - [etc - all feature files]
   ```

3. **Create cleanup script:**
   ```bash
   #!/bin/bash
   # cleanup-overrides.sh

   # DELETE branding-only files
   rm -f forge-overrides/frontend/src/components/logo.tsx
   rm -f forge-overrides/frontend/src/main.tsx  # if only branding
   # ... all other branding files

   # Remove empty directories
   find forge-overrides -type d -empty -delete

   echo "Cleanup complete. Remaining files:"
   find forge-overrides -type f | wc -l
   ```

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
- `analysis.md` - File-by-file analysis with DELETE/KEEP decision
- `files-to-delete.txt` - Exact list of files to remove
- `files-to-keep.txt` - Exact list of files to preserve
- `cleanup.sh` - Executable script to perform removal
- `before-after-metrics.txt` - File counts and sizes

## Success Criteria
- ✅ Every forge-override file categorized
- ✅ Cleanup script removes ONLY branding files
- ✅ Omni and config features preserved
- ✅ 50%+ reduction in forge-overrides
- ✅ Application still builds and runs