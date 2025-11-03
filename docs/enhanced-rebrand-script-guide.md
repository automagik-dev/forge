# Enhanced Rebrand Script v2.0 - Complete Guide

**Location**: `scripts/rebrand.sh`
**Version**: 2.0
**Date**: 2025-11-03

---

## What's New in v2.0

### All 6 Critical Issues Fixed ✅

1. ✅ **Fixed Build Check** - Now uses `cargo check --workspace` instead of wrong `cargo check -p forge-app`
2. ✅ **Standalone "vibe" → "forge"** - Added patterns for `VIBE_`, `vibe-`, `Vibe `, `--vibe-`, `.vibe-`
3. ✅ **Binary Asset Management** - Backs up custom sounds (genie-notify-*.wav)
4. ✅ **MCP Config Tracking** - Backs up and diffs default_mcp.json
5. ✅ **Custom Code Tracking** - Backs up advanced_tools.rs + integration points
6. ✅ **Smart Restoration** - Generates diff reports instead of blind restoration

### New Features

- **Phase 0**: Pre-rebrand inventory & backup
- **Phase 2**: Post-rebrand diff analysis
- **Phase 5**: Automated restoration guide generation
- **Intelligent Restoration**: Script tells you HOW to restore, not just WHERE files are

---

## How It Works

### 5-Phase Process

```
Phase 0: Pre-Rebrand Inventory
         ↓
Phase 1: Mechanical Text Replacement
         ↓
Phase 2: Post-Rebrand Diff Analysis
         ↓
Phase 3: Verification
         ↓
Phase 4: Build Verification
         ↓
Phase 5: Generate Restoration Guide
```

---

## Phase-by-Phase Breakdown

### Phase 0: Pre-Rebrand Inventory

**Purpose**: Catalog and backup ALL custom assets BEFORE touching anything

**What It Does**:
1. Creates timestamped backup directory: `.genie/backups/pre-rebrand-YYYYMMDD-HHMMSS/`
2. Searches for custom code files:
   - `advanced_tools.rs` (466 lines, 49 MCP tools)
   - Checks integration in `mod.rs` and `task_server.rs`
3. Backs up custom configurations:
   - `default_mcp.json` (Forge/Genie MCP servers)
   - `default_profiles.json` (if customized)
4. Backs up custom binary assets:
   - `genie-notify-*.wav` files
5. Takes BEFORE snapshots of integration points:
   - `mod.rs.before`
   - `task_server.rs.before`
6. Generates inventory report: `INVENTORY.md`

**Output Example**:
```
📝 PHASE 0: Inventorying Custom Assets...
==========================================
Current upstream version: v0.0.113-namastex-9

🔍 Searching for custom code files...
  ✓ Found: advanced_tools.rs (466 lines)
    ✓ Integrated in mod.rs
    ✓ Used in task_server.rs

⚙️  Backing up custom configurations...
  ✓ Backed up: default_mcp.json
    ✓ Contains Forge/Genie MCP servers

🎵 Backing up custom binary assets...
  ✓ Backed up: 2 genie notification sound(s)

✅ Pre-rebrand inventory complete
   Backup: .genie/backups/pre-rebrand-20251103-143022
```

---

### Phase 1: Mechanical Text Replacement

**Purpose**: Replace ALL vibe-kanban/Bloop AI references with automagik-forge/Namastex

**What It Does**:

1. **NEW: Standalone "vibe" → "forge" Replacements** (Issue #2 Fix):
   ```bash
   VIBE_IMAGES_DIR → FORGE_IMAGES_DIR
   vibe-codex-executor → forge-codex-executor
   Vibe Kanban → Automagik Forge (when not "Vibe Kanban")
   --vibe-* → --forge-* (CSS variables)
   .vibe-images → .forge-images (directory names)
   ```

2. **Compound Pattern Replacements**:
   ```bash
   Vibe Kanban → Automagik Forge
   vibe-kanban → automagik-forge
   vibe_kanban → automagik_forge
   vibeKanban → automagikForge
   VibeKanban → AutomagikForge
   VIBE_KANBAN → AUTOMAGIK_FORGE
   VK/vk → AF/af
   ```

3. **Branding Replacements**:
   ```bash
   Bloop AI → Namastex Labs
   BloopAI → namastexlabs
   bloop.ai → namastex.ai
   maintainers@bloop.ai → genie@namastex.ai
   ```

4. **Exception Handling**:
   - Preserves `vibe-kanban-web-companion` (external package)
   - Uses aliased imports: `{ VibeKanbanWebCompanion as AutomagikForgeWebCompanion }`

**Output Example**:
```
🔄 PHASE 1: Mechanical Text Replacement...
==========================================
📝 Processing upstream/ files...
  ✓ Replaced 15 occurrences in upstream/crates/utils/src/path.rs
  ✓ Replaced 8 occurrences in upstream/crates/executors/src/executors/codex/client.rs
  ✓ Replaced 23 occurrences in upstream/frontend/src/components/dialogs/global/OnboardingDialog.tsx
  ...

✅ Mechanical rebrand complete
   Files modified: 74
   Total replacements: 247
```

---

### Phase 2: Post-Rebrand Diff Analysis

**Purpose**: Understand what changed in integration points (to guide restoration)

**What It Does**:
1. Takes AFTER snapshots of integration points:
   - `mod.rs.after`
   - `task_server.rs.after`
2. Generates diffs showing what the rebrand changed:
   - `mod_rs.diff` - Changes to module declarations
   - `task_server_rs.diff` - Changes to MCP task server
   - `default_mcp.diff` - Our custom config vs rebranded upstream
3. Flags significant changes:
   - If `task_server.rs` changed > 50 lines: ⚠️ WARNING

**Output Example**:
```
📸 PHASE 2: Post-Rebrand Analysis...
==========================================
Analyzing changes to advanced_tools.rs integration points...
  ✓ Generated diff: mod.rs
  ✓ Generated diff: task_server.rs (23 lines changed)
  ✓ Generated diff: default_mcp.json (ours vs rebranded)
```

**If Significant Changes**:
```
  ✓ Generated diff: task_server.rs (187 lines changed)
    ⚠️  WARNING: Significant changes detected - careful review needed
```

---

### Phase 3: Verification

**Purpose**: Ensure ALL branding references were replaced

**What It Does**:
1. Counts remaining references:
   - `vibe-kanban` variations (must be 0)
   - Standalone `vibe` (must be 0) ← **NEW**
   - `VK/vk` abbreviations (must be 0)
   - `bloop` references (must be 0)
2. Excludes valid exceptions:
   - `web-companion` package references
   - Binary files
   - `.git` directory
3. **FAILS LOUDLY** if any remain

**Output Example (Success)**:
```
🔍 PHASE 3: Verification...
==========================================
📊 Verification Results:
   Replacements made: 247
   Files modified: 74
   Remaining 'vibe-kanban' references: 0
   Remaining standalone 'vibe' references: 0
   Remaining 'VK/vk' abbreviations: 0
   Remaining 'bloop' references: 0

✅ Text rebrand verification passed
```

**Output Example (Failure)**:
```
📊 Verification Results:
   Remaining standalone 'vibe' references: 5

❌ FAILURE: References still exist in upstream/!

Files with standalone 'vibe':
upstream/crates/utils/src/path.rs
upstream/frontend/src/utils/style-override.tsx
```

---

### Phase 4: Build Verification

**Purpose**: Ensure rebranded code compiles

**What It Does**:
1. **FIXED**: Uses correct `cargo check --workspace` command
2. Runs in `upstream/` directory
3. Logs output to `/tmp/rebrand-build.log`
4. Exits on failure

**Output Example**:
```
🔨 PHASE 4: Build Verification...
==========================================
  ✓ Cargo check passed
```

---

### Phase 5: Generate Restoration Guide

**Purpose**: Create intelligent, actionable restoration guidance

**What It Does**:

1. **Analyzes** diffs to determine restoration strategy
2. **Generates** comprehensive guide: `RESTORATION_GUIDE.md`
3. **Provides** specific commands for each scenario
4. **Flags** conflicts and risky restorations

**Restoration Strategy Logic**:

```
If advanced_tools.rs exists:
    If task_server.rs changed < 50 lines:
        ✅ SAFE TO RESTORE - Direct copy
    Else:
        ⚠️  MANUAL REVIEW NEEDED - Careful merge required
Else:
    N/A - No custom code
```

**Generated Guide Sections**:

1. **Advanced MCP Tools** (advanced_tools.rs)
   - Status: Found/Not Found
   - Restoration Strategy: Safe/Manual/N/A
   - Integration Points Changed: Diffs
   - Recommended Actions: Step-by-step

2. **MCP Configuration** (default_mcp.json)
   - Status: Found/Not Found
   - Your Custom Config: JSON
   - After Rebrand: JSON
   - Recommended Actions: Commands

3. **Binary Assets** (Sounds)
   - Status: Found/Not Found
   - Recommended Actions: Copy commands

4. **Verification Checklist**
   - Step-by-step verification after restoration

5. **Example Commands**
   - Safe restoration (always works)
   - No-conflict restoration (if applicable)

6. **Next Steps**
   - Ordered workflow for restoration

**Output Example**:
```
📋 PHASE 5: Generating Restoration Guide...
==========================================
  ✓ Generated: RESTORATION_GUIDE.md
```

---

## Final Report

**What You Get**:
```
🎉 SUCCESS: Rebrand Complete!
==========================================

📊 Summary:
   Total replacements: 247 across 74 files
   Build verification: ✅ PASSED
   Text rebrand: ✅ COMPLETE

📦 Artifacts:
   Backup: .genie/backups/pre-rebrand-20251103-143022
   Reports: .genie/reports/rebrand-20251103-143022

📋 Next Steps:
   1. Review restoration guide: .genie/reports/rebrand-20251103-143022/RESTORATION_GUIDE.md
   2. Examine diffs: .genie/reports/rebrand-20251103-143022/*.diff
   3. Restore custom assets following the guide
   4. Verify build: cd upstream && cargo check --workspace
   5. Commit rebrand + custom assets separately

⚠️  IMPORTANT: DO NOT blindly restore files!
   Read the restoration guide and diffs first.
```

---

## Artifacts Generated

### Backup Directory Structure
```
.genie/backups/pre-rebrand-YYYYMMDD-HHMMSS/
├── custom-code/
│   └── advanced_tools.rs              (466 lines)
├── custom-config/
│   ├── default_mcp.json               (Forge/Genie config)
│   └── default_profiles.json          (if exists)
├── custom-assets/
│   ├── genie-notify-1.wav             (384KB)
│   └── genie-notify-2.wav             (384KB)
├── snapshots/
│   ├── mod.rs.before                  (integration snapshot)
│   ├── mod.rs.after                   (after rebrand)
│   ├── task_server.rs.before          (usage snapshot)
│   ├── task_server.rs.after           (after rebrand)
│   ├── mod_rs_integration.txt         (grep results)
│   ├── task_server_usage.txt          (grep results)
│   └── mcp_customizations.txt         (config details)
└── INVENTORY.md                       (summary report)
```

### Report Directory Structure
```
.genie/reports/rebrand-YYYYMMDD-HHMMSS/
├── RESTORATION_GUIDE.md               (main guide)
├── mod_rs.diff                        (mod.rs changes)
├── task_server_rs.diff                (task_server.rs changes)
└── default_mcp.diff                   (MCP config changes)
```

---

## Usage Example

### Running the Script

```bash
# From automagik-forge root
./scripts/rebrand.sh
```

### Following the Restoration Guide

```bash
# 1. Read the guide
cat .genie/reports/rebrand-20251103-143022/RESTORATION_GUIDE.md

# 2. Check the diffs
less .genie/reports/rebrand-20251103-143022/task_server_rs.diff

# 3. Restore based on guidance (example)
# If guide says "SAFE TO RESTORE":
cp .genie/backups/pre-rebrand-20251103-143022/custom-code/advanced_tools.rs \
   upstream/crates/server/src/mcp/

# Ensure integration
if ! grep -q "pub mod advanced_tools" upstream/crates/server/src/mcp/mod.rs; then
    sed -i '/pub mod task_server;/a pub mod advanced_tools;' \
        upstream/crates/server/src/mcp/mod.rs
fi

# 4. Always restore MCP config and sounds (safe)
cp .genie/backups/pre-rebrand-20251103-143022/custom-config/default_mcp.json \
   upstream/crates/executors/

cp .genie/backups/pre-rebrand-20251103-143022/custom-assets/genie-notify-*.wav \
   upstream/assets/sounds/

rm -f upstream/assets/sounds/cow-mooing.wav \
      upstream/assets/sounds/rooster.wav

# 5. Verify
cd upstream && cargo check --workspace && cd ..
```

---

## Restoration Guide Sample

Here's what the generated `RESTORATION_GUIDE.md` looks like:

```markdown
# Custom Asset Restoration Guide

**Generated**: 2025-11-03 14:30:22
**Upstream Version**: v0.0.114-20251031170655
**Backup Directory**: .genie/backups/pre-rebrand-20251103-143022
**Report Directory**: .genie/reports/rebrand-20251103-143022

---

## 1. Advanced MCP Tools (advanced_tools.rs)

### Status
✅ **FOUND** - Backed up (466 lines, 49 MCP tools)

### Restoration Strategy
✅ **SAFE TO RESTORE** - Minimal changes in task_server.rs (23 lines)

Direct copy should work. Verify after restoration.

### Integration Points Changed

#### mod.rs Changes
```diff
--- mod.rs.before
+++ mod.rs.after
@@ -1,5 +1,5 @@
-// Vibe Kanban MCP server
+// Automagik Forge MCP server
 pub mod task_server;
```

#### task_server.rs Changes
```diff
[Shows first 50 lines of diff...]

See full diff: .genie/reports/rebrand-20251103-143022/task_server_rs.diff
```

### Recommended Actions
1. Copy advanced_tools.rs to upstream/crates/server/src/mcp/
2. Ensure mod.rs includes it
3. Run cargo check --workspace

---

## 2. MCP Configuration (default_mcp.json)

### Status
✅ **FOUND** - Custom configuration backed up

### Your Custom Configuration
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

### After Rebrand
```json
{
  "automagik-forge": {
    "command": "npx",
    "args": ["-y", "automagik-forge@latest", "--mcp"],
    "env": {}
  }
}
```

### Recommended Actions
1. Copy your custom config over the rebranded one
2. Verify forge/genie servers present
3. Ensure BACKEND_PORT: 8887

[... continues with Binary Assets, Verification Checklist, Commands, etc.]
```

---

## Key Improvements Over v1.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| **Build Check** | ❌ Wrong crate | ✅ Correct workspace |
| **Standalone "vibe"** | ❌ Missed | ✅ Replaced |
| **Custom Code** | ❌ Lost | ✅ Backed up + guided |
| **MCP Config** | ❌ Overwritten | ✅ Backed up + diffed |
| **Binary Assets** | ❌ Lost | ✅ Backed up |
| **Restoration** | ❌ Manual guesswork | ✅ Automated guide |
| **Conflict Detection** | ❌ None | ✅ Diff analysis |
| **Risk Assessment** | ❌ None | ✅ Safe/Manual flags |

---

## Safety Features

1. **Non-Destructive**: All custom files backed up before any changes
2. **Timestamped**: Each run creates unique backup/report directories
3. **Fail-Fast**: Exits immediately if verification fails
4. **Comprehensive**: Checks 4 types of references (vibe-kanban, vibe, VK, bloop)
5. **Build Verified**: Ensures code compiles after rebrand
6. **Smart Guidance**: Tells you HOW to restore, not just WHERE files are

---

## Testing

### Test on Clean v0.0.114

```bash
# Ensure you're on clean v0.0.114 in main
git branch --show-current  # Should be: main
git describe --tags        # Should be: v0.0.114-20251031170655

# Run rebrand
./scripts/rebrand.sh

# Expected: All phases pass, guide generated
```

### Expected Output Counts

For v0.0.113→v0.0.114:
- Files modified: ~70-80
- Total replacements: ~230-250
- Remaining references: 0 (all types)
- Build check: ✅ PASS

---

## Troubleshooting

### "Must run from automagik-forge root"
```bash
pwd  # Should show: /path/to/automagik-forge
ls -la | grep upstream  # Should see: upstream/ directory
```

### "Cargo check FAILED"
```bash
# Check the log
cat /tmp/rebrand-build.log

# Common issues:
# - Missing dependencies (run: cargo fetch)
# - Syntax errors (check diffs for mistakes)
```

### "References still exist"
```bash
# Script will show exactly which files and what references
# Usually:
# - web-companion (OK - external package)
# - Comments or docs (might be OK)
# - New patterns not caught (add to script)
```

---

## Agent Integration

The restoration guide is designed to be read by AI agents (like Claude):

**Guide provides**:
- ✅ Status of each custom file (FOUND/NOT FOUND)
- ✅ Risk assessment (SAFE/MANUAL)
- ✅ Diffs showing what changed
- ✅ Exact commands to run
- ✅ Verification checklist

**Agent can**:
1. Read the guide
2. Examine the diffs
3. Make informed decision on restoration approach
4. Execute restoration commands
5. Verify build success

**Example agent prompt**:
```
Read the restoration guide at .genie/reports/rebrand-YYYYMMDD-HHMMSS/RESTORATION_GUIDE.md
and restore custom assets following the recommended strategy. Show me the diffs
before proceeding if manual review is needed.
```

---

## Future Enhancements

Potential improvements for v3.0:
1. **Auto-restore safe files** - MCP config and sounds always safe
2. **Three-way merge** - For conflicting custom code
3. **Rollback support** - Undo rebrand if needed
4. **Test suite** - Run automated tests after rebrand
5. **MCP server validation** - Actually start MCP with --advanced flag

---

**This enhanced script solves all 6 issues and provides intelligent restoration guidance!** 🎉
