# Developer Guide

## 🛠️ Development Setup

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
npm pack

# Test locally
npx automagik-forge
```

## 🧪 Testing

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

## 📊 Database Migrations

```bash
# Create new migration
sqlx migrate add <migration_name>

# Run migrations
sqlx migrate run

# Revert migration
sqlx migrate revert
```

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

## 📚 API Reference

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

### REST Endpoints
- `GET /api/projects` - List all projects
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/execute` - Execute task with agent

### Event Streams (SSE)
- `/api/events/processes/:id/logs` - Real-time process logs
- `/api/events/task-attempts/:id/diff` - Live diff updates

## ⚙️ Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `GITHUB_CLIENT_ID` | Build | `Ov23li9bxz3kKfPOIsGm` | GitHub OAuth client ID |
| `POSTHOG_API_KEY` | Build | Empty | Analytics API key |
| `BACKEND_PORT` | Runtime | Auto | Backend server port |
| `FRONTEND_PORT` | Runtime | `3000` | Frontend dev port |
| `HOST` | Runtime | `127.0.0.1` | Backend host |
| `DISABLE_WORKTREE_ORPHAN_CLEANUP` | Runtime | `false` | Debug flag |

### Custom GitHub OAuth App

For self-hosting with custom branding:

1. Create GitHub OAuth App at [GitHub Settings](https://github.com/settings/developers)
2. Enable "Device Flow"
3. Set scopes: `user:email,repo`
4. Build with custom client ID:
   ```bash
   GITHUB_CLIENT_ID=your_id pnpm run build
   ```

## 🤝 Contributing Guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.