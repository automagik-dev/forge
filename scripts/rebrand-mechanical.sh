#!/bin/bash
# Mechanical Rebranding Script for Automagik Forge
# Run this after each upstream merge to replace all vibe-kanban branding

set -e

echo "🔧 Automagik Forge Mechanical Rebranding Script"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verify we're in the correct directory
if [ ! -d "upstream" ] || [ ! -d "forge-extensions" ]; then
    echo -e "${RED}Error: Must run from automagik-forge root directory${NC}"
    exit 1
fi

# Create backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
echo "📦 Creating backup: rebrand-backup-${BACKUP_DATE}.tar.gz"
tar -czf "rebrand-backup-${BACKUP_DATE}.tar.gz" \
    upstream/ \
    frontend/ \
    forge-overrides/ \
    2>/dev/null || true

echo ""
echo "🔍 Starting replacements..."
echo ""

# Function to perform replacements in a file
replace_in_file() {
    local file="$1"
    local modified=false

    # Skip binary files and git directories
    if [[ "$file" == *".git"* ]] || file "$file" 2>/dev/null | grep -q "binary"; then
        return
    fi

    # Create temp file
    local tmpfile=$(mktemp)
    cp "$file" "$tmpfile"

    # All replacement patterns
    # Case-sensitive replacements
    sed -i \
        -e 's/Vibe Kanban/Automagik Forge/g' \
        -e 's/vibe-kanban/automagik-forge/g' \
        -e 's/vibe_kanban/automagik_forge/g' \
        -e 's/vibeKanban/automagikForge/g' \
        -e 's/VibeKanban/AutomagikForge/g' \
        -e 's/VIBE_KANBAN/AUTOMAGIK_FORGE/g' \
        -e 's/vibe kanban/automagik forge/g' \
        -e 's/Vibe kanban/Automagik forge/g' \
        -e 's/VK_/AF_/g' \
        -e 's/vk_/af_/g' \
        -e 's/\.vk\./\.af\./g' \
        -e 's/"vk"/"af"/g' \
        -e "s/'vk'/'af'/g" \
        "$tmpfile"

    # Check if file was modified
    if ! cmp -s "$file" "$tmpfile"; then
        mv "$tmpfile" "$file"
        echo -e "${GREEN}✓${NC} Modified: $file"
        modified=true
    else
        rm "$tmpfile"
    fi
}

# Counter for progress
total_files=0
processed_files=0

# Count total files first
echo "Counting files..."
total_files=$(find upstream frontend forge-overrides \
    -type f \
    \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.toml" -o -name "*.md" -o -name "*.html" \
       -o -name "*.css" -o -name "*.scss" -o -name "*.yml" -o -name "*.yaml" \) \
    2>/dev/null | wc -l)

echo "Processing $total_files files..."
echo ""

# Process all relevant files
find upstream frontend forge-overrides \
    -type f \
    \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.toml" -o -name "*.md" -o -name "*.html" \
       -o -name "*.css" -o -name "*.scss" -o -name "*.yml" -o -name "*.yaml" \) \
    2>/dev/null | while read -r file; do

    replace_in_file "$file"
    processed_files=$((processed_files + 1))

    # Show progress every 50 files
    if [ $((processed_files % 50)) -eq 0 ]; then
        echo -e "${YELLOW}Progress: $processed_files / $total_files${NC}"
    fi
done

echo ""
echo "🎯 Special cases..."
echo ""

# Handle special files that might have different patterns

# 1. Package names in Cargo.toml files
echo "Updating Rust package metadata..."
find . -name "Cargo.toml" -type f | while read -r file; do
    sed -i \
        -e 's/name = "vibe-kanban"/name = "automagik-forge"/g' \
        -e 's/description = ".*[Vv]ibe.*[Kk]anban/description = "Automagik Forge/g' \
        "$file" 2>/dev/null || true
done

# 2. Package.json files
echo "Updating Node package metadata..."
find . -name "package.json" -type f | while read -r file; do
    sed -i \
        -e 's/"name": "vibe-kanban"/"name": "automagik-forge"/g' \
        -e 's/"name": "@vibe-kanban/"name": "@automagik-forge/g' \
        -e 's/vibe-kanban\./"automagik-forge\./g' \
        "$file" 2>/dev/null || true
done

# 3. Update HTML titles and meta tags
echo "Updating HTML metadata..."
find . -name "*.html" -type f | while read -r file; do
    sed -i \
        -e 's/<title>.*Vibe.*Kanban.*<\/title>/<title>Automagik Forge<\/title>/g' \
        -e 's/content=".*[Vv]ibe.*[Kk]anban/content="Automagik Forge/g' \
        "$file" 2>/dev/null || true
done

# 4. Update the critical assets.rs file
echo "Updating asset directories..."
if [ -f "upstream/crates/utils/src/assets.rs" ]; then
    sed -i 's/ProjectDirs::from("ai", "bloop", "vibe-kanban")/ProjectDirs::from("ai", "bloop", "automagik-forge")/g' \
        "upstream/crates/utils/src/assets.rs"
    echo -e "${GREEN}✓${NC} Updated asset directory path"
fi

# 5. Clean up any remaining VK abbreviations in comments
echo "Cleaning up abbreviations in comments..."
find upstream -name "*.rs" -type f -exec sed -i 's/\/\/.*\bVK\b/\/\/ AF/g' {} \; 2>/dev/null || true
find frontend -name "*.ts" -o -name "*.tsx" -type f -exec sed -i 's/\/\/.*\bVK\b/\/\/ AF/g' {} \; 2>/dev/null || true

echo ""
echo "🧹 Cleanup phase..."
echo ""

# Remove forge-overrides that are no longer needed after rebranding
if [ -d "forge-overrides-backup" ]; then
    echo "Found forge-overrides-backup, skipping removal"
else
    echo "Backing up forge-overrides before potential removal..."
    cp -r forge-overrides forge-overrides-backup
fi

# Identify which forge-overrides files only contain branding changes
echo "Analyzing forge-overrides for redundant files..."
REDUNDANT_FILES=""
for file in $(find forge-overrides -type f -name "*.tsx" -o -name "*.ts" 2>/dev/null); do
    # Check if the file only differs in branding from upstream
    upstream_equiv="upstream/${file#forge-overrides/}"
    if [ -f "$upstream_equiv" ]; then
        # Create temp files for comparison
        tmp1=$(mktemp)
        tmp2=$(mktemp)

        # Normalize both files by reversing the branding
        sed 's/[Aa]utomagik.[Ff]orge/Vibe Kanban/g; s/automagik-forge/vibe-kanban/g' "$file" > "$tmp1"
        cp "$upstream_equiv" "$tmp2"

        if cmp -s "$tmp1" "$tmp2"; then
            echo -e "${YELLOW}  Redundant:${NC} $file (only branding differences)"
            REDUNDANT_FILES="$REDUNDANT_FILES $file"
        fi

        rm "$tmp1" "$tmp2"
    fi
done

echo ""
echo "🔨 Build verification..."
echo ""

# Try to build to verify nothing is broken
echo "Running cargo check..."
if cargo check --workspace 2>&1 | grep -q "error"; then
    echo -e "${RED}⚠ Cargo check found errors${NC}"
else
    echo -e "${GREEN}✓${NC} Cargo check passed"
fi

echo "Running frontend type check..."
if cd frontend && npm run check 2>&1 | grep -q "error"; then
    echo -e "${RED}⚠ Frontend type check found errors${NC}"
else
    echo -e "${GREEN}✓${NC} Frontend type check passed"
fi
cd ..

echo ""
echo "📊 Summary"
echo "=========="
echo ""

# Count occurrences to verify
remaining_vk=$(grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban" upstream frontend 2>/dev/null | grep -v ".git" | wc -l || echo "0")
remaining_vk_abbrev=$(grep -rw "VK\|vk" upstream frontend 2>/dev/null | grep -v ".git" | wc -l || echo "0")

echo "Remaining 'vibe-kanban' references: $remaining_vk"
echo "Remaining 'VK/vk' abbreviations: $remaining_vk_abbrev"

if [ -n "$REDUNDANT_FILES" ]; then
    echo ""
    echo -e "${YELLOW}The following forge-overrides files appear redundant after rebranding:${NC}"
    for file in $REDUNDANT_FILES; do
        echo "  - $file"
    done
    echo ""
    echo "Consider removing these files to simplify maintenance."
fi

echo ""
echo -e "${GREEN}✅ Rebranding complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Run tests: cargo test --workspace && cd frontend && npm test"
echo "3. Run the app to verify: cargo run -p forge-app"
echo "4. Commit changes: git add -A && git commit -m 'chore: mechanical rebrand from vibe-kanban to automagik-forge'"
echo ""
echo "Backup saved as: rebrand-backup-${BACKUP_DATE}.tar.gz"