# Complete Rebrand Script Issues Analysis

**Date**: 2025-11-03
**Script**: `scripts/rebrand.sh`

---

## Summary

**No, the build check bug is NOT the only issue.**

After comprehensive analysis (including user discovery), the rebrand script has **6 critical issues**:

---

## Issue #1: ❌ CRITICAL - Wrong Crate in Build Check

**Location**: Lines 183, 197

**Current Code**:
```bash
if cargo check -p forge-app 2>&1 | tee /tmp/rebrand-build.log; then
```

**Problem**:
- `forge-app` crate exists in **parent repo**, NOT in `upstream/` submodule
- Upstream only has: `db`, `deployment`, `executors`, `local-deployment`, `server`, `services`, `utils`
- Build check will **always fail**

**Impact**: Script terminates with error every time

**Fix**:
```bash
cd upstream
if cargo check --workspace 2>&1 | tee /tmp/rebrand-build.log; then
    cd ..
else
    cd ..
    echo "  ❌ Cargo check FAILED"
    exit 1
fi
```

---

## Issue #2: ⚠️ Missing Standalone "vibe" → "forge" Replacements

**Discovered by**: User

**Problem**: Script only replaces compound patterns (`vibe-kanban`, `vibe_kanban`) but NOT standalone "vibe"

**Found 27 Occurrences**:

### Examples:
```
./crates/utils/src/path.rs:
pub const VIBE_IMAGES_DIR: &str = ".vibe-images";
```
Should become:
```rust
pub const FORGE_IMAGES_DIR: &str = ".forge-images";
```

```
./crates/executors/src/executors/codex/client.rs:
name: "vibe-codex-executor".to_string(),
```
Should become:
```rust
name: "forge-codex-executor".to_string(),
```

```
./frontend/src/utils/style-override.tsx:
// CSS variable overrides (only --vibe-* prefixed variables)
```
Should become:
```tsx
// CSS variable overrides (only --forge-* prefixed variables)
```

```
./frontend/src/components/dialogs/global/OnboardingDialog.tsx:
<DialogTitle>Welcome to Vibe Kanban</DialogTitle>
```
Should become:
```tsx
<DialogTitle>Welcome to Automagik Forge</DialogTitle>
```

**Impact**: 27 references remain with "vibe" branding after rebrand completes

**Fix**: Add these replacement patterns (BEFORE existing patterns, at line 38):
```bash
sed -i \
    -e 's/\bVIBE_/FORGE_/g' \
    -e 's/\bvibe-/forge-/g' \
    -e 's/\bVibe /Forge /g' \
    -e 's/--vibe-/--forge-/g' \
    -e 's/\.vibe-/.forge-/g' \
    "$file" 2>/dev/null || true
```

**Important**: These must come BEFORE the `Vibe Kanban` → `Automagik Forge` replacement (line 39) to avoid conflicts

---

## Issue #3: ⚠️ Doesn't Handle Binary Files (Sounds)

**Problem**: Script explicitly skips binary files (line 28)

**Missing Assets**:
- `assets/sounds/genie-notify-1.wav` (384KB) - our custom sound
- `assets/sounds/genie-notify-2.wav` (384KB) - our custom sound

**Unwanted Assets Remain**:
- `assets/sounds/cow-mooing.wav` (414KB) - upstream default
- `assets/sounds/rooster.wav` (204KB) - upstream default

**Impact**: Wrong notification sounds after rebrand

**Fix**: Add after rebrand, before verification (after line 107):
```bash
# Binary asset management
echo "🎵 Managing binary assets..."
if [ -d "../.genie/backups/pre-upgrade/custom-assets" ]; then
    cp ../.genie/backups/pre-upgrade/custom-assets/genie-notify-*.wav upstream/assets/sounds/ 2>/dev/null || true
    rm -f upstream/assets/sounds/cow-mooing.wav
    rm -f upstream/assets/sounds/rooster.wav
    echo "  ✓ Custom sounds restored, upstream sounds removed"
fi
```

---

## Issue #4: ⚠️ Doesn't Restore Custom MCP Config

**Problem**: Script rebrands `default_mcp.json` but doesn't restore our custom version

**What Gets Lost**:
```json
{
  "forge": {
    "command": "npx",
    "args": ["-y", "automagik-forge@latest", "--mcp"],
    "env": {"BACKEND_PORT": "8887", "HOST": "127.0.0.1"}
  },
  "genie": {
    "command": "npx",
    "args": ["-y", "automagik-genie@latest", "mcp"]
  }
}
```

**What Remains** (after rebrand):
```json
{
  "automagik-forge": {  // ← rebranded from "vibe-kanban"
    "command": "npx",
    "args": ["-y", "automagik-forge@latest", "--mcp"],  // ← rebranded
    "env": {}  // ← Missing port 8887!
  }
  // ← Missing genie server entirely
}
```

**Impact**: MCP servers misconfigured, port wrong, genie missing

**Fix**: Add after rebrand (after line 107):
```bash
# Restore custom MCP config
echo "⚙️  Restoring MCP configuration..."
if [ -f "../.genie/backups/pre-upgrade/custom-config/default_mcp.json" ]; then
    cp ../.genie/backups/pre-upgrade/custom-config/default_mcp.json upstream/crates/executors/
    echo "  ✓ MCP config restored"
fi
```

---

## Issue #5: ⚠️ Doesn't Handle Custom Code Files

**Problem**: Custom Rust files not tracked or restored

**Missing File**:
- `crates/server/src/mcp/advanced_tools.rs` (466 lines, 49 MCP tools)

**Impact**: Critical functionality lost (49 MCP tools disappear)

**Fix**: Add after rebrand (after line 107):
```bash
# Restore custom code files
echo "🛠️  Restoring custom code..."
if [ -f "../.genie/backups/pre-upgrade/custom-code/advanced_tools.rs" ]; then
    cp ../.genie/backups/pre-upgrade/custom-code/advanced_tools.rs upstream/crates/server/src/mcp/

    # Verify mod.rs includes it
    if ! grep -q "pub mod advanced_tools" upstream/crates/server/src/mcp/mod.rs; then
        echo "  ⚠️  Adding advanced_tools to mod.rs"
        sed -i '/pub mod task_server;/a pub mod advanced_tools;' upstream/crates/server/src/mcp/mod.rs
    fi

    echo "  ✓ advanced_tools.rs restored"
fi
```

---

## Issue #6: ⚠️ Doesn't Verify Custom Assets Restored

**Problem**: Script verifies upstream branding is gone, but doesn't verify our customizations are present

**Missing Verifications**:
- ✅ advanced_tools.rs exists?
- ✅ default_mcp.json has forge/genie?
- ✅ Genie sounds present?
- ✅ Upstream sounds removed?

**Impact**: Can complete "successfully" without actually having our features

**Fix**: Add after restoration, before build check (before line 182):
```bash
echo "🔍 Verifying Custom Assets..."
MISSING=0

# Check advanced_tools.rs
if [ -f "upstream/crates/server/src/mcp/advanced_tools.rs" ]; then
    echo "  ✓ advanced_tools.rs present ($(wc -l < upstream/crates/server/src/mcp/advanced_tools.rs) lines)"

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

        if grep -q '"BACKEND_PORT": "8887"' upstream/crates/executors/default_mcp.json; then
            echo "    ✓ Port 8887 configured"
        else
            echo "    ⚠️  Port 8887 not set"
        fi
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
else
    echo "  ✓ Upstream sounds removed"
fi

if [ "$MISSING" -gt 0 ]; then
    echo ""
    echo "❌ FAILURE: Custom assets not fully restored"
    exit 1
fi

echo "  ✅ All custom assets verified"
```

---

## Complete Fix Summary

### Order of Fixes (in script):

1. **Line 38** (BEFORE existing replacements): Add standalone `vibe` → `forge` patterns
2. **Line 107** (AFTER file processing): Add custom asset restoration
3. **Line 181** (BEFORE build check): Add custom asset verification
4. **Line 183** (Build check): Fix cargo command

### Total Changes Required:
- **1 line change**: Build check command
- **~5 lines added**: Standalone vibe replacement patterns
- **~15 lines added**: Binary asset management
- **~10 lines added**: MCP config restoration
- **~15 lines added**: Custom code restoration
- **~50 lines added**: Custom asset verification

**New Script Length**: ~250 lines (was ~199)

---

## Why These Issues Went Unnoticed

1. **Build check bug**: Script hasn't been run from scratch since forge-app moved to parent repo
2. **Standalone "vibe"**: Focus was on compound patterns, standalone word overlooked
3. **Binary/config/code files**: Original script designed for text-only rebrand
4. **No verification**: Assumed text replacement was sufficient

---

## Impact Without Fixes

Running current script on v0.0.114 would result in:
- ❌ Script fails at build check (forge-app not found)
- ❌ 27 "vibe" references remain
- ❌ Wrong notification sounds
- ❌ 49 MCP tools lost (466 lines of code)
- ❌ Forge/Genie MCP servers misconfigured
- ❌ No way to know what's missing

---

## Recommendation

**Priority**: URGENT - Script is broken and will fail

**Options**:
1. **Fix rebrand.sh immediately** - Apply all 6 fixes (recommended)
2. **Use manual workflow** - Follow enhanced upstream-update agent
3. **Create separate restore script** - Keep rebrand pure, add restore-custom-assets.sh

**Best Approach**: Fix rebrand.sh with all 6 issues, then incorporate into enhanced upstream-update agent

---

## Testing Plan

After fixes, test with:
```bash
# 1. Create clean v0.0.114 (already done)
# 2. Run fixed rebrand script
./scripts/rebrand.sh

# 3. Verify output
grep -r "vibe" upstream/ | grep -v ".git" | grep -v "web-companion"
# Should show: 0 results (except aliased imports)

# 4. Verify custom assets
ls -la upstream/crates/server/src/mcp/advanced_tools.rs
grep "forge\|genie" upstream/crates/executors/default_mcp.json
ls -la upstream/assets/sounds/genie-notify-*.wav

# 5. Verify build
cd upstream && cargo check --workspace && cd ..
```

**Expected**: All verifications pass, script completes successfully
