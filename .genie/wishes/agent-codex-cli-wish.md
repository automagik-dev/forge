# 🧞 AGENT-POWERED CODEX CLI WISH

**Status:** [READY_FOR_REVIEW]

## Executive Summary
Create a dead-simple CLI that starts Codex conversations with agent personalities from `.claude/agents/*.md`, managing sessions with natural language commands. Under 1000 lines, single file, extensible to other CLIs.

## The Vision
```bash
# Start conversation with an agent
./cli/agent chat forge-coder "implement the auth feature"
# → Loads forge-coder.md as instructions, starts Codex

# Continue the conversation
./cli/agent continue forge-coder "add OAuth support"
# → Resumes the session naturally

# List active agent sessions
./cli/agent list
# → forge-coder: implementing auth (session: abc123)
# → forge-tests: writing test suite (session: def456)

# That's it. Dead simple.
```

## Current Pain Points
- Can't resume conversations with Task tool subagents
- MCP agent server is broken/unreliable
- No way to have full conversations with specialized agents
- Too much manual prompt crafting

## Success Criteria
✅ Load agent definitions from `.claude/agents/*.md` as base instructions
✅ Start Codex conversations with agent personalities
✅ Resume conversations by agent name
✅ Natural language commands (chat, continue, list)
✅ Under 1000 lines of code
✅ Single file, no dependencies beyond Node.js/shell
✅ Extensible pattern for other CLI tools

## Technical Design

### Single File Structure (~500 lines)
```javascript
#!/usr/bin/env node
// cli/agent.js

const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const AGENTS_DIR = '.claude/agents';
const SESSIONS_FILE = path.join(process.env.HOME, '.automagik-forge/agent-sessions.json');
const PRESETS = {
  default: ['--full-auto', '-s', 'workspace-write', '-m', 'o4'],
  careful: ['--full-auto', '-s', 'read-only', '-m', 'o3'],
  fast: ['--full-auto', '-s', 'workspace-write', '-m', 'o4-mini']
};

// Load agent definition
function loadAgent(name) {
  const agentPath = path.join(AGENTS_DIR, `${name}.md`);
  if (!fs.existsSync(agentPath)) {
    console.error(`Agent '${name}' not found in ${AGENTS_DIR}`);
    process.exit(1);
  }
  return fs.readFileSync(agentPath, 'utf8');
}

// Extract session ID from Codex output
function parseSessionId(output) {
  const match = output.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
  return match ? match[1] : null;
}

// Commands
const commands = {
  chat(agent, prompt, options = {}) {
    const instructions = loadAgent(agent);
    const preset = PRESETS[options.preset || 'default'];

    // Start Codex with agent instructions
    const args = ['exec', ...preset, '-c', `base-instructions="${instructions}"`, prompt];
    const proc = spawn('codex', args, { stdio: 'inherit' });

    // Save session mapping
    proc.on('exit', () => {
      // Extract and save session ID for future resume
      saveSession(agent, parseSessionId(/* from output */));
    });
  },

  continue(agent, prompt) {
    const sessionId = getSession(agent);
    if (!sessionId) {
      console.error(`No active session for agent '${agent}'`);
      process.exit(1);
    }

    // Resume with codex exec resume
    spawn('codex', ['exec', 'resume', sessionId, prompt], { stdio: 'inherit' });
  },

  list() {
    const sessions = loadSessions();
    Object.entries(sessions).forEach(([agent, data]) => {
      console.log(`${agent}: ${data.lastPrompt || 'active'} (session: ${data.sessionId})`);
    });
  }
};

// Main CLI
const [,, command, ...args] = process.argv;

switch(command) {
  case 'chat':
    commands.chat(args[0], args[1]);
    break;
  case 'continue':
    commands.continue(args[0], args[1]);
    break;
  case 'list':
    commands.list();
    break;
  default:
    console.log(`
Usage:
  agent chat <agent-name> "<prompt>"    Start new conversation
  agent continue <agent-name> "<prompt>" Continue existing session
  agent list                             Show active sessions
  agent help                             Show this help

Available agents:
${fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md')).map(f => '  - ' + f.replace('.md', '')).join('\n')}
    `);
}
```

## Natural Language Commands

```bash
# Start a coding session
./cli/agent chat forge-coder "implement user authentication"

# Continue with the coder
./cli/agent continue forge-coder "add password reset functionality"

# Switch to test writing
./cli/agent chat forge-tests "write tests for the auth module"

# Check what's active
./cli/agent list

# Get help
./cli/agent help
```

## Session Management
- Sessions stored in `~/.automagik-forge/agent-sessions.json`
- Maps agent name → Codex session ID
- Automatic session ID extraction from Codex output
- One active session per agent (overwrites on new chat)

## Preset Vibing
```javascript
// Built-in presets for different moods
PRESETS = {
  default: ['--full-auto', '-s', 'workspace-write', '-m', 'o4'],
  careful: ['--full-auto', '-s', 'read-only', '-m', 'o3'],
  fast: ['--full-auto', '-s', 'workspace-write', '-m', 'o4-mini'],
  debug: ['--full-auto', '-s', 'read-only', '-m', 'o3', '--search']
}

// Usage
./cli/agent chat forge-coder "fix the bug" --preset careful
```

## Extensibility Pattern
```javascript
// Easy to adapt for other CLIs
const EXECUTOR = process.env.AGENT_CLI || 'codex';
const EXECUTOR_START = ['exec'];
const EXECUTOR_RESUME = ['exec', 'resume'];

// Later:
// AGENT_CLI=cursor ./cli/agent chat forge-coder "implement feature"
// AGENT_CLI=aider ./cli/agent chat forge-coder "implement feature"
```

## Why This Works
1. **Leverages existing agents** - All those carefully crafted prompts in `.claude/agents/`
2. **Natural conversation flow** - Start with agent, continue naturally
3. **Zero friction** - No UUID hunting, no complex commands
4. **Extensible** - Same pattern works for any CLI with resume capability
5. **Minimal** - Under 500 lines achieves everything needed

## Implementation Priority
1. Core commands (chat, continue, list)
2. Session persistence
3. Agent discovery/listing
4. Preset system
5. Error handling

## Validation
- Test with each forge agent
- Verify session resume works
- Confirm instructions properly passed to Codex
- Test preset switching

## Next Steps After This
- Add background execution support
- Stream logs from running sessions
- Multiple sessions per agent
- Session history/search
- Export conversations

---

**The beauty:** You (GENIE) could use this yourself to delegate to subagents with full conversations instead of one-shot Task tool calls!