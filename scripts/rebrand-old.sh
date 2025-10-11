#!/bin/bash
# Mechanical Rebranding Script for Automagik Forge
# Purpose: Replace all vibe-kanban references after pulling upstream

set -e

echo "🔧 Automagik Forge Mechanical Rebranding"
echo "========================================="

# Verify we're in the correct directory
if [ ! -d "upstream" ]; then
    echo "Error: Must run from automagik-forge root directory"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Starting replacements..."
echo ""

# Function to perform all replacements
replace_patterns() {
    local file="$1"

    # Skip binary files and git directories
    if [[ "$file" == *".git"* ]] || file "$file" 2>/dev/null | grep -q "binary"; then
        return
    fi

    # All replacement patterns - handles dynamic locations
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
        "$file" 2>/dev/null || true
}

# Count files for progress
echo "Processing files..."
file_count=0

# Process all text files in upstream and frontend
find upstream frontend forge-overrides \
    -type f \
    \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.toml" -o -name "*.md" -o -name "*.html" \
       -o -name "*.css" -o -name "*.scss" -o -name "*.yml" -o -name "*.yaml" \
       -o -name "*.txt" -o -name "*.sh" -o -name "Dockerfile" -o -name "*.sql" \) \
    2>/dev/null | while read -r file; do

    replace_patterns "$file"
    file_count=$((file_count + 1))

    # Show progress every 100 files
    if [ $((file_count % 100)) -eq 0 ]; then
        echo "  Processed $file_count files..."
    fi
done

# Special case: The critical assets.rs file
if [ -f "upstream/crates/utils/src/assets.rs" ]; then
    echo "📁 Updating asset directory..."
    sed -i 's/ProjectDirs::from("ai", "bloop", "vibe-kanban")/ProjectDirs::from("ai", "bloop", "automagik-forge")/g' \
        "upstream/crates/utils/src/assets.rs"
fi

# Package.json special handling
find . -name "package.json" -type f | while read -r file; do
    sed -i \
        -e 's/"vibe-kanban"/"automagik-forge"/g' \
        -e 's/@vibe-kanban/@automagik-forge/g' \
        "$file" 2>/dev/null || true
done

# Cargo.toml special handling
find . -name "Cargo.toml" -type f | while read -r file; do
    sed -i \
        -e 's/name = "vibe-kanban"/name = "automagik-forge"/g' \
        -e 's/vibe-kanban/automagik-forge/g' \
        "$file" 2>/dev/null || true
done

echo ""
echo "✅ Verification"
echo "=============="

# Count remaining references
remaining=$(grep -r "vibe-kanban\|Vibe Kanban" upstream frontend 2>/dev/null | grep -v ".git" | wc -l || echo "0")
echo "Remaining vibe-kanban references: $remaining"

# Quick build check
echo ""
echo "Running build verification..."
if cargo check -p forge-app 2>/dev/null; then
    echo -e "${GREEN}✓ Cargo check passed${NC}"
else
    echo -e "${YELLOW}⚠ Cargo check failed - review needed${NC}"
fi

echo ""
echo -e "${GREEN}✅ Rebranding complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test application: cargo run -p forge-app"
echo "3. Commit: git add -A && git commit -m 'chore: rebrand after upstream merge'"