# 🧞 GENIE Framework for Automagik Forge

**The Universal Agent Orchestration Framework**

GENIE is a self-contained framework for managing AI agent conversations, wishes, and orchestration. It works with any AI system (Claude, Cursor, etc.) and provides consistent tooling for agent management.

## Structure

```
.genie/
├── agents/          # Agent personalities (implementor, tests, qa, polish, etc.)
├── wishes/          # Structured development wishes
├── reports/         # Done Reports and execution reports
├── cli/            # Command-line tools
│   └── genie.ts    # Universal agent conversation manager
└── knowledge/      # Shared knowledge base
```

## Quick Start

### Using MCP Genie Tools

Start a conversation with any agent:
```
Use mcp__genie__run with:
- agent: "specialists/implementor"
- prompt: "implement authentication for Automagik Forge"
```

Continue the conversation:
```
Use mcp__genie__resume with:
- sessionId: "<sessionId>"
- prompt: "add OAuth support"
```

List active sessions:
```
Use mcp__genie__list_sessions
```

### Available Agents

**Core Workflow:**
- **plan** - Product planning orchestrator
- **wish** - Wish creation agent
- **forge** - Execution breakdown agent
- **review** - QA validation agent

**Delivery Specialists:**
- **implementor** - Feature implementation for Forge (Rust/React/SQLx)
- **tests** - Test writing expert (Rust unit/integration + Frontend Vitest)
- **qa** - Quality assurance and validation
- **polish** - Code quality enforcement (Rust: clippy/rustfmt, TS: ESLint/Prettier)
- **self-learn** - Behavioral learning and improvement
- **forge-hooks** - Claude hooks configuration specialist

**Strategic Utilities:**
- **twin** - Pressure-testing, second opinions, consensus building
- **analyze** - System architecture audit
- **debug** - Root cause investigation
- **thinkdeep** - Extended reasoning
- **consensus** - Decision facilitation
- **challenge** - Assumption breaking

**Tactical Utilities:**
- **codereview** - Diff/file review
- **refactor** - Refactor planning
- **testgen** - Test generation
- **docgen** - Documentation generation
- **secaudit** - Security audit
- **tracer** - Instrumentation planning
- **commit** - Commit message generation

**Infrastructure:**
- **git-workflow** - Git operations
- **project-manager** - Task coordination
- **bug-reporter** - Bug triage & filing
- **learn** - Meta-learning for framework improvements
- **sleepy** - Autonomous wish coordinator

### For AI Agents (Claude, etc.)

Instead of using one-shot Task tools, use MCP Genie tools for full conversations:

```
# Start implementing a wish
Use mcp__genie__run with:
- agent: "specialists/implementor"
- prompt: "@.genie/wishes/auth-wish.md implement Group A"

# Continue with error handling
Use mcp__genie__resume with:
- sessionId: "<sessionId>"
- prompt: "tests failing, debug the issue"
```

## Conventions

### Wishes
- Stored in `.genie/wishes/`
- Named as `<feature>-wish.md`
- Contain structured implementation plans

### Reports
- Done Reports in `.genie/reports/`
- Named as `done-<agent>-<slug>-<YYYYMMDDHHmm>.md`
- Document execution evidence and risks

### Agents
- Defined in `.genie/agents/`
- Markdown files with structured prompts
- Loaded as Codex base instructions

## Configuration

Agents configure their execution environment via two independent settings in YAML frontmatter:

### Sandbox (File System Access)
- **read-only** - Read files only (analysis, review agents)
- **workspace-write** - Read/write in workspace (default, implementation agents)
- **danger-full-access** - Full system access (rare, externally sandboxed only)

### Approval Policy (Human Interaction)
- **never** - No approvals (fully automated)
- **on-failure** - Ask when commands fail (default)
- **on-request** - Ask for risky operations (interactive)
- **untrusted** - Ask for everything (high-security)

### Agent Front Matter Reference

Each file in `.genie/agents/` can override executor behaviour by adding a YAML
front matter block. The CLI loads that block, merges it with `config.yaml`, and
translates it to `npx -y @namastexlabs/codex@0.43.0-alpha.5 exec` flags. The structure is:

```yaml
---
name: my-agent
description: Optional prompt summary
genie:
  executor: codex            # Which executor profile to use (defaults to `codex`)
  background: false          # Force foreground (otherwise inherits CLI default)
  binary: npx                # Override executable name if needed
  packageSpec: "@namastexlabs/codex@0.43.0-alpha.5"
  sessionsDir: .genie/state/agents/codex-sessions
  sessionExtractionDelayMs: 2000
  exec:
    fullAuto: true           # --full-auto
    model: gpt-5-codex       # -m
    sandbox: workspace-write # -s
    profile: null            # -p
    includePlanTool: true    # --include-plan-tool
    search: true             # --search
    skipGitRepoCheck: true   # --skip-git-repo-check
    json: false              # --json
    experimentalJson: true   # --experimental-json
    color: never             # --color
    cd: null                 # -C <path>
    outputSchema: null       # --output-schema
    outputLastMessage: null  # --output-last-message
    reasoningEffort: high    # -c reasoning.effort="high"
    images: []               # -i <path> for each entry
    additionalArgs: []       # Raw flags appended verbatim
  resume:
    includePlanTool: true
    search: true
    last: false              # --last when resuming
    additionalArgs: []
---
```

Supported keys are derived from the codex executor defaults
in the Genie CLI source code. Any value omitted in front matter keeps
the executor default. Unknown keys under `genie.exec` become additional `npx ...
exec` overrides, so the safest pattern is to use the fields above. Put extra
flags in `additionalArgs` to avoid accidentally shadowing future options.

## Automagik Forge Integration

### Tech Stack
- **Backend**: Rust (Axum, SQLx, Tokio)
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite with SQLx migrations
- **Type Sharing**: ts-rs generates TypeScript types from Rust
- **MCP Server**: Built-in Model Context Protocol server

### Development Commands
```bash
# Start dev servers
pnpm run dev

# Run tests
cargo test --workspace -q    # Rust tests
pnpm test                    # Frontend tests

# Quality checks
cargo clippy --all --all-targets --all-features -- -D warnings
pnpm run check
```

### Forge-Specific Workflows

1. **Product Planning**: `/plan` - Discovery, roadmap sync, context gathering
2. **Wish Creation**: `/wish` - Convert planning to structured wish document
3. **Execution**: `/forge` - Break wish into execution groups, spawn specialists
4. **Implementation**: Use `mcp__genie__run` with agent "specialists/implementor" and prompt "@.genie/wishes/<slug>-wish.md Group A"
5. **Testing**: Use `mcp__genie__run` with agent "specialists/tests" and prompt "@.genie/wishes/<slug>-wish.md"
6. **QA**: Use `mcp__genie__run` with agent "specialists/qa" and prompt "@.genie/wishes/<slug>-wish.md"
7. **Polish**: Use `mcp__genie__run` with agent "specialists/polish" and prompt "@.genie/wishes/<slug>-wish.md"
8. **Review**: `/review` - Validate completion, generate QA report
9. **Commit**: `/commit` - Generate commit message

## Integration

### With Claude
Claude continues to use its specific configuration in `.claude/` but leverages GENIE for agent orchestration.

### With Other Systems
Copy the `.genie/` directory to any project to enable GENIE orchestration.

## Future Extensions

- Session history and search
- Background execution monitoring
- Multi-session per agent support
- Conversation export and analysis

---

*GENIE: Making agent orchestration magical for Automagik Forge* 🧞✨
