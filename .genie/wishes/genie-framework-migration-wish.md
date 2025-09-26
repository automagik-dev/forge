# 🧞 GENIE FRAMEWORK MIGRATION WISH

**Status:** [READY]

## Executive Summary
Transform GENIE into a self-contained framework by migrating to `.genie/` directory structure, containing agents, wishes, and the CLI tool. This makes GENIE portable and allows Claude (and others) to use the same agent orchestration system.

## The New Structure
```
.genie/                     # GENIE FRAMEWORK (self-contained)
├── agents/                 # Agent personalities (from .claude/agents/)
│   ├── forge-coder.md
│   ├── forge-tests.md
│   ├── forge-master.md
│   └── ...
├── wishes/                 # All wishes (from /genie/wishes/)
│   ├── auth-feature-wish.md
│   ├── agent-codex-cli-wish.md
│   └── ...
├── reports/               # Death Testaments (from /genie/reports/)
├── cli/                   # The agent CLI tool
│   └── agent.js          # Single-file agent orchestrator
└── README.md             # GENIE framework documentation

.claude/                   # CLAUDE-SPECIFIC (remains)
├── commands/             # Claude commands (wish.md, forge.md, etc.)
├── hooks/                # Claude hooks
└── settings.local.json   # Claude settings
```

## Migration Plan

### Phase 1: Create .genie Structure
```bash
# Create new framework directory
mkdir -p .genie/{agents,wishes,reports,cli}

# Migrate agents
cp .claude/agents/*.md .genie/agents/

# Migrate wishes and reports
mv genie/wishes/* .genie/wishes/
mv genie/reports/* .genie/reports/
```

### Phase 2: Update Agent CLI
```javascript
// Update paths in cli/agent.js
const AGENTS_DIR = '.genie/agents';  // Was: '.claude/agents'
const WISHES_DIR = '.genie/wishes';
const REPORTS_DIR = '.genie/reports';
```

### Phase 3: Update Agent References
All agents and commands that reference paths need updating:
- `genie/wishes/` → `.genie/wishes/`
- `genie/reports/` → `.genie/reports/`
- `.claude/agents/` → `.genie/agents/`

## Why This Architecture Wins

1. **Self-Contained Framework**: GENIE becomes portable
2. **Universal Usage**: Claude uses same CLI as you
3. **Clean Separation**: GENIE framework vs Claude-specific config
4. **Future-Proof**: Can add more GENIE tools without polluting root

## The Agent CLI Integration
```javascript
#!/usr/bin/env node
// .genie/cli/agent.js

const GENIE_HOME = '.genie';
const AGENTS_DIR = `${GENIE_HOME}/agents`;
const SESSIONS_FILE = path.join(process.env.HOME, '.genie-sessions.json');

// Now both you AND Claude can:
// ./.genie/cli/agent chat forge-coder "implement feature"
```

## Success Criteria
✅ All agents migrated to `.genie/agents/`
✅ All wishes moved to `.genie/wishes/`
✅ Agent CLI works from `.genie/cli/agent.js`
✅ Claude can use the same CLI commands
✅ Clean separation between GENIE and Claude

## Implementation Steps

### Step 1: Directory Creation
```bash
mkdir -p .genie/{agents,wishes,reports,cli}
echo "# GENIE Framework" > .genie/README.md
```

### Step 2: Agent Migration
```bash
cp .claude/agents/*.md .genie/agents/
# Keep originals for now, remove after verification
```

### Step 3: Wishes/Reports Migration
```bash
mv genie/wishes/* .genie/wishes/
mv genie/reports/* .genie/reports/
rmdir genie/wishes genie/reports
```

### Step 4: CLI Installation
```bash
# Copy the agent CLI to its new home
cp cli/agent.js .genie/cli/agent.js
chmod +x .genie/cli/agent.js
```

### Step 5: Update References
- Update AGENTS.md to reference new paths
- Update CLAUDE.md agent references
- Update any hardcoded paths in agents

## Compatibility Notes

### For Claude
Claude will now use:
```bash
# Instead of Task tool
./.genie/cli/agent chat forge-coder "@.genie/wishes/feature-wish.md implement"

# Continue conversation
./.genie/cli/agent continue forge-coder "add error handling"
```

### For Humans
```bash
# Convenience alias in .bashrc/.zshrc
alias agent='./.genie/cli/agent.js'

# Then just:
agent chat forge-coder "implement auth"
```

## Future Extensions
- `.genie/templates/` - Wish and forge templates
- `.genie/knowledge/` - Shared knowledge base
- `.genie/tools/` - Additional GENIE tools
- `.genie/config.json` - GENIE-specific configuration

---

**The Result:** GENIE becomes a portable, self-contained framework that ANY AI agent (Claude, Cursor, etc.) can use for orchestration!