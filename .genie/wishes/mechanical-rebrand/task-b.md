# Task B - Bulletproof Rebrand Script

**Wish:** @.genie/wishes/mechanical-rebrand-wish.md
**Group:** B - Bulletproof Rebrand Script
**Tracker:** placeholder-group-b
**Persona:** implementor
**Branch:** feat/mechanical-rebrand
**Status:** pending

## Scope
Create a rebrand script that:
1. Replaces EVERY SINGLE vibe-kanban occurrence
2. Verifies ZERO references remain
3. FAILS LOUDLY if any reference survives

## Discovery
Current patterns to replace:
- `vibe-kanban` → `automagik-forge`
- `Vibe Kanban` → `Automagik Forge`
- `vibeKanban` → `automagikForge`
- `VibeKanban` → `AutomagikForge`
- `vibe_kanban` → `automagik_forge`
- `VIBE_KANBAN` → `AUTOMAGIK_FORGE`
- `VK` → `AF` (abbreviations)
- `vk` → `af` (lowercase abbreviations)
- Any other variants found

## Implementation

### Enhanced rebrand.sh
```bash
#!/bin/bash
set -e

echo "🔧 Automagik Forge BULLETPROOF Rebranding"
echo "=========================================="

# Verify location
if [ ! -d "upstream" ]; then
    echo "ERROR: Must run from automagik-forge root"
    exit 1
fi

# Track replacements
REPLACEMENTS=0

# Function to replace ALL patterns
replace_all_patterns() {
    local file="$1"

    # Skip binaries and git
    if [[ "$file" == *".git"* ]] || file "$file" 2>/dev/null | grep -q "binary"; then
        return
    fi

    # Count before
    local before=$(grep -c "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN\|\bVK\b\|\bvk\b" "$file" 2>/dev/null || echo 0)

    # ALL replacement patterns
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

    # Count after
    local after=$(grep -c "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN\|\bVK\b\|\bvk\b" "$file" 2>/dev/null || echo 0)

    if [ "$before" -gt 0 ] && [ "$after" -eq 0 ]; then
        REPLACEMENTS=$((REPLACEMENTS + before))
        echo "  ✓ Replaced $before occurrences in $file"
    elif [ "$after" -gt 0 ]; then
        echo "  ⚠️  WARNING: $after occurrences remain in $file"
    fi
}

# Process all files
echo "Processing files..."
find upstream frontend forge-overrides \
    -type f \
    \( -name "*.rs" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" \
       -o -name "*.jsx" -o -name "*.json" -o -name "*.toml" \
       -o -name "*.md" -o -name "*.html" -o -name "*.css" \
       -o -name "*.yml" -o -name "*.yaml" -o -name "*.txt" \
       -o -name "*.sh" -o -name "Dockerfile" \) \
    2>/dev/null | while read -r file; do
    replace_all_patterns "$file"
done

# Critical: assets.rs
if [ -f "upstream/crates/utils/src/assets.rs" ]; then
    echo "📁 Updating critical asset directory..."
    sed -i 's/ProjectDirs::from("ai", "bloop", "vibe-kanban")/ProjectDirs::from("ai", "bloop", "automagik-forge")/g' \
        "upstream/crates/utils/src/assets.rs"
fi

echo ""
echo "🔍 VERIFICATION PHASE"
echo "===================="

# Check for ANY remaining references
REMAINING=$(grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN" \
    upstream frontend forge-overrides 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" || true)

REMAINING_VK=$(grep -rw "VK\|vk" upstream frontend forge-overrides 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" | \
    grep -E "\bVK\b|\bvk\b" || true)

# Count remaining
REMAINING_COUNT=$(echo "$REMAINING" | grep -c "^" || echo 0)
REMAINING_VK_COUNT=$(echo "$REMAINING_VK" | grep -c "^" || echo 0)

echo "Replacements made: $REPLACEMENTS"
echo "Remaining 'vibe-kanban' references: $REMAINING_COUNT"
echo "Remaining 'VK/vk' references: $REMAINING_VK_COUNT"

# FAIL if any remain
if [ "$REMAINING_COUNT" -gt 0 ] || [ "$REMAINING_VK_COUNT" -gt 0 ]; then
    echo ""
    echo "❌ FAILURE: References still exist!"
    echo ""
    if [ "$REMAINING_COUNT" -gt 0 ]; then
        echo "Files with vibe-kanban:"
        echo "$REMAINING" | cut -d: -f1 | sort -u
    fi
    if [ "$REMAINING_VK_COUNT" -gt 0 ]; then
        echo "Files with VK/vk:"
        echo "$REMAINING_VK" | cut -d: -f1 | sort -u
    fi
    exit 1
fi

# Build check
echo ""
echo "✅ Build verification..."
if cargo check -p forge-app 2>/dev/null; then
    echo "  ✓ Cargo check passed"
else
    echo "  ❌ Cargo check FAILED"
    exit 1
fi

echo ""
echo "🎉 SUCCESS: ALL references replaced!"
echo "Total replacements: $REPLACEMENTS"
```

## Verification
```bash
# Run the bulletproof script
./scripts/rebrand.sh

# Must show ZERO remaining
grep -r "vibe-kanban" upstream frontend | wc -l  # MUST be 0
grep -r "Vibe Kanban" upstream frontend | wc -l  # MUST be 0
grep -rw "VK" upstream frontend | wc -l  # MUST be 0

# Application must build
cargo build -p forge-app
cd frontend && npm run build
```

## Evidence Requirements
Store in `.genie/wishes/mechanical-rebrand/qa/group-b/`:
- `pattern-list.md` - Complete list of ALL patterns replaced
- `test-run.log` - Full output from script execution
- `verification.txt` - Proof of ZERO remaining references
- `build-success.log` - Proof that build works after rebrand

## Success Criteria
- ✅ Script replaces ALL pattern variants
- ✅ Script FAILS if ANY reference remains
- ✅ Zero vibe-kanban references after execution
- ✅ Zero VK/vk abbreviations remain
- ✅ Application builds successfully
- ✅ Clear reporting of replacements made