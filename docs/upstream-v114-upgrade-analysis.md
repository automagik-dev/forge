# Upstream v0.0.114 Upgrade Journey - Process Enhancement Analysis

**Date**: 2025-11-03
**Upgrading From**: v0.0.113-namastex-9 (commit: `2fab7d49`)
**Upgrading To**: v0.0.114-20251031170655 (commit: `4ded30b5`)
**Purpose**: Document the upgrade journey and identify enhancements needed for the upstream-update agent

---

## Current Status

✅ **Step 1 Complete**: Verified namastex-9 state
- Created snapshot: `docs/upstream-v113-namastex-9-snapshot.md`
- Confirmed main === release/v0.0.113-namastex-9
- Documented all namastex version history (1-9)

✅ **Step 2 Complete**: Prepared for upgrade
- Created backup branch: `namastex-9-backup` (safe copy of our work)
- Created upstream branch: `upstream-114` (clean v0.0.114)
- **Temporarily replaced main**: Now pointing to clean v0.0.114

**Safety Net**: `namastex-9-backup` branch contains our last known good state

---

## Upstream Changes (v0.0.113 → v0.0.114)

### Git Log Summary
```
4ded30b5 chore: bump version to 0.0.114
1c0dfc1c detect when the conversation has been reset correctly (#1150)
f21b9037 PORT environment variable support (#1142)
e8ff40d5 Remote host + username opening for VSCode based IDEs (#1134)
e7cc1163 move deps to correct sub-module (#1133)
65a35446 review markdown max height 40vh with scroll (#1130)
ab07116e prevent draft restoration logic overwriting message (#1127)
1183f099 Update status position (#1124)
0e2653a2 Pre release doesn't update lockfile (#1123)
```

### Files Changed (35 files, +387/-83 lines)

**Key Areas**:
1. **Version Bumps**: All Cargo.toml files → 0.0.114
2. **PORT Support**: `scripts/setup-dev-environment.js` - PORT env var
3. **SSH/Remote Support**:
   - `frontend/src/hooks/useOpenInEditor.ts`
   - `frontend/src/pages/settings/GeneralSettings.tsx`
   - New settings for remote host/username
4. **Conversation Fixes**:
   - `frontend/src/hooks/useConversationHistory.ts` - reset detection
   - `frontend/src/hooks/follow-up/useDraftEditor.ts` - draft restoration
5. **UI Improvements**: DiffCard, review section max-height

---

## Our Customizations to Preserve

### 1. Advanced MCP Tools (CRITICAL)
**File**: `crates/server/src/mcp/advanced_tools.rs` (466 lines)
**Status**: DOES NOT EXIST in upstream v0.0.114
**Action**: MUST re-add from namastex-9-backup

**Tools Provided**:
- Task Attempts (25 tools)
- Execution Processes (3 tools)
- Images (2 tools)
- Filesystem (2 tools)
- Config (2 tools)
- Drafts (5 tools)
- Containers (2 tools)
- Forge-Specific (8 tools)

**Integration Point**: `crates/server/src/mcp/mod.rs` references it
**Task Server**: `crates/server/src/mcp/task_server.rs` uses the tools

### 2. MCP Configuration
**File**: `crates/executors/default_mcp.json`

**Our Version (namastex-9)**:
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

**Upstream Version (v0.0.114)**:
```json
{
  "vibe-kanban": {
    "command": "npx",
    "args": ["-y", "vibe-kanban@latest", "--mcp"],
    "env": {}
  }
}
```

**Action**: MUST replace with our version + rebrand

### 3. Notification Sounds
**Files**:
- `assets/sounds/genie-notify-1.wav` (384KB) - OUR custom sound
- `assets/sounds/genie-notify-2.wav` (384KB) - OUR custom sound
- `assets/sounds/cow-mooing.wav` (414KB) - UPSTREAM default
- `assets/sounds/rooster.wav` (204KB) - UPSTREAM default

**Current State**: Main (v0.0.114) has cow/rooster sounds
**Action**: MUST replace with genie sounds

### 4. Executor Profiles
**File**: `crates/executors/default_profiles.json`

**Status**: Both versions have DEFAULT profiles only
**Our Version**: Already clean (reverted in namastex-5)
**Upstream Version**: Also clean
**Action**: ✅ NO changes needed (already aligned)

**Note**: MASTER, WISH, FORGE, REVIEW profiles belong in parent repo, not upstream

### 5. Branding
**Files Changed in namastex-9**:
- `CLAUDE.md` - "Namastex Labs" vs "Bloop AI"
- `README.md` - Automagik Forge vs Vibe Kanban
- `CODE-OF-CONDUCT.md` - Contact emails
- `docs/agents/*.mdx` - Agent descriptions

**Current State**: Main (v0.0.114) has Bloop AI branding
**Action**: MUST rebrand (can use existing `scripts/rebrand.sh`)

---

## Branches Status

```
main                          → 4ded30b5 (clean v0.0.114) [TEMPORARY]
namastex-9-backup             → 2fab7d49 (our v0.0.113-namastex-9) [SAFETY NET]
upstream-114                  → 4ded30b5 (clean v0.0.114)
release/v0.0.113-namastex-9   → 2fab7d49 (previous release) [ARCHIVED]
```

**Next**: Apply rebrand + restore custom assets → create v0.0.114-namastex-1

---

## Ready for Next Steps

We have successfully:
1. ✅ Verified namastex-9 state (documented in `upstream-v113-namastex-9-snapshot.md`)
2. ✅ Created safety backup (`namastex-9-backup` branch)
3. ✅ Temporarily replaced `main` with clean v0.0.114
4. ✅ Analyzed what customizations need to be preserved

**What's needed to complete the upgrade:**
- Apply mechanical rebrand
- Restore advanced_tools.rs
- Restore default_mcp.json
- Restore genie notification sounds
- Verify build & tests
- Create v0.0.114-namastex-1 release + branch

**Ready to proceed when you give the signal.**
