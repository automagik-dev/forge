# Upstream v0.0.113-namastex-9 - Last Living Proof

**Date**: 2025-11-03
**Version**: v0.0.113-namastex-9
**Base Upstream**: v0.0.113-20251029121358
**Purpose**: Document the complete state of v0.0.113-namastex-9 before upgrading to v0.0.114

---

## Git Status Confirmation

✅ **VERIFIED**: `main` branch === `release/v0.0.113-namastex-9`
- Both at commit: `2fab7d49b17fdcdbe9456e36affefcfac663c022`
- No differences between main and release branch
- Git diff is empty

## Complete Namastex Version History

### v0.0.113-namastex-1 (Base + Rebrand)
```
95ff5cba chore: mechanical rebrand for v0.0.113-20251029121358
```
- Initial mechanical rebrand from vibe-kanban → automagik-forge
- Base tag: v0.0.113-20251029121358

### v0.0.113-namastex-2 (MCP Tools Integration)
```
37278098 chore: merge latest upstream changes into feature branch
e44ec402 chore: update Cargo.lock for v0.0.113 dependencies
b84dae75 feat: integrate 51 advanced MCP tools into default server
ab07116e prevent draft restoration logic from overwriting changes to a message
1183f099 Update status position
0e2653a2 Pre release doesn't update lockfile
```
- **Major Addition**: 49 advanced MCP tools in `crates/server/src/mcp/advanced_tools.rs` (466 lines)
- Updated Cargo.lock for dependencies
- Merged upstream fixes

### v0.0.113-namastex-3 (Neuron Profiles)
```
1eb0d34d feat: add WISH, FORGE, REVIEW neuron profiles to all executors
05c0abde refactor: simplify default executor profiles to only DEFAULT variant
88a1c5a4 fix: add Embed trait import for RustEmbed to resolve compilation errors
c11d5513 fix: add missing dependencies and types for MCP tools compilation
```
- Added WISH, FORGE, REVIEW neuron profiles
- Simplified default executor profiles
- Fixed compilation errors

### v0.0.113-namastex-4 (Naming Consolidation)
```
5a1f920b chore: rename automagik_forge to forge and add genie MCP server
616c624f fix: remove unused Embed import from frontend.rs
```
- Renamed automagik_forge → forge
- Added genie MCP server to default_mcp.json

### v0.0.113-namastex-5 (Feature Branch Merges)
```
bf5314a1 Merge branch 'release/v0.0.113-namastex-4' into main
df4ea637 Merge branch 'fix/upstream-sync' into main
7d9b4f6c chore: update favicon references in index.html
1c9a9a84 chore: rebrand from Vibe Kanban to Automagik Forge and add Genie MCP server
d5534678 fix: remove unused Embed import from frontend routes
8e4717d2 chore: update genie notification sounds with new recordings
7c7fb59a Replace cow/rooster sounds with genie notification sounds
82ec8878 fix: correct CODEX sandbox mode values for read-only variants
77f87243 feat: add MASTER variant and configure read-only mode for orchestrator
e9426938 fix: update MCP server icons to use 512x512 PNG
```
- Merged multiple feature branches
- Updated notification sounds (cow/rooster → genie-notify-1/2.wav)
- Added MASTER variant with read-only mode
- Updated MCP server icons

### v0.0.113-namastex-6 through namastex-9 (Refinements & Reverts)
```
2fab7d49 (v0.0.113-namastex-9) fix: code formatting and cleanup improvements
17299976 (v0.0.113-namastex-8) fix: add default port 8887 for reliable MCP server discovery
11a84948 (v0.0.113-namastex-6) fix: correct frontend/dist path in server build script
c827ea63 revert: restore original default_profiles.json without Namastex customizations
3b2f604c fix: revert MCP icons to android-chrome and update with correct Automagik branding
07a9bc75 fix: update MCP server icons to use Namastex branding
```
- **CRITICAL REVERT**: Restored original `default_profiles.json` (removed WISH, FORGE, REVIEW, MASTER)
- Added default port 8887 for MCP server
- Fixed frontend/dist path in build script
- Code formatting and cleanup

---

## Key Customizations in v0.0.113-namastex-9

### 1. Executor Profiles (`crates/executors/default_profiles.json`)
**Status**: ✅ Clean - Reverted to upstream defaults

Contains ONLY generic executor defaults:
- CLAUDE_CODE, AMP, GEMINI, CODEX, OPENCODE, QWEN_CODE, CURSOR_AGENT, COPILOT
- NO Namastex-specific profiles (MASTER, WISH, FORGE, REVIEW removed)
- This file is intentionally kept generic for upstream

### 2. MCP Configuration (`crates/executors/default_mcp.json`)
**Status**: ⚠️ Customized - Namastex branding

```json
{
  "forge": {
    "command": "npx",
    "args": ["-y", "automagik-forge@latest", "--mcp"],
    "env": {
      "BACKEND_PORT": "8887",
      "HOST": "127.0.0.1"
    }
  },
  "genie": {
    "command": "npx",
    "args": ["-y", "automagik-genie@latest", "mcp"]
  },
  "meta": {
    "forge": {
      "name": "Forge",
      "description": "Core task management tools for Automagik Forge (7 tools)",
      "url": "https://forge.automag.ik",
      "icon": "android-chrome-512x512.png"
    },
    "genie": {
      "name": "Automagik Genie",
      "description": "AI agent orchestration and wish management",
      "url": "https://genie.automag.ik",
      "icon": "android-chrome-512x512.png"
    }
  }
}
```

**Customizations**:
- Forge server pointing to `automagik-forge@latest`
- Genie server pointing to `automagik-genie@latest`
- Default port: 8887 (not auto-assigned)
- Branding: "Automagik Forge" and "Automagik Genie"
- Icons: android-chrome-512x512.png

### 3. Advanced MCP Tools (`crates/server/src/mcp/advanced_tools.rs`)
**Status**: ⚠️ Added - 466 lines

49 additional MCP tools mirroring complete Forge backend API:
- Task Attempts (25 tools)
- Execution Processes (3 tools)
- Images (2 tools)
- Filesystem (2 tools)
- Config (2 tools)
- Drafts (5 tools)
- Containers (2 tools)
- Forge-Specific (8 tools)

### 4. Notification Sounds
**Status**: ⚠️ Customized - Namastex branding

Changed:
- `assets/sounds/cow-mooing.wav` → DELETED
- `assets/sounds/rooster.wav` → DELETED
- `assets/sounds/genie-notify-1.wav` → ADDED (384078 bytes)
- `assets/sounds/genie-notify-2.wav` → ADDED (384078 bytes)

### 5. Documentation & Branding
**Status**: ⚠️ Rebranded

Files changed with Automagik Forge branding:
- README.md
- CLAUDE.md
- CODE-OF-CONDUCT.md
- docs/agents/*.mdx
- Various crate documentation

---

## File Changes from Upstream v0.0.113

**Total Modified Files**: ~70+ files
**Total Lines Changed**: ~1,700+ lines

### Key Modified Files:
```
crates/executors/default_mcp.json                  | 39 +-
crates/executors/default_profiles.json             | 87 +- (then reverted)
crates/server/src/mcp/advanced_tools.rs            | 466 +++ (NEW)
crates/server/src/mcp/task_server.rs               | 1104 ++++++
assets/sounds/genie-notify-1.wav                   | BINARY (NEW)
assets/sounds/genie-notify-2.wav                   | BINARY (NEW)
```

---

## Repository Remotes

```
origin    https://github.com/namastexlabs/vibe-kanban.git
upstream  https://github.com/BloopAI/vibe-kanban.git
bloop     https://github.com/BloopAI/vibe-kanban.git
```

---

## Release Branches

All namastex releases tracked via release branches (per THE LAW):
```
release/v0.0.113-namastex-3
release/v0.0.113-namastex-4
release/v0.0.113-namastex-5
release/v0.0.113-namastex-6
release/v0.0.113-namastex-7
release/v0.0.113-namastex-8
release/v0.0.113-namastex-9  ← CURRENT
```

---

## Upstream v0.0.114 Available

**Latest Upstream Tag**: `v0.0.114-20251031170655`
**Upstream Branch**: `upstream/main` at commit `4ded30b5`

Recent upstream changes:
```
4ded30b5 chore: bump version to 0.0.114
1c0dfc1c detect when the conversation has been reset correctly (#1150)
f21b9037 Done! The dev server script now accepts PORT env var (#1142)
e8ff40d5 Remote host + username opening for VSCode based IDEs (#1134)
```

---

## Critical Notes for v0.0.114 Upgrade

### What to Preserve:
1. ✅ **default_mcp.json** - Namastex MCP server configuration
2. ✅ **advanced_tools.rs** - 49 additional MCP tools
3. ✅ **Notification sounds** - genie-notify-1/2.wav
4. ✅ **Branding** - Automagik Forge references in docs

### What NOT to Preserve:
1. ❌ **default_profiles.json** - Keep upstream defaults (already reverted)
2. ❌ **Executor neuron profiles** - MASTER, WISH, FORGE, REVIEW belong in parent repo

### Parent Repo Ownership:
The parent `automagik-forge` repository owns:
- `crates/executors/default_profiles.json` with Namastex profiles (MASTER, WISH, FORGE, REVIEW)
- Custom frontend
- All Namastex IP

The upstream submodule should remain clean and generic where possible.

---

## Next Steps

1. ✅ Confirmed main === release/v0.0.113-namastex-9
2. ✅ Documented all namastex versions and changes
3. ✅ Identified key customizations
4. ⏭️ Ready to pull v0.0.114 and review changes

**This document serves as the complete snapshot of v0.0.113-namastex-9 before the v0.0.114 upgrade.**
