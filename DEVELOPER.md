# Developer Guide

Welcome to the Automagik Forge development guide. This document provides comprehensive instructions for setting up your development environment, understanding the architecture, and contributing to the project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Development Workflow](#development-workflow)
- [Cross-Repo Development (forge-core)](#cross-repo-development-forge-core)
- [Testing](#testing)
- [Building](#building)
- [Database Operations](#database-operations)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Node.js 18+** - JavaScript runtime
- **pnpm 8+** (tested with 10.12.4) - Package manager
- **Rust 1.70+** - Backend language (install via [rustup](https://rustup.rs/))
- **Git** - Version control
- **SQLite** - Database (usually pre-installed on most systems)

### Optional Tools

- **sqlx-cli** - For database migrations
  ```bash
  cargo install sqlx-cli --no-default-features --features sqlite
  ```

---

## Development Setup

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/namastexlabs/automagik-forge.git
cd automagik-forge

# 2. (Optional) Copy .env.example to .env for custom port configuration
cp .env.example .env

# 3. Start development environment
make dev
```

That's it! The `make dev` command automatically:
- Checks and installs cargo/cargo-watch if needed
- Initializes git submodules
- Installs pnpm dependencies
- Creates and seeds the database
- Builds the frontend
- Starts both backend and frontend with hot reload

The application will be available at `http://localhost:3000` (or your custom port from .env).

### Alternative: Manual Commands

If you prefer manual control:

```bash
# Install dependencies
pnpm install

# Start both servers
pnpm run dev

# Or start individually
npm run frontend:dev    # Frontend only (port 3000)
npm run backend:dev     # Backend only (port auto-assigned)
```

---

## Architecture Overview

### Tech Stack

- **Backend**: Rust with Axum web framework, Tokio async runtime, SQLx for database
- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui components
- **Database**: SQLite with SQLx migrations
- **Type Sharing**: ts-rs generates TypeScript types from Rust structs
- **MCP Server**: Built-in Model Context Protocol server for AI agent integration
- **Desktop App**: Tauri framework for native desktop application

### Project Structure

```
automagik-forge/
├── upstream/                      # Git submodule (vibe-kanban template)
│   └── crates/
│       ├── server/               # Axum HTTP server, API routes, MCP server
│       ├── db/                   # Database models, migrations, SQLx queries
│       ├── executors/            # AI coding agent integrations
│       ├── services/             # Business logic (GitHub, auth, git operations)
│       ├── local-deployment/     # Local deployment logic
│       └── utils/                # Shared utilities
├── forge-extensions/             # Forge-specific extensions
│   ├── config/                   # Configuration management
│   └── omni/                     # Omni integration features
├── forge-app/                    # Main Forge application binary
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/                 # API client, utilities
│   └── public/                  # Static assets
├── scripts/                      # Build and utility scripts
│   └── rebrand.sh               # Mechanical rebrand script
├── dev_assets_seed/             # Database seed data
├── shared/types.ts              # Auto-generated TypeScript types
└── Cargo.toml                   # Rust workspace configuration
```

### Key Architectural Patterns

#### 1. **Upstream Template + Extensions Pattern**

Automagik Forge is built on top of the vibe-kanban template using a mechanical rebranding approach:

- `upstream/` - Git submodule pointing to namastexlabs/vibe-kanban fork
- `scripts/rebrand.sh` - Converts all vibe-kanban references to automagik-forge
- `forge-extensions/` - Real Forge-specific features (omni, config)
- Minimal `forge-overrides/` - Only feature files, no branding

This allows us to stay in sync with upstream improvements while maintaining our unique features.

#### 2. **Event Streaming via SSE**

Real-time updates use Server-Sent Events:
- Process logs stream to frontend via `/api/events/processes/:id/logs`
- Task diffs stream via `/api/events/task-attempts/:id/diff`
- Managed by `EventStreamManager` service

#### 3. **Git Worktree Isolation**

Each task execution gets an isolated git worktree:
- Managed by `WorktreeManager` service (upstream/crates/services/src/services/worktree_manager.rs)
- Automatic cleanup of orphaned worktrees
- Environment variable `DISABLE_WORKTREE_ORPHAN_CLEANUP` to disable cleanup

#### 4. **Executor Pattern**

Pluggable AI agent executors:
- Each executor (Claude Code, Gemini, etc.) implements common interface
- Actions: `coding_agent_initial`, `coding_agent_follow_up`, `script`
- Profiles defined in `upstream/crates/executors/default_profiles.json`

#### 5. **MCP Integration**

Automagik Forge acts as MCP server:
- Tools: `list_projects`, `list_tasks`, `create_task`, `update_task`, `delete_task`, `get_task`, `create_task_and_start`, `get_task_attempt`
- Implementation: `upstream/crates/server/src/mcp/task_server.rs`
- AI agents can manage tasks via MCP protocol

### API Patterns

- REST endpoints under `/api/*`
- Server-Sent Events (SSE) under `/api/events/*`
- MCP server runs via stdio (invoked as `npx automagik-forge mcp-server`)

---

## Development Workflow

### Branch Strategy

- `dev` - Main development branch (where you should base your work)
- Feature branches → `dev` via Pull Request
- Stable releases: `dev` → `main`

### Making Changes

1. **Create feature branch from `dev`:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code patterns in the existing codebase

3. **Test your changes** (see [Testing](#testing) section)

4. **Commit with clear messages:**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create PR targeting `dev` branch
   ```

---

## Testing

### Frontend Tests

```bash
cd frontend

# Lint TypeScript/React code
npm run lint

# Check formatting
npm run format:check

# TypeScript type checking
npx tsc --noEmit

# Run all frontend checks
npm run check
```

### Backend Tests

```bash
# Run all Rust tests
cargo test --workspace

# Test specific crate
cargo test -p forge-server

# Run specific test
cargo test test_name

# Check Rust formatting
cargo fmt --all -- --check

# Run Clippy linter
cargo clippy --all --all-targets --all-features -- -D warnings
```

### Full Validation

```bash
# Run all checks (frontend + backend)
npm run check
```

---

## Building

### Development Build

```bash
# Build Rust workspace
cargo build --workspace

# Build frontend
cd frontend && pnpm build
```

### Production Build

```bash
# Build NPM package (includes frontend + backend)
./build-npm-package.sh
```

This script:
1. Builds the Rust backend
2. Builds the React frontend
3. Packages everything for NPM distribution

### Type Generation

After modifying Rust types that are used in the frontend:

```bash
# Regenerate TypeScript types from Rust structs
npm run generate-types

# Verify types are up to date
npm run generate-types:check
```

---

## Database Operations

### Migrations

Forge uses SQLx for database migrations:

```bash
# Apply all pending migrations
sqlx migrate run

# Create new migration
sqlx migrate add <migration_name>

# Revert last migration
sqlx migrate revert
```

### Seed Data

Development database is automatically seeded from `dev_assets_seed/` on first run.

To reset the database:
```bash
rm -rf ~/.local/share/automagik-forge/  # Linux
# or
rm -rf ~/Library/Application\ Support/automagik-forge/  # macOS

# Restart dev server to recreate and reseed
pnpm run dev
```

---

## Cross-Repo Development (forge-core)

When you need to modify `forge-core` (the library that automagik-forge depends on), use the dev-core workflow.

**Quick commands:**
```bash
make dev-core BRANCH=feat/my-feature  # Enable local forge-core development
make dev-core-off                     # Disable, restore git deps
make status                           # Show current mode & branch status
```

**📖 Complete guide:** See [docs/DUAL_REPO_WORKFLOW.md](docs/DUAL_REPO_WORKFLOW.md)

This guide covers:
- Step-by-step workflow for forge-core changes
- Automated tag creation and cross-repo sync
- Branch matching enforcement
- Troubleshooting common issues
- PR creation sequence and version management

---

## Common Development Tasks

### Adding a New API Endpoint

1. Define route handler in `upstream/crates/server/src/routes/<module>.rs`
2. Add route to router in `upstream/crates/server/src/main.rs`
3. Update API client in `frontend/src/lib/api.ts`
4. Add TypeScript types in `shared/types.ts` or regenerate with `npm run generate-types`

### Adding a New Database Model

1. Create model struct in `upstream/crates/db/src/models/<model>.rs`
2. Add database migration in `upstream/crates/db/migrations/`
3. Run migration: `sqlx migrate run`
4. Update seed data if needed in `dev_assets_seed/`

### Adding a New Executor

1. Add executor profile to `upstream/crates/executors/default_profiles.json`
2. Implement executor interface in `upstream/crates/executors/src/`

### Updating from Upstream

When the vibe-kanban template releases a new version:

```bash
# Automated (recommended)
mcp__genie__run agent="utilities/upstream-update" prompt="Update to v0.0.106"

# Manual process (see README.md "Upstream Management" section)
```

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm run dev
```

### SQLx Compilation Errors

If you get SQLx compilation errors:
```bash
# Ensure database is created and migrated
sqlx database create
sqlx migrate run

# Prepare SQLx offline data
cargo sqlx prepare --workspace
```

### Git Worktree Issues

If you encounter worktree-related errors:
```bash
# List all worktrees
git worktree list

# Remove specific worktree
git worktree remove <path>

# Prune stale worktrees
git worktree prune
```

### Rust Build Fails

```bash
# Clean build artifacts
cargo clean

# Update Rust toolchain
rustup update

# Rebuild
cargo build --workspace
```

### Frontend Build Issues

```bash
# Clean node_modules and reinstall
rm -rf node_modules frontend/node_modules
pnpm install

# Clear Vite cache
cd frontend
rm -rf node_modules/.vite
```

---

## Additional Resources

- **Main README**: [README.md](README.md) - Project overview and quick start
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- **Upstream CLAUDE.md**: [upstream/CLAUDE.md](upstream/CLAUDE.md) - Detailed technical docs
- **API Documentation**: Explore `/api/*` endpoints in browser dev tools
- **Discord**: [Join our community](https://discord.gg/xcW8c7fF3R)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check [GitHub Issues](https://github.com/namastexlabs/automagik-forge/issues)
2. Ask in [Discord](https://discord.gg/xcW8c7fF3R)
3. Review [upstream/CLAUDE.md](upstream/CLAUDE.md) for detailed technical information

Happy coding! 🚀
