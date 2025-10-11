# 🧞 CODEX NATIVE CLI ORCHESTRATOR WISH

**Status:** [DRAFT - COMPLETE REWRITE]

## Wish Discovery Summary
- **Primary analyst:** GENIE
- **Key observations:** Direct `codex exec` orchestration bypassing broken MCP; native session management in `~/.codex/sessions/`; `codex exec resume` for continuations
- **Open questions:** Shell vs Node.js for process management and session tracking
- **Human input requested:** Yes - confirm architecture for direct Codex CLI wrapper
- **Tools consulted:** Codex CLI help, native session storage, exec/resume patterns

## Executive Summary
Create a headless CLI orchestrator that wraps native Codex CLI directly, using `codex exec` for non-interactive execution with smart session management, preset configurations, and background process handling.

## Current State Analysis
- **What exists:**
  - Native `codex exec` for headless execution
  - `codex exec resume <session-id>` for continuation
  - Sessions stored in `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`
  - Session IDs are UUIDs embedded in filenames
  - `--full-auto`, `--sandbox`, `--model` flags for configuration
- **Gap identified:** No wrapper to manage sessions with human-readable names, track running processes, or apply preset configurations systematically
- **Solution approach:** Direct Codex CLI wrapper that manages sessions, names them intelligently, and handles background execution

## Change Isolation Strategy
- **Isolation principle:** Single-file wrapper in `/cli/codex-chat.js` or shell script
- **Extension pattern:** Embedded presets for different Codex configurations
- **Stability assurance:** Pure wrapper - no modifications to Codex CLI itself

## Workspace Compatibility Strategy
- Compatible with @genie/wishes/restructure-upstream-library-wish.md
- No impacts to upstream or forge infrastructure
- Enhances agent orchestration capabilities

## Success Criteria
✅ Can start new Codex conversations with `codex exec` in background
✅ Sessions mapped to human-readable names in local index
✅ Can resume sessions by name using native `codex exec resume`
✅ Preset configurations for different scenarios (forge, debug, architect)
✅ Process tracking to check if Codex is still running
✅ Log streaming from running sessions

## Never Do (Protection Boundaries)
❌ Modify Codex CLI itself
❌ Store sensitive data in session names
❌ Use interactive mode (must be headless)
❌ Depend on broken MCP server

## Technical Architecture

### Option A: Node.js Wrapper
```javascript
#!/usr/bin/env node
// cli/codex-chat.js

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Session index: maps names to Codex session IDs
const SESSION_INDEX = path.join(process.env.HOME, '.automagik-forge/codex-sessions.json');

// Presets for different use cases
const PRESETS = {
  forge: {
    model: 'o4',
    sandbox: 'workspace-write',
    flags: ['--full-auto']
  },
  debug: {
    model: 'o3',
    sandbox: 'read-only',
    flags: ['--full-auto']
  }
};

// Extract session ID from Codex output
function extractSessionId(output) {
  // Parse rollout filename for UUID
  const match = output.match(/rollout-.*?([0-9a-f-]{36})/);
  return match ? match[1] : null;
}
```

### Option B: Shell Script Wrapper
```bash
#!/bin/bash
# cli/codex-chat.sh

SESSION_INDEX="$HOME/.automagik-forge/codex-sessions.txt"
CODEX_LOG_DIR="$HOME/.automagik-forge/codex-logs"

# Start new session
start_session() {
  local name="$1"
  local prompt="$2"
  shift 2

  # Run codex exec in background, capture session ID
  codex exec "$@" "$prompt" > "$CODEX_LOG_DIR/$name.log" 2>&1 &
  local pid=$!

  # Extract session ID from output later
  echo "$name|pending|$pid" >> "$SESSION_INDEX"
}

# Resume by name
resume_session() {
  local name="$1"
  local prompt="$2"
  local session_id=$(grep "^$name|" "$SESSION_INDEX" | cut -d'|' -f2)

  codex exec resume "$session_id" "$prompt"
}
```

## Task Decomposition

### Group A – Core Wrapper Implementation
- **Goal:** Create CLI that wraps native `codex exec` with session management
- **Context to Review:** `codex exec --help`, `codex exec resume --help`, session storage patterns
- **Creates / Modifies:**
  - `cli/codex-chat.js` or `cli/codex-chat.sh` - main wrapper
  - `~/.automagik-forge/codex-sessions.json` - name-to-ID mapping
  - `~/.automagik-forge/codex-logs/` - session output logs
- **Evidence:**
  - `./cli/codex-chat start "prompt" --name wish-x` starts Codex
  - `./cli/codex-chat resume wish-x "continue"` resumes by name
  - `./cli/codex-chat list` shows all sessions with names
- **Dependencies:** None
- **Hand-off Notes:** Direct Codex CLI orchestration working

## CLI Interface Design

### Core Commands (Direct Codex Wrapper)
```bash
# Start new Codex conversation
./cli/codex-chat start "implement feature X" \
  --name "wish-feature-x" \
  --preset forge
# Runs: codex exec --full-auto -m o4 -s workspace-write "implement feature X"
# Saves session ID mapped to name

# Resume conversation by name
./cli/codex-chat resume wish-feature-x "add error handling"
# Finds session ID, runs: codex exec resume <uuid> "add error handling"

# Start in background (returns immediately)
./cli/codex-chat start "debug issue" --name debug-1 --background
# Returns PID for monitoring

# Check if still running
./cli/codex-chat status debug-1
# Shows: Running (PID 12345) or Completed

# View output
./cli/codex-chat logs debug-1 [--follow]

# List all named sessions
./cli/codex-chat list
# Shows: name | session-id | status | created

# Get raw session ID for manual operations
./cli/codex-chat get-id wish-feature-x
# Returns: 0199782d-159d-7541-99bd-1b0524d8bda1
```

### Preset Configurations
```javascript
const PRESETS = {
  forge: {
    description: "Automagik Forge task execution",
    args: ['--full-auto', '-m', 'o4', '-s', 'workspace-write']
  },
  debug: {
    description: "Debugging and investigation",
    args: ['--full-auto', '-m', 'o3', '-s', 'read-only']
  },
  architect: {
    description: "System design and planning",
    args: ['--full-auto', '-m', 'o3', '-s', 'read-only', '--include-plan-tool']
  },
  quick: {
    description: "Quick tasks with fast model",
    args: ['--full-auto', '-m', 'o4-mini', '-s', 'workspace-write']
  }
};
```

### Session Index Schema
```javascript
// ~/.automagik-forge/codex-sessions.json
{
  "sessions": {
    "wish-feature-x": {
      "sessionId": "0199782d-159d-7541-99bd-1b0524d8bda1",
      "created": "2025-09-26T12:00:00Z",
      "lastUsed": "2025-09-26T12:30:00Z",
      "preset": "forge",
      "pid": null,  // Set when running in background
      "logFile": "~/.automagik-forge/codex-logs/wish-feature-x.log"
    },
    "debug-auth-issue": {
      "sessionId": "5b63d0e3-b29c-4670-8a5c-247eebd0fb57",
      "created": "2025-09-26T13:00:00Z",
      "lastUsed": "2025-09-26T13:15:00Z",
      "preset": "debug",
      "pid": 12345,  // Still running
      "logFile": "~/.automagik-forge/codex-logs/debug-auth-issue.log"
    }
  }
}
```

## Implementation Strategy

### Key Implementation Points

1. **Session ID Extraction**
   - Parse Codex output to find session UUID from rollout filename
   - Store mapping immediately after `codex exec` starts

2. **Background Execution**
   - Use `&` in shell or `spawn(..., {detached: true})` in Node.js
   - Redirect output to log files for later viewing
   - Track PID for status checking

3. **Resume Logic**
   - Look up session ID from name mapping
   - Call `codex exec resume <uuid> "prompt"`
   - Update last-used timestamp

4. **Log Management**
   - Each session gets its own log file
   - Support streaming with `tail -f` or fs.watch()
   - Clean up old logs periodically

## Validation Playbook
- Test new session creation with various presets
- Verify continuation with correct conversation ID
- Confirm session listing and search functionality
- Validate timeout handling for long operations
- Test preset override behavior

## Open Questions & Assumptions
1. **Language choice:** Node.js vs Shell script for wrapper?
2. **Session naming:** Manual only or auto-generate from prompt?
3. **Storage location:** `~/.automagik-forge/` or elsewhere?
4. **Output handling:** Stream to console or only to log files?
5. **Error recovery:** How to handle crashed Codex processes?

## Blocker Protocol
If Codex CLI behavior changes or session ID extraction fails:
- Document new output format
- Update regex patterns for session ID extraction
- Test with different Codex versions

## Status Log
- **2025-09-26 14:30** - Initial wish drafted (MCP-based approach)
- **2025-09-26 14:45** - COMPLETE REWRITE for direct Codex CLI wrapper
- **Current** - Native `codex exec` wrapper bypassing broken MCP