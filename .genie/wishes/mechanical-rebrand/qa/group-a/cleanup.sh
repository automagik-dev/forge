#!/bin/bash
set -e

# Group A - Surgical Override Removal
# This script removes branding-only files from forge-overrides

echo "=== Group A: Surgical Override Removal ==="
echo ""

# Count files before deletion
BEFORE_COUNT=$(find forge-overrides -type f ! -name ".gitkeep" | wc -l)
echo "Files before cleanup: $BEFORE_COUNT"
echo ""

echo "Removing branding-only files..."

# Delete dialog branding files
rm -fv forge-overrides/frontend/src/components/dialogs/global/OnboardingDialog.tsx
rm -fv forge-overrides/frontend/src/components/dialogs/global/DisclaimerDialog.tsx
rm -fv forge-overrides/frontend/src/components/dialogs/global/ReleaseNotesDialog.tsx
rm -fv forge-overrides/frontend/src/components/dialogs/global/PrivacyOptInDialog.tsx
rm -fv forge-overrides/frontend/src/components/dialogs/tasks/CreatePRDialog.tsx
rm -fv forge-overrides/frontend/src/components/dialogs/auth/GitHubLoginDialog.tsx
rm -fv forge-overrides/frontend/src/components/dialogs/index.ts

# Delete layout branding
rm -fv forge-overrides/frontend/src/components/layout/navbar.tsx

# Delete task preview branding
rm -fv forge-overrides/frontend/src/components/tasks/TaskDetails/preview/NoServerContent.tsx
rm -fv forge-overrides/frontend/src/components/tasks/TaskDetails/PreviewTab.tsx

# Delete i18n branding
rm -fv forge-overrides/frontend/src/i18n/locales/en/settings.json
rm -fv forge-overrides/frontend/src/i18n/locales/es/settings.json
rm -fv forge-overrides/frontend/src/i18n/locales/ja/settings.json

# Delete unnecessary shims
rm -fv forge-overrides/frontend/src/types/shims.d.ts

# Delete companion task (Group B rebrand handles it)
rm -fv forge-overrides/frontend/src/utils/companion-install-task.ts

echo ""
echo "Removing empty directories..."
find forge-overrides -type d -empty -delete

echo ""
echo "=== Cleanup Complete ==="

# Count files after deletion
AFTER_COUNT=$(find forge-overrides -type f ! -name ".gitkeep" | wc -l)
DELETED=$((BEFORE_COUNT - AFTER_COUNT))
REDUCTION=$(awk "BEGIN {printf \"%.1f\", ($DELETED/$BEFORE_COUNT)*100}")

echo ""
echo "Files after cleanup:  $AFTER_COUNT (should be 10)"
echo "Files deleted:        $DELETED (should be 15)"
echo "Reduction:            $REDUCTION%"
echo ""

# Verify feature files still exist
echo "=== Verifying Feature Files ==="
echo ""

FEATURE_FILES=(
    "forge-overrides/frontend/src/components/omni/OmniCard.tsx"
    "forge-overrides/frontend/src/components/omni/OmniModal.tsx"
    "forge-overrides/frontend/src/components/omni/api.ts"
    "forge-overrides/frontend/src/components/omni/types.ts"
    "forge-overrides/frontend/src/lib/forge-api.ts"
    "forge-overrides/frontend/src/pages/settings/GeneralSettings.tsx"
    "forge-overrides/frontend/src/main.tsx"
    "forge-overrides/frontend/src/styles/index.css"
)

ALL_EXIST=true
for file in "${FEATURE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ MISSING: $file"
        ALL_EXIST=false
    fi
done

echo ""
if [ "$ALL_EXIST" = true ]; then
    echo "✅ All feature files preserved"
else
    echo "❌ Some feature files missing!"
    exit 1
fi

echo ""
echo "Remaining files in forge-overrides:"
find forge-overrides -type f ! -name ".gitkeep" | sort
