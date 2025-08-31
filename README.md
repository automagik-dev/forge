<p align="center">
  <a href="https://automagik.dev">
    <img src="frontend/public/forge-clear.svg" alt="Automagik Forge Logo" width="400">
  </a>
</p>

<h1 align="center">Automagik Forge</h1>
<h2 align="center">The Vibe Coding++™ Platform for Human-AI Development</h2>

<p align="center">
  <strong>🎯 Where Vibe Coding Meets Structured Execution</strong><br>
  Works with any AI coding tool through natural language, execute in isolated environments,<br>
  ship confident code with complete control and visibility
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/automagik-forge"><img alt="npm version" src="https://img.shields.io/npm/v/automagik-forge?style=flat-square&color=00D9FF" /></a>
  <a href="https://github.com/namastexlabs/automagik-forge/actions"><img alt="Build Status" src="https://img.shields.io/github/actions/workflow/status/namastexlabs/automagik-forge/test.yml?branch=main&style=flat-square" /></a>
  <a href="https://github.com/namastexlabs/automagik-forge/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/namastexlabs/automagik-forge?style=flat-square&color=00D9FF" /></a>
  <a href="https://discord.gg/automagik"><img alt="Discord" src="https://img.shields.io/discord/1234567890?style=flat-square&color=00D9FF&label=discord" /></a>
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

![Automagik Forge Dashboard](frontend/public/vibe-kanban-screenshot-overview.png)

---

## 🚀 What is Automagik Forge?

**Automagik Forge** is the vibe coding++ platform where humans stay in control. It's the structured home for your AI development tasks - plan them yourself or vibe with AI to create them, experiment with different agents to find what works, review everything before shipping. No more code that breaks in 2 weeks.

### 🎭 Vibe Coding++™ Philosophy

**Regular vibe coding problem**: You chat with AI, get code, ship it. Two weeks later? Everything breaks and you can't fix it because you let AI do everything.

**Vibe Coding++™ solution**: Perfect human-AI integration where you:

- 📋 **You Plan Tasks**: Break down work yourself or use AI to help plan
- 🏠 **Forge is Home**: All tasks live in persistent kanban, not lost in chat history or random .md files scattered across your codebase
- 🧪 **You Experiment**: Try different agents on same task - see what works best
- 🎯 **You Choose Agents**: Pick which coding agent AND specialized agent for each task
- 🔒 **Isolated Attempts**: Each attempt in its own Git worktree - no conflicts
- 👀 **You Review**: Understand what changed before merging
- 🚀 **Ship Confident Code**: Code that won't mysteriously break in 2 weeks

### 🚫 Why Regular Vibe Coding Fails

The "just let AI do it" approach creates a ticking time bomb:
- **No Structure**: Random chat conversations, no task tracking
- **No Control**: AI makes all decisions, you don't understand the code
- **No Memory**: What did we build last week? Who knows! Lost in chat history or random .md files
- **No Experimentation**: Stuck with one agent's approach
- **The 2-Week Curse**: Code works today, breaks tomorrow, unfixable forever

### ✅ The Vibe Coding++™ Solution

Forge elevates human potential - you orchestrate, AI executes:
- **You Own the Kanban**: Tasks you create, not AI's whims
- **You Pick the Agent**: Try Claude, then Gemini, see what works
- **You Choose Specialization**: Apply "test writer" or "PR reviewer" as needed
- **Multiple Attempts**: Each task can have multiple attempts with different agents
- **Git Worktree Isolation**: Every attempt isolated, no conflicts
- **You Review & Understand**: Know exactly what's changing before merge
- **MCP Control**: Create/update tasks from your coding agent without leaving your flow

---

## 🌟 Key Features

### 🤖 **Multi-Agent Orchestration**
- **Parallel Execution**: Run multiple agents simultaneously on different tasks
- **Sequential Workflows**: Chain agent tasks with dependencies
- **Agent Switching**: Seamlessly switch between Claude, Gemini, Codex, and more
- **Load Balancing**: Distribute tasks based on agent strengths

### 📋 **Smart Task Management**
- **Persistent Kanban Board**: Visual task tracking that survives sessions
- **Git Worktree Isolation**: Each task gets its own isolated Git worktree
- **Automatic Cleanup**: Smart orphaned worktree management
- **Task Templates**: Reusable task patterns for common workflows

### 🔄 **Real-Time Collaboration**
- **Live Progress Streaming**: Watch agents work in real-time via SSE
- **Diff Visualization**: See exactly what code changes agents make
- **Process Logs**: Full transparency into agent thinking and actions
- **Collaborative Review**: Built-in tools for code review and merging

### 🛡️ **Enterprise Ready**
- **GitHub Integration**: OAuth authentication and repository management
- **Security First**: Isolated execution environments for each task
- **Audit Trail**: Complete history of all agent actions
- **Self-Hostable**: Run on your infrastructure with custom GitHub OAuth

---

## 🤖 Two Types of Agents, Clear and Simple

> **The Key Distinction:**
> - **AI Coding Agents** = The AI execution platforms (CLI tools that run AI models)
> - **Specialized Agents** = Custom prompts that work with ANY coding agent
> - Example: Your "test-writer" specialized agent can run on Claude today, Gemini tomorrow

### 🛠️ AI Coding Agents Available in Forge

Forge can execute tasks using these AI coding agents - including open-source and LLM-agnostic options:

- **Claude Code** - Anthropic's Claude models
- **Claude Code Router** - LLM-agnostic, use ANY model instead of Claude
- **Cursor CLI** - Cursor's CLI agent (separate from their IDE)
- **Gemini** - Google's Gemini models
- **Codex** - OpenAI's code models
- **Amp** - Sourcegraph's code intelligence
- **OpenCode** - Open-source models, fully local execution
- **Qwen Code** - Alibaba's open-source models

**The Power:** Not locked to subscriptions - use open-source models, route to any LLM, or bring your own API keys

### 🧪 Task Attempts: Experiment Until It Works

Each task can have multiple attempts - try different approaches:

```yaml
Task: "Implement user authentication"
├── Attempt 1: Claude + "security-expert" → Too complex
├── Attempt 2: Gemini + default → Missing edge cases  
├── Attempt 3: Cursor + "auth-specialist" → Perfect! ✅
└── Result: You choose Attempt 3 to merge
```

**The Power of Attempts:**
- Each attempt runs in isolated Git worktree
- Compare different agent outputs side-by-side
- No commits until YOU approve
- Learn which agent works best for which task type

### 🎯 Specialized Agents: Your Custom Experts

Create specialized agents that enhance ANY coding agent:

```yaml
# These work with ANY AI coding agent above
specialized_agents:
  - name: "test-writer"
    prompt: "You are an expert at writing comprehensive tests. Always include edge cases..."
    # Can run on: Claude, Gemini, Cursor, or any other agent
    
  - name: "pr-reviewer" 
    prompt: "Review code for security vulnerabilities, performance issues, and patterns..."
    # Can run on: Claude, Gemini, Cursor, or any other agent
    
  - name: "automagik-forge-expert"
    prompt: "You specialize in the Automagik Forge codebase. You know..."
    # Can run on: Claude, Gemini, Cursor, or any other agent
```

---

## 📋 Vibe Coding Templates

Pre-built workflows for common development patterns:

```yaml
# Example: Code Review Template
name: "PR Review Workflow"
steps:
  - agent: claude
    task: "Review code architecture and patterns"
  - agent: gemini  
    task: "Check for security vulnerabilities"
  - agent: cursor
    task: "Suggest performance optimizations"
  - human: "Final review and merge decision"
```

**Available Templates:**
- 🔍 **Code Review**: Multi-agent PR analysis
- 🐛 **Bug Hunt**: Reproduce → Fix → Test → Document
- ✨ **Feature Dev**: Design → Implement → Test → Deploy
- 🔧 **Refactor**: Analyze → Plan → Execute → Verify
- 📚 **Documentation**: Code → Comments → README → Examples

---

## 📸 Visual Context

Attach screenshots, diagrams, or mockups to any task - agents see the visual context and generate better solutions.

---

## 📡 MCP: Remote Control from Anywhere

Automagik Forge acts as a **Model Context Protocol (MCP) server**, enabling AI coding agents to programmatically manage tasks. Control your Forge task board from your preferred AI coding agent without leaving your flow.

### Typical Workflow

1. **Planning Phase**: Use your AI agent to help brainstorm and plan tasks
2. **Task Creation**: You (or your agent) creates task cards via MCP
3. **Bug Discovery**: Find issues while coding? Add them to the backlog via MCP
4. **Status Updates**: Update task progress as work completes
5. **Cross-Agent Access**: Any MCP-compatible agent can access your task board

### Example Use Cases

- 🎯 **"Help me plan a complete authentication system with OAuth, JWT, and role-based access"** → You create epic with subtasks
- 🐛 **"Add bug: API returns 500 on malformed JSON input in /api/users endpoint"** → Create detailed bug card via MCP
- ✅ **"Mark all database migration tasks as complete and move API tasks to in-progress"** → Batch update statuses via MCP
- 📋 **"Show me all high-priority tasks that are blocked or have dependencies"** → Query tasks with filters via MCP

### Available MCP Tools

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `list_projects` | Get all projects | "List all my active projects" |
| `list_tasks` | View tasks with filters | "Show pending backend tasks" |
| `create_task` | Add new task to project | "Create task: Implement Redis caching layer" |
| `get_task` | Get detailed task info | "Show details for task-abc123" |
| `update_task` | Modify task properties | "Move task-xyz to in-review" |
| `delete_task` | Remove completed/obsolete tasks | "Delete all cancelled tasks" |

### Quick Setup

<details>
<summary><b>Getting Your Project ID</b></summary>

1. Run `npx automagik-forge` to open the UI
2. Create or select your project
3. The Project ID (UUID) appears in:
   - The browser URL: `http://localhost:3000/projects/{PROJECT_ID}/tasks`
   - The project settings panel
   - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

</details>

<details>
<summary><b>🤖 Claude Code Configuration</b></summary>

1. Open Claude Code settings
2. Navigate to MCP Servers section
3. Add Forge server configuration:

```json
{
  "mcpServers": {
    "automagik-forge": {
      "command": "npx",
      "args": ["automagik-forge", "mcp-server"],
      "env": {
        "PROJECT_ID": "your-project-uuid-here"
      }
    }
  }
}
```

4. Restart Claude Code
5. Use natural language: "Create tasks for implementing a real-time chat feature"

</details>

<details>
<summary><b>🎯 Cursor Configuration</b></summary>

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Search for "MCP" in settings
3. Add to MCP configuration:

```json
{
  "mcp.servers": {
    "automagik-forge": {
      "command": "npx",
      "args": ["automagik-forge", "mcp-server"],
      "projectId": "your-project-uuid-here"
    }
  }
}
```

4. Reload window (`Cmd/Ctrl + R`)
5. Tasks are now accessible via `@automagik-forge`

</details>

<details>
<summary><b>📝 VSCode + Cline Configuration</b></summary>

**For Cline Extension:**
1. Install Cline from VSCode marketplace
2. Open Cline settings (`Cmd/Ctrl + Shift + P` → "Cline: Settings")
3. Add MCP server:

```json
{
  "cline.mcpServers": [
    {
      "name": "automagik-forge",
      "command": "npx",
      "args": ["automagik-forge", "mcp-server"],
      "env": {
        "PROJECT_ID": "your-project-uuid-here"
      }
    }
  ]
}
```

4. Restart VSCode
5. Cline can now manage tasks directly

</details>

<details>
<summary><b>🚀 Roo Code Configuration</b></summary>

1. Open Roo Code preferences
2. Navigate to Extensions → MCP
3. Add new server:

```yaml
servers:
  automagik-forge:
    command: npx
    args: 
      - automagik-forge
      - mcp-server
    environment:
      PROJECT_ID: your-project-uuid-here
```

4. Save and restart Roo Code
5. Access via command palette: "Roo: Create Task"

</details>

<details>
<summary><b>💎 Gemini CLI Configuration</b></summary>

1. Edit Gemini CLI config file (`~/.gemini/config.json`)
2. Add MCP server entry:

```json
{
  "mcp": {
    "servers": {
      "automagik-forge": {
        "type": "stdio",
        "command": "npx",
        "args": ["automagik-forge", "mcp-server"],
        "env": {
          "PROJECT_ID": "your-project-uuid-here"
        }
      }
    }
  }
}
```

3. Run: `gemini reload-config`
4. Use: `gemini task create "Implement user dashboard with charts"`

</details>

<details>
<summary><b>🔧 Generic MCP Configuration</b></summary>

For any MCP-compatible tool, use this standard configuration:

```json
{
  "command": "npx",
  "args": ["automagik-forge", "mcp-server"],
  "env": {
    "PROJECT_ID": "your-project-uuid-here"
  }
}
```

**Tool-Specific Paths:**
- Check your tool's MCP or extensions documentation
- Look for "MCP Servers", "External Tools", or "Model Context Protocol" settings
- The configuration format is typically JSON or YAML

</details>

---

## 🎭 Vibe Coding++™ Workflows

### Human Orchestration, Not AI Automation

```mermaid
graph LR
    A[You Plan Tasks] --> B[You Choose Agents]
    B --> C[Try Multiple Attempts]
    C --> D[Compare Results]
    D --> E[You Review & Decide]
    E --> F[Ship Clean PRs]
```

### Example: Building a Feature
```bash
You: "I need a user dashboard with charts and real-time updates"

Your Process:
1. YOU create tasks (or use AI to help plan):
   ├── Task 1: Design dashboard layout
   ├── Task 2: Create chart components  
   ├── Task 3: Build WebSocket service
   ├── Task 4: Write integration tests
   └── Task 5: Generate documentation

2. YOU experiment with different agents:
   Task 2 - Chart Components:
   ├── Attempt 1: Try Claude → Too abstract
   ├── Attempt 2: Try Cursor → Good but verbose
   └── Attempt 3: Try Gemini → Perfect! ✅
   
3. YOU review and choose what to merge

The Power: You're in control, not hoping AI gets it right
```

---

## 📊 Vibe Coding vs Vibe Coding++™

| Feature | Forge (Vibe Coding++™) | Lovable (Regular Vibe Coding) |
|---------|----------------------|-------------------------------|
| **Human Control** | ✅ You orchestrate every decision | ❌ AI acts autonomously |
| **Task Persistence** | ✅ Kanban board - tasks live forever | ❌ Lost in chat conversations |
| **Multiple Attempts** | ✅ Try different agents per task | ❌ One AI, one approach |
| **8 AI Coding Agents** | ✅ Claude, Cursor CLI, Gemini, etc. | ❌ Single AI model |
| **Specialized Agents** | ✅ Custom prompts for any agent | ❌ Fixed behavior |
| **Git Worktree Isolation** | ✅ Every attempt isolated | ❌ Direct code changes |
| **MCP Server** | ✅ 6 tools for remote control | ❌ No external integration |
| **2-Week Curse Protection** | ✅ You understand the code | ❌ AI black box magic |
| **Code Review** | ✅ Review before merge | ❌ Auto-applies changes |
| **Visual Context** | ✅ Attach screenshots to tasks | ✅ Can generate images |
| **Open Source** | ✅ 100% open-source | ❌ Proprietary |
| **Pricing Model** | ✅ Free forever | 💰 Usage-based credits |
| **Self-Hostable** | ✅ Your infrastructure | ❌ Cloud-only |

---

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Authenticated AI coding agent (Claude Code, Gemini CLI, etc.)
- Git repository to work with

### Installation

```bash
# Install globally
npm install -g automagik-forge

# Or run directly with npx
npx automagik-forge
```

### First Run

```bash
# Navigate to your project
cd your-project

# Launch Forge
automagik-forge

# Open browser to http://localhost:3000
```

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Rust + Axum + Tokio | High-performance async server |
| **Frontend** | React 18 + TypeScript + Vite | Modern reactive UI |
| **Database** | SQLite + SQLx | Lightweight persistent storage |
| **Styling** | Tailwind CSS + shadcn/ui | Beautiful, consistent design |
| **Type Safety** | ts-rs | Auto-generated TypeScript from Rust |
| **Real-time** | Server-Sent Events | Live progress streaming |
| **Protocol** | MCP (Model Context Protocol) | Agent communication standard |

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AI Coding Agents                   │
│        (Claude Code, Gemini CLI, Codex, etc.)       │
└─────────────────┬───────────────────────────────────┘
                  │ MCP Protocol
                  ▼
┌─────────────────────────────────────────────────────┐
│              Automagik Forge Server                  │
│  ┌─────────────────────────────────────────────┐   │
│  │            MCP Server Module                │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │         Task Orchestration Engine           │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │       Git Worktree Manager Service          │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────┘
                  │ REST API + SSE
                  ▼
┌─────────────────────────────────────────────────────┐
│               React Frontend (Vite)                  │
│         Kanban Board + Real-time Updates            │
└─────────────────────────────────────────────────────┘
```

### Project Structure

```
automagik-forge/
├── crates/                    # Rust backend modules
│   ├── server/               # HTTP server & MCP implementation
│   ├── db/                   # Database models & migrations
│   ├── executors/            # AI agent integrations
│   ├── services/             # Business logic & git operations
│   ├── local-deployment/     # Deployment configuration
│   └── utils/                # Shared utilities
│
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # UI components (TaskCard, etc.)
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # API client & utilities
│   └── public/              # Static assets
│
├── npx-cli/                  # NPX CLI wrapper
├── scripts/                  # Build & development scripts
├── dev_assets_seed/          # Development database seed
└── shared/types.ts           # Auto-generated TypeScript types
```

---

## 📚 Documentation

### Core Concepts

#### Tasks & Workflows
Tasks are the fundamental unit of work in Forge. Each task:
- Has a unique Git worktree for isolation
- Can be assigned to specific agents
- Supports parallel or sequential execution
- Maintains full audit trail

#### Agent Executors
Executors are pluggable modules for different AI agents:
- `coding_agent_initial`: First interaction with agent
- `coding_agent_follow_up`: Continuation of conversation
- `script`: Direct script execution

#### MCP Tools
Available MCP tools for agent integration:
- `list_projects`: Get all projects
- `list_tasks`: View task queue
- `create_task`: Add new tasks
- `update_task`: Modify existing tasks
- `execute_task`: Run tasks with agents

### API Reference

#### REST Endpoints
- `GET /api/projects` - List all projects
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/execute` - Execute task with agent

#### Event Streams (SSE)
- `/api/events/processes/:id/logs` - Real-time process logs
- `/api/events/task-attempts/:id/diff` - Live diff updates

### Configuration

#### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `GITHUB_CLIENT_ID` | Build | `Ov23li9bxz3kKfPOIsGm` | GitHub OAuth client ID |
| `POSTHOG_API_KEY` | Build | Empty | Analytics API key |
| `BACKEND_PORT` | Runtime | Auto | Backend server port |
| `FRONTEND_PORT` | Runtime | `3000` | Frontend dev port |
| `HOST` | Runtime | `127.0.0.1` | Backend host |
| `DISABLE_WORKTREE_ORPHAN_CLEANUP` | Runtime | `false` | Debug flag |

#### Custom GitHub OAuth App

For self-hosting with custom branding:

1. Create GitHub OAuth App at [GitHub Settings](https://github.com/settings/developers)
2. Enable "Device Flow"
3. Set scopes: `user:email,repo`
4. Build with custom client ID:
   ```bash
   GITHUB_CLIENT_ID=your_id pnpm run build
   ```

---

## 🛠️ Development

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js 18+ and pnpm
npm install -g pnpm

# Install development tools
cargo install cargo-watch sqlx-cli
```

### Setup

```bash
# Clone repository
git clone https://github.com/namastexlabs/automagik-forge
cd automagik-forge

# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

### Building from Source

```bash
# Build production binary
./local-build.sh

# Package for NPM
cd npx-cli && npm pack

# Test locally
npx ./automagik-forge-*.tgz
```

### Testing

```bash
# Run all checks
npm run check

# Frontend checks
cd frontend && npm run lint
cd frontend && npm run format:check
cd frontend && npx tsc --noEmit

# Backend checks
cargo test --workspace
cargo fmt --all -- --check
cargo clippy --all --all-targets --all-features
```

### Database Migrations

```bash
# Create new migration
sqlx migrate add <migration_name>

# Run migrations
sqlx migrate run

# Revert migration
sqlx migrate revert
```

---

## 🗺️ Roadmap

### Phase 1: Foundation (Q1 2025) ✅
- [x] Multi-agent orchestration
- [x] Kanban task management
- [x] Git worktree isolation
- [x] MCP server implementation
- [x] Real-time progress streaming

### Phase 2: Intelligence (Q2 2025) 🚧
- [ ] Agent performance analytics
- [ ] Smart task routing based on agent strengths
- [ ] Automated code review with AI
- [ ] Context preservation between sessions
- [ ] Task dependency resolution

### Phase 3: Scale (Q3 2025) 📋
- [ ] Cloud deployment options
- [ ] Team collaboration features
- [ ] Custom agent integrations SDK
- [ ] Advanced workflow templates
- [ ] Enterprise SSO support

### Phase 4: Ecosystem (Q4 2025) 🌐
- [ ] Plugin marketplace
- [ ] Community task templates
- [ ] Integration with CI/CD pipelines
- [ ] Advanced metrics and observability
- [ ] Multi-repository orchestration

---

## 🤝 Contributing

We love contributions! However, to maintain project coherence:

1. **Discuss First**: Open an issue before starting work
2. **Align with Roadmap**: Ensure changes fit our vision
3. **Follow Standards**: Match existing code patterns
4. **Test Thoroughly**: Include tests for new features
5. **Document Well**: Update docs with your changes

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🏢 Commercial Support

### Automagik Pro
Enterprise features coming soon:
- Priority support
- Custom agent integrations
- Advanced analytics
- Team management
- SLA guarantees

### Custom Development
Need specific features? Contact us:
- Email: enterprise@namastexlabs.com
- Discord: [Join our server](https://discord.gg/automagik)

---

## 🙏 Acknowledgments

Built with love by the team at [Namastex Labs](https://namastexlabs.com).

Special thanks to:
- The Rust community for amazing async tooling
- React team for the fantastic framework
- All our early adopters and contributors
- The AI coding agent developers who inspired this project

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Website**: [automagik.dev](https://automagik.dev)
- **Documentation**: [docs.automagik.dev](https://docs.automagik.dev)
- **NPM Package**: [npmjs.com/package/automagik-forge](https://www.npmjs.com/package/automagik-forge)
- **GitHub**: [github.com/namastexlabs/automagik-forge](https://github.com/namastexlabs/automagik-forge)
- **Discord**: [discord.gg/automagik](https://discord.gg/automagik)
- **Twitter**: [@automagikdev](https://twitter.com/automagikdev)

---

<p align="center">
  <strong>🚀 Stop the 2-week curse. Start shipping code you actually understand.</strong><br>
  <strong>Vibe Coding++™ - Where Human Control Meets AI Power</strong><br><br>
  <a href="https://github.com/namastexlabs/automagik-forge">Star us on GitHub</a> • 
  <a href="https://discord.gg/automagik">Join our Discord</a> • 
  <a href="https://twitter.com/automagikdev">Follow on Twitter</a>
</p>

<p align="center">
  Made with ❤️ by <a href="https://namastexlabs.com">Namastex Labs</a>
</p>