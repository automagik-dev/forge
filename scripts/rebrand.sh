#!/bin/bash
# Automagik Forge ENHANCED Rebranding Script v2.0
# Purpose: Replace ALL vibe-kanban references + manage custom assets intelligently
# FAILS LOUDLY if any reference survives
# GENERATES DIFF REPORTS for smart custom code restoration

set -e

echo "🔧 Automagik Forge ENHANCED Rebranding v2.0"
echo "=============================================="
echo "Processing ONLY upstream/ folder (read-only submodule)"
echo ""

# Verify location
if [ ! -d "upstream" ]; then
    echo "ℹ️  Upstream submodule was removed and converted to Cargo git dependencies."
    echo "   This rebranding script is no longer needed."
    echo "   The forge-core dependency is managed via Cargo.toml git dependencies."
    exit 0
fi

# Create timestamped backup/report directory
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=".genie/backups/pre-rebrand-$TIMESTAMP"
REPORT_DIR=".genie/reports/rebrand-$TIMESTAMP"
mkdir -p "$BACKUP_DIR"/{custom-code,custom-config,custom-assets,snapshots}
mkdir -p "$REPORT_DIR"

echo "📦 Backup directory: $BACKUP_DIR"
echo "📊 Report directory: $REPORT_DIR"
echo ""

# ============================================================================
# PHASE 0: PRE-REBRAND INVENTORY & BACKUP
# ============================================================================

echo "📝 PHASE 0: Inventorying Custom Assets..."
echo "=========================================="

# Get current upstream version
cd upstream
CURRENT_VERSION=$(git describe --tags 2>/dev/null || echo "unknown")
cd ..

echo "Current upstream version: $CURRENT_VERSION"

# Inventory custom Rust files (files that don't exist in clean upstream)
echo ""
echo "🔍 Searching for custom code files..."

if [ -f "upstream/crates/server/src/mcp/advanced_tools.rs" ]; then
    echo "  ✓ Found: advanced_tools.rs ($(wc -l < upstream/crates/server/src/mcp/advanced_tools.rs) lines)"
    cp upstream/crates/server/src/mcp/advanced_tools.rs "$BACKUP_DIR/custom-code/"

    # Check integration points
    if grep -q "pub mod advanced_tools" upstream/crates/server/src/mcp/mod.rs 2>/dev/null; then
        echo "    ✓ Integrated in mod.rs"
        grep -n "advanced_tools" upstream/crates/server/src/mcp/mod.rs > "$BACKUP_DIR/snapshots/mod_rs_integration.txt"
    fi

    # Check usage in task_server.rs
    if grep -q "advanced_tools" upstream/crates/server/src/mcp/task_server.rs 2>/dev/null; then
        echo "    ✓ Used in task_server.rs"
        grep -n "advanced_tools" upstream/crates/server/src/mcp/task_server.rs > "$BACKUP_DIR/snapshots/task_server_usage.txt"
    fi

    # Save snapshot of related files BEFORE rebrand
    cp upstream/crates/server/src/mcp/mod.rs "$BACKUP_DIR/snapshots/mod.rs.before" 2>/dev/null || true
    cp upstream/crates/server/src/mcp/task_server.rs "$BACKUP_DIR/snapshots/task_server.rs.before" 2>/dev/null || true
fi

# Backup custom configurations
echo ""
echo "⚙️  Backing up custom configurations..."

if [ -f "upstream/crates/executors/default_mcp.json" ]; then
    cp upstream/crates/executors/default_mcp.json "$BACKUP_DIR/custom-config/"
    echo "  ✓ Backed up: default_mcp.json"

    # Document customizations
    if grep -q '"forge"\|"genie"' upstream/crates/executors/default_mcp.json; then
        echo "    ✓ Contains Forge/Genie MCP servers"
        grep -E '"forge"|"genie"|"BACKEND_PORT"' upstream/crates/executors/default_mcp.json > "$BACKUP_DIR/snapshots/mcp_customizations.txt"
    fi
fi

if [ -f "upstream/crates/executors/default_profiles.json" ]; then
    cp upstream/crates/executors/default_profiles.json "$BACKUP_DIR/custom-config/"
    echo "  ✓ Backed up: default_profiles.json"

    # Check for Namastex profiles (shouldn't exist, but document if found)
    if grep -q "MASTER\|WISH\|FORGE\|REVIEW" upstream/crates/executors/default_profiles.json; then
        echo "    ⚠️  WARNING: Contains Namastex profiles (should be in parent repo!)"
    fi
fi

# Backup custom binary assets
echo ""
echo "🎵 Backing up custom binary assets..."

if [ -f "upstream/assets/sounds/genie-notify-1.wav" ]; then
    cp upstream/assets/sounds/genie-notify-*.wav "$BACKUP_DIR/custom-assets/" 2>/dev/null || true
    SOUND_COUNT=$(ls "$BACKUP_DIR/custom-assets/"genie-notify-*.wav 2>/dev/null | wc -l)
    echo "  ✓ Backed up: $SOUND_COUNT genie notification sound(s)"
fi

# Create inventory report
cat > "$BACKUP_DIR/INVENTORY.md" <<EOF
# Pre-Rebrand Inventory

**Date**: $(date +%Y-%m-%d\ %H:%M:%S)
**Upstream Version**: $CURRENT_VERSION
**Backup Directory**: $BACKUP_DIR

## Custom Files Found

### Custom Code
$([ -f "$BACKUP_DIR/custom-code/advanced_tools.rs" ] && echo "- advanced_tools.rs ($(wc -l < $BACKUP_DIR/custom-code/advanced_tools.rs) lines)" || echo "- None")

### Custom Configurations
$(ls -1 "$BACKUP_DIR/custom-config/" 2>/dev/null | sed 's/^/- /' || echo "- None")

### Custom Binary Assets
$(ls -1 "$BACKUP_DIR/custom-assets/" 2>/dev/null | sed 's/^/- /' || echo "- None")

## Integration Points

$([ -f "$BACKUP_DIR/snapshots/mod_rs_integration.txt" ] && echo "### mod.rs Integration" && cat "$BACKUP_DIR/snapshots/mod_rs_integration.txt" || echo "")

$([ -f "$BACKUP_DIR/snapshots/task_server_usage.txt" ] && echo "### task_server.rs Usage" && cat "$BACKUP_DIR/snapshots/task_server_usage.txt" || echo "")

---
*This inventory will be used to generate restoration guidance after rebrand*
EOF

echo ""
echo "✅ Pre-rebrand inventory complete"
echo "   Backup: $BACKUP_DIR"
echo ""

# ============================================================================
# PHASE 1: MECHANICAL REBRAND
# ============================================================================

echo "🔄 PHASE 1: Mechanical Text Replacement..."
echo "=========================================="

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

    # NEW: Standalone "vibe" → "forge" patterns (BEFORE compound patterns)
    # This fixes Issue #2: Missing standalone vibe replacements
    sed -i \
        -e 's/\bVIBE_/FORGE_/g' \
        -e 's/\bvibe-\([^k]\)/forge-\1/g' \
        -e 's/\bVibe \([^K]\)/Forge \1/g' \
        -e 's/--vibe-/--forge-/g' \
        -e 's/\.vibe-/.forge-/g' \
        "$file" 2>/dev/null || true

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
echo "✅ Mechanical rebrand complete"
echo "   Files modified: $FILES_MODIFIED"
echo "   Total replacements: $REPLACEMENTS"
echo ""

# ============================================================================
# PHASE 2: POST-REBRAND SNAPSHOT & DIFF ANALYSIS
# ============================================================================

echo "📸 PHASE 2: Post-Rebrand Analysis..."
echo "=========================================="

# Save snapshots of related files AFTER rebrand
if [ -f "$BACKUP_DIR/custom-code/advanced_tools.rs" ]; then
    echo "Analyzing changes to advanced_tools.rs integration points..."

    cp upstream/crates/server/src/mcp/mod.rs "$BACKUP_DIR/snapshots/mod.rs.after" 2>/dev/null || true
    cp upstream/crates/server/src/mcp/task_server.rs "$BACKUP_DIR/snapshots/task_server.rs.after" 2>/dev/null || true

    # Generate diff for mod.rs
    if [ -f "$BACKUP_DIR/snapshots/mod.rs.before" ] && [ -f "$BACKUP_DIR/snapshots/mod.rs.after" ]; then
        diff -u "$BACKUP_DIR/snapshots/mod.rs.before" "$BACKUP_DIR/snapshots/mod.rs.after" > "$REPORT_DIR/mod_rs.diff" 2>&1 || true
        echo "  ✓ Generated diff: mod.rs"
    fi

    # Generate diff for task_server.rs
    if [ -f "$BACKUP_DIR/snapshots/task_server.rs.before" ] && [ -f "$BACKUP_DIR/snapshots/task_server.rs.after" ]; then
        diff -u "$BACKUP_DIR/snapshots/task_server.rs.before" "$BACKUP_DIR/snapshots/task_server.rs.after" > "$REPORT_DIR/task_server_rs.diff" 2>&1 || true
        TASK_SERVER_CHANGES=$(wc -l < "$REPORT_DIR/task_server_rs.diff")
        echo "  ✓ Generated diff: task_server.rs ($TASK_SERVER_CHANGES lines changed)"

        # Flag significant changes
        if [ "$TASK_SERVER_CHANGES" -gt 50 ]; then
            echo "    ⚠️  WARNING: Significant changes detected - careful review needed"
        fi
    fi
fi

# Check MCP config changes
if [ -f "$BACKUP_DIR/custom-config/default_mcp.json" ]; then
    diff -u "$BACKUP_DIR/custom-config/default_mcp.json" "upstream/crates/executors/default_mcp.json" > "$REPORT_DIR/default_mcp.diff" 2>&1 || true
    echo "  ✓ Generated diff: default_mcp.json (ours vs rebranded)"
fi

echo ""

# ============================================================================
# PHASE 3: VERIFICATION
# ============================================================================

echo "🔍 PHASE 3: Verification..."
echo "=========================================="

# Check for ANY remaining references in upstream/ ONLY
REMAINING_VK_COUNT=$(grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN" \
    upstream 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" | \
    grep -v "web-companion" | \
    wc -l || echo 0)
REMAINING_VK_COUNT=${REMAINING_VK_COUNT// /}

# NEW: Check for standalone "vibe" (excluding web-companion)
REMAINING_VIBE_COUNT=$(grep -ri "\bvibe\b" upstream 2>/dev/null | \
    grep -v ".git" | \
    grep -v "Binary file" | \
    grep -v "web-companion" | \
    grep -v "vibe-kanban" | \
    wc -l || echo 0)
REMAINING_VIBE_COUNT=${REMAINING_VIBE_COUNT// /}

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

echo "📊 Verification Results:"
echo "   Replacements made: $REPLACEMENTS"
echo "   Files modified: $FILES_MODIFIED"
echo "   Remaining 'vibe-kanban' references: $REMAINING_VK_COUNT"
echo "   Remaining standalone 'vibe' references: $REMAINING_VIBE_COUNT"
echo "   Remaining 'VK/vk' abbreviations: $REMAINING_VK_ABBREV"
echo "   Remaining 'bloop' references: $REMAINING_BLOOP_COUNT"
echo ""

# FAIL if any remain
if [ "$REMAINING_VK_COUNT" -gt 0 ] || [ "$REMAINING_VIBE_COUNT" -gt 0 ] || [ "$REMAINING_VK_ABBREV" -gt 0 ] || [ "$REMAINING_BLOOP_COUNT" -gt 0 ]; then
    echo "❌ FAILURE: References still exist in upstream/!"
    echo ""
    if [ "$REMAINING_VK_COUNT" -gt 0 ]; then
        echo "Files with vibe-kanban:"
        grep -r "vibe-kanban\|Vibe Kanban\|vibeKanban\|VibeKanban\|vibe_kanban\|VIBE_KANBAN" \
            upstream 2>/dev/null | \
            grep -v ".git" | \
            grep -v "Binary file" | \
            grep -v "web-companion" | \
            cut -d: -f1 | sort -u
    fi
    if [ "$REMAINING_VIBE_COUNT" -gt 0 ]; then
        echo ""
        echo "Files with standalone 'vibe':"
        grep -ri "\bvibe\b" upstream 2>/dev/null | \
            grep -v ".git" | \
            grep -v "Binary file" | \
            grep -v "web-companion" | \
            grep -v "vibe-kanban" | \
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

echo "✅ Text rebrand verification passed"
echo ""

# ============================================================================
# PHASE 4: BUILD VERIFICATION
# ============================================================================

echo "🔨 PHASE 4: Build Verification..."
echo "=========================================="

# Fixed: Use correct cargo command for upstream workspace
cd upstream
if cargo check --workspace 2>&1 | tee /tmp/rebrand-build.log; then
    echo "  ✓ Cargo check passed"
    cd ..
else
    echo "  ❌ Cargo check FAILED"
    echo "See /tmp/rebrand-build.log for details"
    cd ..
    exit 1
fi

echo ""

# ============================================================================
# PHASE 5: GENERATE RESTORATION GUIDE
# ============================================================================

echo "📋 PHASE 5: Generating Restoration Guide..."
echo "=========================================="

# Generate comprehensive restoration guide
cat > "$REPORT_DIR/RESTORATION_GUIDE.md" <<'GUIDE_EOF'
# Custom Asset Restoration Guide

**Generated**: %TIMESTAMP%
**Upstream Version**: %VERSION%
**Backup Directory**: %BACKUP_DIR%
**Report Directory**: %REPORT_DIR%

---

## Overview

The rebrand has completed successfully. This guide will help you restore custom assets intelligently.

**DO NOT blindly copy files** - upstream may have changed. Follow this guide carefully.

---

## 1. Advanced MCP Tools (advanced_tools.rs)

### Status
%ADVANCED_TOOLS_STATUS%

### Restoration Strategy

%ADVANCED_TOOLS_STRATEGY%

### Integration Points Changed

#### mod.rs Changes
%MOD_RS_DIFF%

#### task_server.rs Changes
%TASK_SERVER_DIFF%

### Recommended Actions

%ADVANCED_TOOLS_ACTIONS%

---

## 2. MCP Configuration (default_mcp.json)

### Status
%MCP_CONFIG_STATUS%

### Your Custom Configuration
```json
%CUSTOM_MCP_CONFIG%
```

### After Rebrand
```json
%REBRANDED_MCP_CONFIG%
```

### Recommended Actions

%MCP_CONFIG_ACTIONS%

---

## 3. Binary Assets (Notification Sounds)

### Status
%BINARY_ASSETS_STATUS%

### Recommended Actions

%BINARY_ASSETS_ACTIONS%

---

## 4. Verification Checklist

After restoration, verify:

- [ ] `cargo check --workspace` passes
- [ ] `advanced_tools.rs` compiles (if restored)
- [ ] `pub mod advanced_tools;` in `crates/server/src/mcp/mod.rs`
- [ ] MCP server starts: `cargo run -p forge-app -- --mcp`
- [ ] Default MCP config has `forge` and `genie` servers
- [ ] Backend port 8887 configured in MCP config
- [ ] Genie notification sounds present
- [ ] No upstream sounds (cow, rooster) remain

---

## 5. Example Restoration Commands

### Safe Restoration (Recommended)

```bash
# 1. Restore MCP config (usually safe)
cp %BACKUP_DIR%/custom-config/default_mcp.json upstream/crates/executors/

# 2. Restore binary assets (always safe)
cp %BACKUP_DIR%/custom-assets/genie-notify-*.wav upstream/assets/sounds/
rm -f upstream/assets/sounds/cow-mooing.wav upstream/assets/sounds/rooster.wav

# 3. Review advanced_tools.rs restoration
# READ the diffs in %REPORT_DIR%/ first!
# Then decide whether to:
#   a) Copy directly (if no conflicts)
#   b) Manually merge (if upstream changed)
#   c) Re-implement (if major refactor)
```

### If No Conflicts Detected

```bash
# Only if task_server.rs diff shows < 50 lines changed
cp %BACKUP_DIR%/custom-code/advanced_tools.rs upstream/crates/server/src/mcp/

# Ensure mod.rs includes it
if ! grep -q "pub mod advanced_tools" upstream/crates/server/src/mcp/mod.rs; then
    sed -i '/pub mod task_server;/a pub mod advanced_tools;' upstream/crates/server/src/mcp/mod.rs
fi

# Verify compilation
cd upstream && cargo check --workspace && cd ..
```

---

## 6. Next Steps

1. **Review this guide carefully**
2. **Examine the diffs** in `%REPORT_DIR%/`
3. **Restore MCP config and sounds** (always safe)
4. **Carefully restore advanced_tools.rs** based on diff analysis
5. **Verify build** with `cargo check --workspace`
6. **Commit rebrand** + custom asset restoration separately

---

**Generated by**: Enhanced Rebrand Script v2.0
**Backup preserved in**: %BACKUP_DIR%
**Diffs available in**: %REPORT_DIR%
GUIDE_EOF

# Populate the template
GUIDE_FILE="$REPORT_DIR/RESTORATION_GUIDE.md"

# Replace placeholders
sed -i "s|%TIMESTAMP%|$(date +%Y-%m-%d\ %H:%M:%S)|g" "$GUIDE_FILE"
sed -i "s|%VERSION%|$CURRENT_VERSION|g" "$GUIDE_FILE"
sed -i "s|%BACKUP_DIR%|$BACKUP_DIR|g" "$GUIDE_FILE"
sed -i "s|%REPORT_DIR%|$REPORT_DIR|g" "$GUIDE_FILE"

# Advanced tools status
if [ -f "$BACKUP_DIR/custom-code/advanced_tools.rs" ]; then
    LINES=$(wc -l < "$BACKUP_DIR/custom-code/advanced_tools.rs")
    sed -i "s|%ADVANCED_TOOLS_STATUS%|✅ **FOUND** - Backed up ($LINES lines, 49 MCP tools)|g" "$GUIDE_FILE"

    # Determine strategy based on changes
    if [ -f "$REPORT_DIR/task_server_rs.diff" ]; then
        CHANGES=$(wc -l < "$REPORT_DIR/task_server_rs.diff")
        if [ "$CHANGES" -lt 50 ]; then
            STRATEGY="✅ **SAFE TO RESTORE** - Minimal changes in task_server.rs ($CHANGES lines)\n\nDirect copy should work. Verify after restoration."
            ACTIONS="1. Copy advanced_tools.rs to upstream/crates/server/src/mcp/\n2. Ensure mod.rs includes it\n3. Run cargo check --workspace"
        else
            STRATEGY="⚠️ **MANUAL REVIEW NEEDED** - Significant changes in task_server.rs ($CHANGES lines)\n\nCarefully review diffs before restoring. May need manual merge."
            ACTIONS="1. READ task_server_rs.diff in $REPORT_DIR/\n2. Understand what changed\n3. Manually merge if needed\n4. Test thoroughly"
        fi
    else
        STRATEGY="✅ **SAFE TO RESTORE** - No changes detected in integration points"
        ACTIONS="1. Copy advanced_tools.rs to upstream/crates/server/src/mcp/\n2. Ensure mod.rs includes it\n3. Run cargo check --workspace"
    fi

    sed -i "s|%ADVANCED_TOOLS_STRATEGY%|$STRATEGY|g" "$GUIDE_FILE"
    sed -i "s|%ADVANCED_TOOLS_ACTIONS%|$ACTIONS|g" "$GUIDE_FILE"
else
    sed -i "s|%ADVANCED_TOOLS_STATUS%|⚠️ **NOT FOUND** - No custom advanced_tools.rs detected|g" "$GUIDE_FILE"
    sed -i "s|%ADVANCED_TOOLS_STRATEGY%|N/A - No custom code to restore|g" "$GUIDE_FILE"
    sed -i "s|%ADVANCED_TOOLS_ACTIONS%|None - No advanced_tools.rs found|g" "$GUIDE_FILE"
fi

# Mod.rs diff
if [ -f "$REPORT_DIR/mod_rs.diff" ]; then
    sed -i "s|%MOD_RS_DIFF%|\`\`\`diff\n$(cat "$REPORT_DIR/mod_rs.diff" | head -30)\n\`\`\`|g" "$GUIDE_FILE"
else
    sed -i "s|%MOD_RS_DIFF%|No changes detected|g" "$GUIDE_FILE"
fi

# Task_server.rs diff
if [ -f "$REPORT_DIR/task_server_rs.diff" ]; then
    sed -i "s|%TASK_SERVER_DIFF%|\`\`\`diff\n$(cat "$REPORT_DIR/task_server_rs.diff" | head -50)\n\`\`\`\n\nSee full diff: $REPORT_DIR/task_server_rs.diff|g" "$GUIDE_FILE"
else
    sed -i "s|%TASK_SERVER_DIFF%|No changes detected|g" "$GUIDE_FILE"
fi

# MCP config
if [ -f "$BACKUP_DIR/custom-config/default_mcp.json" ]; then
    sed -i "s|%MCP_CONFIG_STATUS%|✅ **FOUND** - Custom configuration backed up|g" "$GUIDE_FILE"

    # Escape JSON for sed
    CUSTOM_JSON=$(cat "$BACKUP_DIR/custom-config/default_mcp.json" | sed 's/\\/\\\\/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    REBRANDED_JSON=$(cat "upstream/crates/executors/default_mcp.json" | sed 's/\\/\\\\/g' | sed ':a;N;$!ba;s/\n/\\n/g')

    # Note: This might not work perfectly with sed, manual editing may be needed
    sed -i "s|%CUSTOM_MCP_CONFIG%|$(cat "$BACKUP_DIR/custom-config/default_mcp.json")|g" "$GUIDE_FILE"
    sed -i "s|%REBRANDED_MCP_CONFIG%|$(cat "upstream/crates/executors/default_mcp.json")|g" "$GUIDE_FILE"

    sed -i "s|%MCP_CONFIG_ACTIONS%|1. Copy your custom config over the rebranded one\n2. Verify forge/genie servers present\n3. Ensure BACKEND_PORT: 8887|g" "$GUIDE_FILE"
else
    sed -i "s|%MCP_CONFIG_STATUS%|⚠️ **NOT FOUND** - No custom MCP config|g" "$GUIDE_FILE"
    sed -i "s|%CUSTOM_MCP_CONFIG%|N/A|g" "$GUIDE_FILE"
    sed -i "s|%REBRANDED_MCP_CONFIG%|$(cat "upstream/crates/executors/default_mcp.json")|g" "$GUIDE_FILE"
    sed -i "s|%MCP_CONFIG_ACTIONS%|None needed - using rebranded upstream config|g" "$GUIDE_FILE"
fi

# Binary assets
if [ -f "$BACKUP_DIR/custom-assets/genie-notify-1.wav" ]; then
    SOUND_COUNT=$(ls "$BACKUP_DIR/custom-assets/"genie-notify-*.wav 2>/dev/null | wc -l)
    sed -i "s|%BINARY_ASSETS_STATUS%|✅ **FOUND** - $SOUND_COUNT custom notification sound(s)|g" "$GUIDE_FILE"
    sed -i "s|%BINARY_ASSETS_ACTIONS%|1. Copy genie-notify-*.wav to upstream/assets/sounds/\n2. Remove cow-mooing.wav and rooster.wav\n3. Verify sounds play correctly|g" "$GUIDE_FILE"
else
    sed -i "s|%BINARY_ASSETS_STATUS%|⚠️ **NOT FOUND** - No custom sounds|g" "$GUIDE_FILE"
    sed -i "s|%BINARY_ASSETS_ACTIONS%|None needed - using upstream sounds|g" "$GUIDE_FILE"
fi

echo "  ✓ Generated: RESTORATION_GUIDE.md"
echo ""

# ============================================================================
# PHASE 6: CLEANUP - Remove upstream docs (we don't support direct usage)
# ============================================================================

echo "🗑️  PHASE 6: Cleanup..."
echo "=========================================="

# Remove docs and README since we don't support using upstream directly
rm -rf upstream/docs
rm -f upstream/README.md

echo "  ✓ Removed upstream/docs/ (use parent repo docs instead)"
echo "  ✓ Removed upstream/README.md (use parent repo README instead)"
echo ""

# ============================================================================
# FINAL REPORT
# ============================================================================

echo ""
echo "🎉 SUCCESS: Rebrand Complete!"
echo "=========================================="
echo ""
echo "📊 Summary:"
echo "   Total replacements: $REPLACEMENTS across $FILES_MODIFIED files"
echo "   Build verification: ✅ PASSED"
echo "   Text rebrand: ✅ COMPLETE"
echo ""
echo "📦 Artifacts:"
echo "   Backup: $BACKUP_DIR"
echo "   Reports: $REPORT_DIR"
echo ""
echo "📋 Next Steps:"
echo "   1. Review restoration guide: $REPORT_DIR/RESTORATION_GUIDE.md"
echo "   2. Examine diffs: $REPORT_DIR/*.diff"
echo "   3. Restore custom assets following the guide"
echo "   4. Verify build: cd upstream && cargo check --workspace"
echo "   5. Commit rebrand + custom assets separately"
echo ""
echo "⚠️  IMPORTANT: DO NOT blindly restore files!"
echo "   Read the restoration guide and diffs first."
echo ""
