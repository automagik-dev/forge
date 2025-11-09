# Rebrand Script Analysis

**Script**: `scripts/rebrand.sh`
**Purpose**: Mechanical rebranding of upstream/ submodule after pulling from BloopAI/vibe-kanban
**Date Analyzed**: 2025-11-03

---

## What the Script Does

### 1. **Verification Phase** (Lines 14-17)
- Checks that script is run from `automagik-forge` root directory
- Ensures `upstream/` directory exists
- Exits with error if not in correct location

### 2. **Text Replacement Phase** (Lines 24-93)
Processes text files in `upstream/` directory and performs these replacements:

#### A. Vibe Kanban → Automagik Forge (Lines 38-52)
Replaces ALL variations:
- `Vibe Kanban` → `Automagik Forge`
- `vibe-kanban` → `automagik-forge`
- `vibe_kanban` → `automagik_forge`
- `vibeKanban` → `automagikForge` (camelCase)
- `VibeKanban` → `AutomagikForge` (PascalCase)
- `VIBE_KANBAN` → `AUTOMAGIK_FORGE` (SCREAMING_SNAKE_CASE)
- `vibe kanban` → `automagik forge` (case insensitive)
- `VK` → `AF` (abbreviations)
- `vk` → `af` (lowercase abbreviations)
- `vk_` → `af_` (prefixes)
- `VK_` → `AF_` (uppercase prefixes)

#### B. Bloop AI → Namastex Labs (Lines 55-69)
Replaces company branding:
- `Bloop AI` → `Namastex Labs`
- `BloopAI` → `namastexlabs`
- `maintainers@bloop.ai` → `genie@namastex.ai`
- `bloop.ai` → `namastex.ai`
- `"bloop-dev"` → `"namastex-dev"`
- `"bloop-ai"` → `"namastexlabs"`
- `/BloopAI/` → `/namastexlabs/` (GitHub org)
- `"author": "bloop"` → `"author": "Namastex Labs"`

#### C. Exception Handling (Lines 72-79)
Reverts external package references:
- `automagik-forge-web-companion` → `vibe-kanban-web-companion`
- Keeps external package name but aliases the import:
  - `{ VibeKanbanWebCompanion as AutomagikForgeWebCompanion }`
- **Reason**: We don't fork this external package, so keep original name

#### D. Special Case: assets.rs (Lines 110-114)
Updates project directory path:
```rust
ProjectDirs::from("ai", "bloop", "vibe-kanban")
→
ProjectDirs::from("ai", "bloop", "automagik-forge")
```
**Note**: Keeps "bloop" in middle segment (required by ProjectDirs structure)

### 3. **File Selection** (Lines 97-107)
Processes these file types:
- Code: `.rs`, `.ts`, `.tsx`, `.js`, `.jsx`
- Config: `.json`, `.toml`, `.yml`, `.yaml`, `.webmanifest`
- Docs: `.md`, `.mdx`, `.txt`
- Web: `.html`, `.css`, `.scss`
- Scripts: `.sh`, `.ps1`, `Dockerfile`
- SQL: `.sql`

**Skips**:
- Binary files (detected with `file` command)
- `.git` directory contents

### 4. **Verification Phase** (Lines 117-178)
Counts remaining references:
- `vibe-kanban` variations: MUST be 0
- `VK/vk` abbreviations: MUST be 0
- `bloop` references: MUST be 0

**Fails loudly** if ANY remain, showing:
- Files with remaining references
- Exact locations

### 5. **Build Verification** (Lines 181-189)
Runs `cargo check -p forge-app` to verify:
- No compilation errors
- All references replaced correctly
- Logs output to `/tmp/rebrand-build.log`

### 6. **Success Report** (Lines 192-199)
Shows:
- Total replacements made
- Number of files modified
- Next steps for user

---

## Issues Found

### ❌ Issue 1: Wrong Crate Name in Build Check
**Location**: Line 183, Line 197

**Problem**:
```bash
cargo check -p forge-app
```

**What's Wrong**:
- `forge-app` crate exists in the **parent repo**, not in `upstream/` submodule
- Upstream submodule only has: `db`, `deployment`, `executors`, `local-deployment`, `server`, `services`, `utils`
- Build check will **fail** because crate doesn't exist

**Impact**: Script will always fail at build verification step

**Fix**:
```bash
# Should be:
cargo check -p server
# OR
cargo check --workspace  # Check all crates
```

### ⚠️ Issue 2: Doesn't Handle Binary Files (Sounds)
**Missing**: Binary asset management

**Problem**:
- Script explicitly skips binary files (line 28)
- Our custom notification sounds need to be restored:
  - `assets/sounds/genie-notify-1.wav` (384KB)
  - `assets/sounds/genie-notify-2.wav` (384KB)
- Upstream sounds need to be removed:
  - `assets/sounds/cow-mooing.wav` (414KB)
  - `assets/sounds/rooster.wav` (204KB)

**Impact**: Rebrand completes, but wrong notification sounds remain

**Fix**: Add binary asset management phase after rebrand

### ⚠️ Issue 3: Doesn't Handle Custom MCP Config
**Missing**: `crates/executors/default_mcp.json` restoration

**Problem**:
- Script rebrand's the file, but doesn't restore our custom MCP servers
- Upstream has: `"vibe-kanban"` MCP server
- We need: `"forge"` and `"genie"` MCP servers with port 8887

**Impact**: MCP configuration incorrect after rebrand

**Fix**: Add MCP config restoration phase after rebrand

### ⚠️ Issue 4: Doesn't Handle Custom Code Files
**Missing**: `crates/server/src/mcp/advanced_tools.rs` (466 lines)

**Problem**:
- Custom Rust file with 49 advanced MCP tools
- Doesn't exist in upstream
- Not mentioned or restored by script

**Impact**: Critical functionality lost (49 MCP tools disappear)

**Fix**: Add custom code restoration phase after rebrand

### ⚠️ Issue 5: No Verification of Custom Assets
**Missing**: Post-rebrand verification of Namastex customizations

**Problem**:
- Script verifies upstream branding is gone
- Doesn't verify our customizations are present

**Impact**: Can complete rebrand without actually having our features

**Fix**: Add verification phase for:
- `advanced_tools.rs` exists and compiles
- `default_mcp.json` has forge/genie servers
- Genie sounds exist
- MCP server starts with `--advanced` flag

---

## What the Script Does Well ✅

### Strengths:
1. **Comprehensive Pattern Matching**: Handles all case variations (camelCase, PascalCase, snake_case, etc.)
2. **Verification**: Fails loudly if any references remain
3. **Exception Handling**: Correctly preserves external package references
4. **Detailed Logging**: Shows exactly what was changed
5. **Safety First**: Verifies location before running
6. **Build Check**: Attempts to verify no compilation errors (though wrong crate)

---

## Recommended Enhancements

### 1. Fix Build Check
```bash
# Line 183, change from:
if cargo check -p forge-app 2>&1 | tee /tmp/rebrand-build.log; then

# To:
cd upstream
if cargo check --workspace 2>&1 | tee /tmp/rebrand-build.log; then
    cd ..
else
    cd ..
    echo "  ❌ Cargo check FAILED"
    exit 1
fi
```

### 2. Add Binary Asset Management
```bash
# After rebrand, before verification:
echo "🎵 Restoring custom notification sounds..."
if [ -d "../.genie/backups/pre-upgrade/sounds" ]; then
    cp ../.genie/backups/pre-upgrade/sounds/genie-notify-*.wav upstream/assets/sounds/
    rm -f upstream/assets/sounds/cow-mooing.wav
    rm -f upstream/assets/sounds/rooster.wav
    echo "  ✓ Custom sounds restored"
fi
```

### 3. Add MCP Config Restoration
```bash
echo "⚙️  Restoring custom MCP configuration..."
if [ -f "../.genie/backups/pre-upgrade/default_mcp.json" ]; then
    cp ../.genie/backups/pre-upgrade/default_mcp.json upstream/crates/executors/
    echo "  ✓ MCP config restored"
fi
```

### 4. Add Custom Code Restoration
```bash
echo "🛠️  Restoring custom code files..."
if [ -f "../.genie/backups/pre-upgrade/advanced_tools.rs" ]; then
    cp ../.genie/backups/pre-upgrade/advanced_tools.rs upstream/crates/server/src/mcp/
    # Verify mod.rs includes it
    if ! grep -q "pub mod advanced_tools" upstream/crates/server/src/mcp/mod.rs; then
        echo "  ⚠️  WARNING: advanced_tools not included in mod.rs"
    fi
    echo "  ✓ Custom code restored"
fi
```

### 5. Add Custom Asset Verification
```bash
echo "🔍 Verifying custom assets..."
MISSING=0

[ -f "upstream/crates/server/src/mcp/advanced_tools.rs" ] || { echo "  ❌ advanced_tools.rs missing"; MISSING=1; }
[ -f "upstream/assets/sounds/genie-notify-1.wav" ] || { echo "  ❌ genie-notify-1.wav missing"; MISSING=1; }
[ -f "upstream/assets/sounds/genie-notify-2.wav" ] || { echo "  ❌ genie-notify-2.wav missing"; MISSING=1; }
grep -q '"forge"' upstream/crates/executors/default_mcp.json || { echo "  ❌ forge MCP server missing"; MISSING=1; }
grep -q '"genie"' upstream/crates/executors/default_mcp.json || { echo "  ❌ genie MCP server missing"; MISSING=1; }

if [ "$MISSING" -gt 0 ]; then
    echo "❌ FAILURE: Custom assets not restored"
    exit 1
fi
echo "  ✓ All custom assets present"
```

---

## Summary

**Current State**:
- Script does mechanical text replacement **very well**
- Has **critical bugs** (wrong crate name in build check)
- **Missing** custom asset management (sounds, MCP config, custom code)

**Impact on v0.0.114 Upgrade**:
- Can't run as-is (build check will fail)
- Even if we fix build check, will lose:
  - 49 advanced MCP tools (466 lines of code)
  - Forge/Genie MCP servers
  - Genie notification sounds

**Recommendation**:
Fix the build check immediately, then add custom asset management phases either:
1. In the rebrand script itself (make it comprehensive)
2. In a separate `restore-custom-assets.sh` script (separation of concerns)
3. In the upstream-update agent workflow (automated orchestration)

**Priority**: HIGH - Script is core to upgrade process and currently broken
