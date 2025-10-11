#!/bin/bash
# Automagik Forge BULLETPROOF Rebranding Script
# Purpose: Replace ALL vibe-kanban references in upstream/ after submodule update
# FAILS LOUDLY if any reference survives

set -e

echo "🔧 Automagik Forge BULLETPROOF Rebranding"
echo "=========================================="
echo "Processing ONLY upstream/ folder (read-only submodule)"
echo ""

# Verify location
if [ ! -d "upstream" ]; then
    echo "❌ ERROR: Must run from automagik-forge root"
    exit 1
fi

# Track replacements
REPLACEMENTS=0
FILES_MODIFIED=0

# Function to replace ALL patterns in a single file
replace_all_patterns() {
    local file="$1"

    # Skip binaries and git
    if [[ "$file" == *".git"* ]] || file "$file" 2>/dev/null | grep -q "binary"; then
        return
    fi

    # Count before - sum all occurrences
    local before=0
    before=$(grep -o "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN\|Bloop AI\|BloopAI\|bloop" "$file" 2>/dev/null | wc -l || echo 0)
    before=${before// /}  # Remove any whitespace

    # ALL replacement patterns (vibe-kanban → automagik-forge)
    sed -i \
        -e 's/Vibe Kanban/Automagik Forge/g' \
        -e 's/vibe-kanban/automagik-forge/g' \
        -e 's/vibe_kanban/automagik_forge/g' \
        -e 's/vibeKanban/automagikForge/g' \
        -e 's/VibeKanban/AutomagikForge/g' \
        -e 's/VIBE_KANBAN/AUTOMAGIK_FORGE/g' \
        -e 's/vibe kanban/automagik forge/gi' \
        -e 's/\bVK\b/AF/g' \
        -e 's/\bvk\b/af/g' \
        -e 's/"vk"/"af"/g' \
        -e "s/'vk'/'af'/g" \
        -e 's/vk_/af_/g' \
        -e 's/VK_/AF_/g' \
        "$file" 2>/dev/null || true

    # Bloop AI → Namastex Labs patterns (order matters!)
    sed -i \
        -e 's/Bloop AI/Namastex Labs/g' \
        -e 's/BloopAI/namastexlabs/g' \
        -e 's/maintainers@bloop\.ai/genie@namastex.ai/g' \
        -e 's/bloop\.ai/namastex.ai/g' \
        -e 's/"bloop-dev"/"namastex-dev"/g' \
        -e 's/"bloop-ai"/"namastexlabs"/g' \
        -e 's/bloop\.automagik-forge/namastexlabs.automagik-forge/g' \
        -e 's/extension\/bloop\//extension\/namastexlabs\//g' \
        -e 's/itemName=bloop\./itemName=namastexlabs./g' \
        -e 's/@id:bloop\./@id:namastexlabs./g' \
        -e 's/\/BloopAI\//\/namastexlabs\//g' \
        -e 's/"author": "bloop"/"author": "Namastex Labs"/g' \
        -e 's/"bloop"/"namastex"/g' \
        "$file" 2>/dev/null || true

    # EXCEPTION: Revert web-companion package name (we don't fork this)
    # Keep component name as AutomagikForgeWebCompanion but use aliased import
    sed -i \
        -e 's/automagik-forge-web-companion/vibe-kanban-web-companion/g' \
        -e 's/from '\''automagik-forge-web-companion'\''/from '\''vibe-kanban-web-companion'\''/g' \
        -e 's/from "automagik-forge-web-companion"/from "vibe-kanban-web-companion"/g' \
        -e 's/{ AutomagikForgeWebCompanion } from '\''vibe-kanban/{ VibeKanbanWebCompanion as AutomagikForgeWebCompanion } from '\''vibe-kanban/g' \
        -e 's/{ AutomagikForgeWebCompanion } from "vibe-kanban/{ VibeKanbanWebCompanion as AutomagikForgeWebCompanion } from "vibe-kanban/g' \
        "$file" 2>/dev/null || true

    # Count after
    local after=0
    after=$(grep -o "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN\|Bloop AI\|BloopAI\|bloop" "$file" 2>/dev/null | wc -l || echo 0)
    after=${after// /}  # Remove any whitespace

    if [ "$before" -gt 0 ] && [ "$after" -eq 0 ]; then
        REPLACEMENTS=$((REPLACEMENTS + before))
        FILES_MODIFIED=$((FILES_MODIFIED + 1))
        echo "  ✓ Replaced $before occurrences in $file"
    elif [ "$after" -gt 0 ]; then
        echo "  ⚠️  WARNING: $after occurrences remain in $file"
    fi
}

# Process ONLY upstream/ directory
echo "📝 Processing upstream/ files..."
find upstream \
    -type f \
    \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" \
       -o -name "*.jsx" -o -name "*.json" -o -name "*.toml" \
       -o -name "*.md" -o -name "*.mdx" -o -name "*.html" -o -name "*.css" \
       -o -name "*.scss" -o -name "*.yml" -o -name "*.yaml" \
       -o -name "*.txt" -o -name "*.sh" -o -name "*.ps1" -o -name "Dockerfile" \
       -o -name "*.sql" -o -name "*.webmanifest" \) \
    2>/dev/null | while read -r file; do
    replace_all_patterns "$file"
done

# Critical: assets.rs (folder path)
if [ -f "upstream/crates/utils/src/assets.rs" ]; then
    echo "📁 Updating critical asset directory..."
    sed -i 's/ProjectDirs::from("ai", "bloop", "vibe-kanban")/ProjectDirs::from("ai", "bloop", "automagik-forge")/g' \
        "upstream/crates/utils/src/assets.rs"
fi

echo ""
echo "🔍 VERIFICATION PHASE"
echo "===================="

# Check for ANY remaining references in upstream/ ONLY
REMAINING_VK_COUNT=$(grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN" \
    upstream 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" | \
    wc -l || echo 0)
REMAINING_VK_COUNT=${REMAINING_VK_COUNT// /}

REMAINING_VK_ABBREV=$(grep -rw "VK\|vk" upstream 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" | \
    grep -E "\bVK\b|\bvk\b" | \
    wc -l || echo 0)
REMAINING_VK_ABBREV=${REMAINING_VK_ABBREV// /}

REMAINING_BLOOP_COUNT=$(grep -ri "bloop" upstream 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" | \
    wc -l || echo 0)
REMAINING_BLOOP_COUNT=${REMAINING_BLOOP_COUNT// /}

echo "📊 Replacements made: $REPLACEMENTS"
echo "📊 Files modified: $FILES_MODIFIED"
echo "📊 Remaining 'vibe-kanban' references in upstream/: $REMAINING_VK_COUNT"
echo "📊 Remaining 'VK/vk' abbreviations in upstream/: $REMAINING_VK_ABBREV"
echo "📊 Remaining 'bloop' references in upstream/: $REMAINING_BLOOP_COUNT"

# FAIL if any remain
if [ "$REMAINING_VK_COUNT" -gt 0 ] || [ "$REMAINING_VK_ABBREV" -gt 0 ] || [ "$REMAINING_BLOOP_COUNT" -gt 0 ]; then
    echo ""
    echo "❌ FAILURE: References still exist in upstream/!"
    echo ""
    if [ "$REMAINING_VK_COUNT" -gt 0 ]; then
        echo "Files with vibe-kanban:"
        grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN" \
            upstream 2>/dev/null | \
            grep -v ".git" | \
            grep -v "Binary file" | \
            cut -d: -f1 | sort -u
    fi
    if [ "$REMAINING_VK_ABBREV" -gt 0 ]; then
        echo ""
        echo "Files with VK/vk abbreviations:"
        grep -rw "VK\|vk" upstream 2>/dev/null | \
            grep -v ".git" | \
            grep -v "Binary file" | \
            grep -E "\bVK\b|\bvk\b" | \
            cut -d: -f1 | sort -u
    fi
    if [ "$REMAINING_BLOOP_COUNT" -gt 0 ]; then
        echo ""
        echo "Files with bloop:"
        grep -ri "bloop" upstream 2>/dev/null | \
            grep -v ".git" | \
            grep -v "Binary file" | \
            cut -d: -f1 | sort -u
    fi
    exit 1
fi

# Build check
echo ""
echo "✅ Build verification..."
if cargo check -p forge-app 2>&1 | tee /tmp/rebrand-build.log; then
    echo "  ✓ Cargo check passed"
else
    echo "  ❌ Cargo check FAILED"
    echo "See /tmp/rebrand-build.log for details"
    exit 1
fi

echo ""
echo "🎉 SUCCESS: ALL upstream/ references replaced!"
echo "Total replacements: $REPLACEMENTS across $FILES_MODIFIED files"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff upstream/"
echo "2. Test application: cargo run -p forge-app"
echo "3. Commit: git add upstream/ && git commit -m 'chore: mechanical rebrand after upstream merge'"
