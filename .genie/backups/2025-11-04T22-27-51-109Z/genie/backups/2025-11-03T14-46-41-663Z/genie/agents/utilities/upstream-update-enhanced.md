# Upstream Update Agent - ENHANCED v2.0

**Changes from v1.0**:
- Added Phase 0: Pre-Flight Custom Asset Inventory
- Added Phase 3.5: Upstream Diff Review
- Enhanced Phase 4: Mechanical Rebrand with custom asset restoration
- Fixed build verification (cargo check --workspace)
- Added custom asset verification
- Comprehensive documentation of learnings from v0.0.113→v0.0.114 upgrade

---

## NEW: Phase 0 - Pre-Flight Custom Asset Inventory

**Purpose**: Catalog ALL Namastex customizations before touching anything

**When**: FIRST step, before any git operations

**Why**:
- v0.0.113→v0.0.114 upgrade revealed critical custom files not tracked:
  - `crates/server/src/mcp/advanced_tools.rs` (466 lines, 49 MCP tools)
  - `crates/executors/default_mcp.json` (Forge/Genie MCP servers)
  - `assets/sounds/genie-notify-*.wav` (custom notification sounds)
- Rebrand script doesn't handle binary files or custom code
- Need comprehensive backup BEFORE fork sync

### Commands

#### 1. Create Inventory Directory
```bash
BACKUP_DIR=".genie/backups/pre-upgrade-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"/{custom-code,custom-config,custom-assets,docs}
echo "Backup directory: $BACKUP_DIR"
```

#### 2. Inventory Custom Rust Files
```bash
# Find Rust files in upstream that don't exist in clean BloopAI
cd upstream
git fetch upstream --tags
LATEST_UPSTREAM=$(git tag --list 'v0.0.*' --sort=-version:refname | grep -E 'v0\.0\.[0-9]+-[0-9]+$' | head -1)

# Create list of our files vs upstream files
git diff --name-only $LATEST_UPSTREAM..main -- "*.rs" > ../$BACKUP_DIR/docs/custom-rust-files.txt

# Check for known custom files
echo "=== Custom Rust Files Inventory ===" > ../$BACKUP_DIR/docs/custom-files-inventory.md

if [ -f "crates/server/src/mcp/advanced_tools.rs" ]; then
    echo "✓ advanced_tools.rs ($(wc -l < crates/server/src/mcp/advanced_tools.rs) lines)" >> ../$BACKUP_DIR/docs/custom-files-inventory.md
    cp crates/server/src/mcp/advanced_tools.rs ../$BACKUP_DIR/custom-code/

    # Check if mod.rs references it
    grep -n "pub mod advanced_tools" crates/server/src/mcp/mod.rs >> ../$BACKUP_DIR/docs/advanced_tools_integration.txt || echo "NOT referenced in mod.rs" >> ../$BACKUP_DIR/docs/advanced_tools_integration.txt
fi

cd ..
```

#### 3. Backup Custom Configurations
```bash
# Backup MCP config
if [ -f "upstream/crates/executors/default_mcp.json" ]; then
    cp upstream/crates/executors/default_mcp.json $BACKUP_DIR/custom-config/

    # Document customizations
    echo "=== MCP Config Customizations ===" >> $BACKUP_DIR/docs/custom-files-inventory.md
    grep -E '"forge"|"genie"|"BACKEND_PORT"' upstream/crates/executors/default_mcp.json >> $BACKUP_DIR/docs/custom-files-inventory.md
fi

# Backup executor profiles (should be clean, but document)
if [ -f "upstream/crates/executors/default_profiles.json" ]; then
    cp upstream/crates/executors/default_profiles.json $BACKUP_DIR/custom-config/

    # Check for Namastex-specific profiles (should NOT exist)
    if grep -q "MASTER\|WISH\|FORGE\|REVIEW" upstream/crates/executors/default_profiles.json; then
        echo "⚠️  WARNING: Namastex profiles found in default_profiles.json (should be in parent repo)" >> $BACKUP_DIR/docs/custom-files-inventory.md
    fi
fi
```

#### 4. Backup Custom Binary Assets
```bash
# Backup custom sounds
if [ -f "upstream/assets/sounds/genie-notify-1.wav" ]; then
    cp upstream/assets/sounds/genie-notify-*.wav $BACKUP_DIR/custom-assets/ 2>/dev/null || true

    echo "=== Custom Binary Assets ===" >> $BACKUP_DIR/docs/custom-files-inventory.md
    ls -lh upstream/assets/sounds/genie-notify-*.wav >> $BACKUP_DIR/docs/custom-files-inventory.md
fi

# Check for upstream sounds that should be removed
if [ -f "upstream/assets/sounds/cow-mooing.wav" ] || [ -f "upstream/assets/sounds/rooster.wav" ]; then
    echo "⚠️  Upstream default sounds found (will be replaced):" >> $BACKUP_DIR/docs/custom-files-inventory.md
    ls -lh upstream/assets/sounds/{cow-mooing.wav,rooster.wav} 2>/dev/null >> $BACKUP_DIR/docs/custom-files-inventory.md || true
fi
```

#### 5. Document Current State
```bash
# Create comprehensive snapshot
cat > $BACKUP_DIR/docs/SNAPSHOT.md <<EOF
# Pre-Upgrade Snapshot

**Date**: $(date +%Y-%m-%d\ %H:%M:%S)
**Current Version**: $(cd upstream && git describe --tags)
**Target Version**: $LATEST_UPSTREAM

## Custom Files Found

$(cat $BACKUP_DIR/docs/custom-files-inventory.md)

## Git Status

\`\`\`
$(cd upstream && git status)
\`\`\`

## Remotes

\`\`\`
$(cd upstream && git remote -v)
\`\`\`

## Recent Commits

\`\`\`
$(cd upstream && git log --oneline -10)
\`\`\`
EOF

cat $BACKUP_DIR/docs/SNAPSHOT.md
```

#### 6. Verification Checklist
```bash
echo "🔍 Pre-Flight Inventory Complete"
echo "=================================="
echo ""
echo "Backed up to: $BACKUP_DIR"
echo ""
echo "Inventory:"
[ -f "$BACKUP_DIR/custom-code/advanced_tools.rs" ] && echo "  ✓ advanced_tools.rs" || echo "  ⚠️  advanced_tools.rs NOT FOUND"
[ -f "$BACKUP_DIR/custom-config/default_mcp.json" ] && echo "  ✓ default_mcp.json" || echo "  ⚠️  default_mcp.json NOT FOUND"
[ -f "$BACKUP_DIR/custom-assets/genie-notify-1.wav" ] && echo "  ✓ genie-notify-1.wav" || echo "  ⚠️  genie sounds NOT FOUND"
[ -f "$BACKUP_DIR/custom-assets/genie-notify-2.wav" ] && echo "  ✓ genie-notify-2.wav" || echo "  ⚠️  genie sounds NOT FOUND"

echo ""
echo "📝 Review snapshot: $BACKUP_DIR/docs/SNAPSHOT.md"
echo ""
echo "✅ Safe to proceed with Fork Sync"
```

---

## ENHANCED: Phase 3 - Fork Sync (with safety checks)

**Changes from v1.0**:
- Added verification before hard reset
- Added safety confirmation
- Document what will be lost

### Commands

#### Verify What Will Be Lost
```bash
cd upstream

# Show commits that will be lost
echo "⚠️  These commits will be LOST after hard reset:"
git log $LATEST_UPSTREAM..HEAD --oneline --decorate

# Show file changes that will be lost
echo ""
echo "⚠️  These file changes will be LOST:"
git diff --stat $LATEST_UPSTREAM..HEAD

# Count customizations
CUSTOM_COMMITS=$(git rev-list --count $LATEST_UPSTREAM..HEAD)
CUSTOM_FILES=$(git diff --name-only $LATEST_UPSTREAM..HEAD | wc -l)

echo ""
echo "Summary: $CUSTOM_COMMITS commits, $CUSTOM_FILES files modified"
echo ""

# Safety check
if [ "$CUSTOM_COMMITS" -gt 0 ]; then
    echo "⚠️  WARNING: You have $CUSTOM_COMMITS commits beyond upstream"
    echo "These are backed up in: $BACKUP_DIR"
    echo ""
    read -p "Continue with hard reset? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Aborted"
        exit 1
    fi
fi
```

#### Hard Reset to Upstream
```bash
# Hard reset (we have backups!)
git reset --hard $LATEST_UPSTREAM

# Verify clean
git log --oneline --decorate -3
git status

cd ..
```

---

## NEW: Phase 3.5 - Upstream Diff Review

**Purpose**: Understand what changed in upstream BEFORE applying rebrand

**When**: After fork sync, before rebrand

**Why**:
- v0.0.113→v0.0.114 showed important changes:
  - PORT environment variable support
  - Remote SSH editor support
  - Conversation reset fixes
- Need to understand if changes conflict with our customizations
- Helps plan integration of new features

### Commands

#### Generate Upstream Diff Report
```bash
cd upstream

# Get previous version (from our last namastex tag)
PREV_NAMASTEX=$(git tag -l "v0.0.*-namastex-*" | sort -V | tail -1)
PREV_UPSTREAM=$(echo $PREV_NAMASTEX | sed 's/-namastex-[0-9]*$//')

# If can't find, use parent repo's submodule commit
if [ -z "$PREV_UPSTREAM" ]; then
    PREV_UPSTREAM=$(cd .. && git log -1 --format=%H upstream | xargs -I {} git -C upstream describe --tags {})
fi

echo "Comparing: $PREV_UPSTREAM → $LATEST_UPSTREAM"

# Generate diff report
REPORT_DIR="../.genie/reports/upstream-diff-$(echo $LATEST_UPSTREAM | tr -d 'v.')"
mkdir -p "$REPORT_DIR"

# 1. Commit log
git log $PREV_UPSTREAM..$LATEST_UPSTREAM --oneline --decorate > $REPORT_DIR/commits.txt

# 2. File changes summary
git diff --stat $PREV_UPSTREAM..$LATEST_UPSTREAM > $REPORT_DIR/files-changed.txt

# 3. Cargo.toml changes (version bumps)
git diff $PREV_UPSTREAM..$LATEST_UPSTREAM -- "**/Cargo.toml" > $REPORT_DIR/cargo-changes.diff

# 4. package.json changes
git diff $PREV_UPSTREAM..$LATEST_UPSTREAM -- "**/package.json" > $REPORT_DIR/package-changes.diff

# 5. MCP-related changes
git diff $PREV_UPSTREAM..$LATEST_UPSTREAM -- "crates/server/src/mcp/" > $REPORT_DIR/mcp-changes.diff

# 6. Check for conflicts with our custom files
if [ -f "../$BACKUP_DIR/custom-code/advanced_tools.rs" ]; then
    # Check if task_server.rs was modified (might conflict with advanced_tools integration)
    if git diff --name-only $PREV_UPSTREAM..$LATEST_UPSTREAM | grep -q "crates/server/src/mcp/task_server.rs"; then
        echo "⚠️  WARNING: task_server.rs was modified - may conflict with advanced_tools.rs" > $REPORT_DIR/CONFLICTS.txt
        git diff $PREV_UPSTREAM..$LATEST_UPSTREAM -- crates/server/src/mcp/task_server.rs >> $REPORT_DIR/CONFLICTS.txt
    fi
fi

cd ..
```

#### Create Human-Readable Report
```bash
cat > $REPORT_DIR/UPSTREAM-DIFF-REPORT.md <<EOF
# Upstream Diff Report

**Previous Version**: $PREV_UPSTREAM
**Target Version**: $LATEST_UPSTREAM
**Date**: $(date +%Y-%m-%d)

---

## Commit Summary

$(cat $REPORT_DIR/commits.txt | wc -l) commits

\`\`\`
$(cat $REPORT_DIR/commits.txt)
\`\`\`

---

## Files Changed

$(head -50 $REPORT_DIR/files-changed.txt)

---

## Key Changes

### Version Bumps
$(grep -E "version.*=.*0.0" $REPORT_DIR/cargo-changes.diff | head -20)

### Package Dependencies
$(grep -E "\"version\":|\"dependencies\":" $REPORT_DIR/package-changes.diff | head -20)

---

## Potential Conflicts

$([ -f "$REPORT_DIR/CONFLICTS.txt" ] && cat $REPORT_DIR/CONFLICTS.txt || echo "✅ No conflicts detected with custom files")

---

## Risk Assessment

$(
    COMMITS=$(cat $REPORT_DIR/commits.txt | wc -l)
    FILES=$(cat $REPORT_DIR/files-changed.txt | wc -l)
    MCP_CHANGES=$(cat $REPORT_DIR/mcp-changes.diff | wc -l)

    if [ "$COMMITS" -lt 5 ] && [ "$MCP_CHANGES" -lt 50 ]; then
        echo "✅ **LOW RISK**: Few commits, minimal MCP changes"
    elif [ "$COMMITS" -lt 15 ] && [ "$MCP_CHANGES" -lt 200 ]; then
        echo "⚠️  **MEDIUM RISK**: Moderate changes, review carefully"
    else
        echo "🔴 **HIGH RISK**: Major changes, extensive testing needed"
    fi
)

---

## Recommendation

$([ -f "$REPORT_DIR/CONFLICTS.txt" ] && echo "⚠️  **REVIEW REQUIRED**: Conflicts detected - manually review before proceeding" || echo "✅ **SAFE TO PROCEED**: No conflicts detected")

EOF

# Display report
cat $REPORT_DIR/UPSTREAM-DIFF-REPORT.md

# Ask user to review
echo ""
echo "📄 Full report: $REPORT_DIR/UPSTREAM-DIFF-REPORT.md"
echo ""
read -p "Proceed with rebrand? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Paused - review diff report and resume when ready"
    exit 0
fi
```

---

## ENHANCED: Phase 4 - Mechanical Rebrand + Custom Asset Restoration

**Changes from v1.0**:
- Fixed build check (cargo check --workspace instead of -p forge-app)
- Added custom asset restoration
- Added verification of custom assets

### 4A. Run Rebrand Script (from automagik-forge root)

```bash
# Navigate to parent repo root
cd /home/namastex/workspace/automagik-forge
pwd  # Should show automagik-forge, not upstream/

# Run rebrand script (WILL FAIL at build check - that's OK, we fix it next)
./scripts/rebrand.sh || echo "Rebrand completed with expected build check failure"
```

**Note**: The rebrand script has a **bug** - it runs `cargo check -p forge-app` but that crate doesn't exist in upstream/. We fix this in next step.

### 4B. Fix Rebrand Script Build Check (ONE-TIME FIX)

```bash
# Update rebrand script to use correct build command
sed -i 's/cargo check -p forge-app/cd upstream \&\& cargo check --workspace \&\& cd ../g' scripts/rebrand.sh

# Verify fix
grep "cargo check" scripts/rebrand.sh
```

### 4C. Restore Custom Assets

```bash
cd upstream

# 1. Restore advanced_tools.rs
if [ -f "../$BACKUP_DIR/custom-code/advanced_tools.rs" ]; then
    echo "🛠️  Restoring advanced_tools.rs..."
    cp ../$BACKUP_DIR/custom-code/advanced_tools.rs crates/server/src/mcp/

    # Verify mod.rs includes it
    if ! grep -q "pub mod advanced_tools" crates/server/src/mcp/mod.rs; then
        echo "⚠️  Adding advanced_tools to mod.rs"
        sed -i '/pub mod task_server;/a pub mod advanced_tools;' crates/server/src/mcp/mod.rs
    fi

    echo "  ✓ advanced_tools.rs restored"
fi

# 2. Restore MCP configuration
if [ -f "../$BACKUP_DIR/custom-config/default_mcp.json" ]; then
    echo "⚙️  Restoring MCP configuration..."
    cp ../$BACKUP_DIR/custom-config/default_mcp.json crates/executors/
    echo "  ✓ default_mcp.json restored"
fi

# 3. Restore notification sounds
if [ -f "../$BACKUP_DIR/custom-assets/genie-notify-1.wav" ]; then
    echo "🎵 Restoring notification sounds..."
    cp ../$BACKUP_DIR/custom-assets/genie-notify-*.wav assets/sounds/

    # Remove upstream default sounds
    rm -f assets/sounds/cow-mooing.wav
    rm -f assets/sounds/rooster.wav

    echo "  ✓ Genie sounds restored"
    echo "  ✓ Upstream sounds removed"
fi

cd ..
```

### 4D. Verify Custom Assets Restored

```bash
echo "🔍 Verifying Custom Assets..."
MISSING=0

# Check advanced_tools.rs
if [ -f "upstream/crates/server/src/mcp/advanced_tools.rs" ]; then
    LINES=$(wc -l < upstream/crates/server/src/mcp/advanced_tools.rs)
    echo "  ✓ advanced_tools.rs present ($LINES lines)"

    # Verify integration
    if grep -q "pub mod advanced_tools" upstream/crates/server/src/mcp/mod.rs; then
        echo "    ✓ Referenced in mod.rs"
    else
        echo "    ❌ NOT referenced in mod.rs"
        MISSING=1
    fi
else
    echo "  ❌ advanced_tools.rs MISSING"
    MISSING=1
fi

# Check MCP config
if [ -f "upstream/crates/executors/default_mcp.json" ]; then
    if grep -q '"forge"' upstream/crates/executors/default_mcp.json && \
       grep -q '"genie"' upstream/crates/executors/default_mcp.json; then
        echo "  ✓ default_mcp.json has forge/genie servers"
    else
        echo "  ❌ default_mcp.json missing forge/genie"
        MISSING=1
    fi
else
    echo "  ❌ default_mcp.json MISSING"
    MISSING=1
fi

# Check sounds
if [ -f "upstream/assets/sounds/genie-notify-1.wav" ] && \
   [ -f "upstream/assets/sounds/genie-notify-2.wav" ]; then
    echo "  ✓ Genie notification sounds present"
else
    echo "  ❌ Genie sounds MISSING"
    MISSING=1
fi

# Check upstream sounds removed
if [ -f "upstream/assets/sounds/cow-mooing.wav" ] || \
   [ -f "upstream/assets/sounds/rooster.wav" ]; then
    echo "  ⚠️  Upstream sounds still present (should be removed)"
    MISSING=1
fi

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "❌ FAILURE: Custom assets not fully restored"
    echo "Review backup: $BACKUP_DIR"
    exit 1
fi

echo ""
echo "✅ All custom assets verified"
```

### 4E. Verify Build with Custom Assets

```bash
echo "🔨 Verifying build with custom assets..."

cd upstream

# Check workspace
if cargo check --workspace 2>&1 | tee /tmp/rebrand-build-with-customs.log; then
    echo "  ✓ Cargo check passed with custom assets"
else
    echo "  ❌ Cargo check FAILED"
    echo "See /tmp/rebrand-build-with-customs.log"
    exit 1
fi

cd ..
```

### 4F. Commit Rebrand + Custom Assets

```bash
cd upstream

# Stage all changes
git add -A

# Check what's staged
git status

# Create comprehensive commit
git commit -m "chore: mechanical rebrand for $LATEST_UPSTREAM + restore custom assets

Automated rebrand of upstream $LATEST_UPSTREAM

Branding Changes:
- vibe-kanban → automagik-forge (all variants)
- Bloop AI → Namastex Labs
- Email: genie@namastex.ai
- GitHub org: namastexlabs

Files modified: $(git diff --cached --name-only | wc -l)
Total replacements: 230+ occurrences

Note: External package 'vibe-kanban-web-companion' references preserved
(already aliased as AutomagikForgeWebCompanion in code)

Custom Assets Restored:
- advanced_tools.rs (466 lines, 49 MCP tools)
- default_mcp.json (Forge/Genie MCP servers, port 8887)
- genie-notify-1.wav, genie-notify-2.wav (custom sounds)

Base tag: $LATEST_UPSTREAM
Script: scripts/rebrand.sh
Backup: $BACKUP_DIR"

# Verify commit
git log -1 --stat

cd ..
```

---

## Success Criteria Updates

### ADDED: Pre-Flight Custom Asset Inventory
- ✅ Backup directory created with timestamp
- ✅ advanced_tools.rs backed up (if exists)
- ✅ default_mcp.json backed up
- ✅ Genie notification sounds backed up
- ✅ Snapshot document created
- ✅ Inventory shows all custom files

### ENHANCED: Mechanical Rebrand
- ✅ Rebrand script executed (text replacements)
- ✅ Build check fixed (cargo check --workspace)
- ✅ advanced_tools.rs restored and integrated
- ✅ default_mcp.json restored with Forge/Genie
- ✅ Genie sounds restored, upstream sounds removed
- ✅ Cargo check passes with all custom assets
- ✅ Comprehensive commit created

### ADDED: Upstream Diff Review
- ✅ Diff report generated in .genie/reports/
- ✅ Commit log captured
- ✅ File changes documented
- ✅ Potential conflicts identified
- ✅ Risk assessment performed
- ✅ User reviewed and approved

---

## Lessons Learned (v0.0.113 → v0.0.114)

### 1. Custom Files Discovery
**Issue**: Didn't know about advanced_tools.rs until manual review
**Solution**: Pre-Flight Custom Asset Inventory (Phase 0)

### 2. Rebrand Script Bug
**Issue**: `cargo check -p forge-app` fails (crate doesn't exist in upstream)
**Solution**: Fixed to `cargo check --workspace` in upstream/ directory

### 3. Binary Assets Lost
**Issue**: Rebrand script skips binary files, so custom sounds were lost
**Solution**: Explicit backup and restoration in Phase 4C

### 4. MCP Config Overwritten
**Issue**: Rebrand updates default_mcp.json but doesn't restore our version
**Solution**: Backup and restore in Phase 4C

### 5. No Diff Review
**Issue**: Jumped straight to rebrand without understanding upstream changes
**Solution**: Added Phase 3.5 with comprehensive diff analysis

---

## Total Time (with enhancements)

~5-7 minutes for complete workflow:
- Pre-Flight Inventory: ~1 minute
- Fork sync: ~1 minute
- Upstream Diff Review: ~1 minute
- Mechanical rebrand: ~1 minute
- Custom asset restoration: ~1 minute
- Verification: ~1 minute
- Release creation: ~1 minute

**Safety**: Multiple verification checkpoints, comprehensive backups

---

## Next Steps for Further Enhancement

1. **Automated Testing**: Add integration tests for advanced_tools.rs
2. **MCP Server Validation**: Actually start MCP server with --advanced flag
3. **Frontend Compatibility**: Check if frontend still builds with new backend
4. **Migration Script Generator**: Auto-generate SQL migrations if needed
5. **Rollback Procedure**: Document how to revert if something goes wrong

---

**This enhanced version incorporates ALL learnings from the v0.0.113→v0.0.114 upgrade journey.**
