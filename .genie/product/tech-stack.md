# Automagik Forge Technical Stack

## Backend
- Language: Rust (1.83+)
- Web Framework: Axum 0.8+
- Async Runtime: Tokio 1.0+
- Database: SQLite with SQLx
- ORM/Query Builder: SQLx (compile-time checked queries)
- Type Sharing: ts-rs (Rust → TypeScript codegen)
- MCP Server: Built-in Model Context Protocol server

## Frontend
- Framework: React 18+
- Language: TypeScript 5+
- Build Tool: Vite 6+
- Package Manager: pnpm 10+
- Node Version: 18+ LTS
- CSS Framework: Tailwind CSS
- UI Components: shadcn/ui
- Icons: Lucide React components
- Import Strategy: ES modules

## AI Agent Integration
- MCP (Model Context Protocol) server built-in
- 8 AI coding agent executors: Claude Code, Cursor CLI, Gemini, Codex, Amp, OpenCode, Qwen Code, Claude Router
- Specialized agent prompts stored as markdown templates in `.genie/agents/`

## Task Orchestration
- Git worktree management for isolated task execution
- Server-Sent Events (SSE) for real-time log streaming
- SQLite database with task/project models

## Forge Extensions
- `forge-app/`: Extended Axum binary composing upstream + extensions
- `forge-extensions/`: Extension crates (omni, branch-templates, config)
- `forge-overrides/`: Source-level overrides for upstream frontend/app code

## Monorepo Structure
```
crates/              # Rust workspace (upstream via submodule)
├── server/          # Axum HTTP server, API routes, MCP server
├── db/              # SQLx models and migrations
├── executors/       # AI agent integrations
├── services/        # Business logic (GitHub auth, git ops, worktree mgmt)
├── utils/           # Shared utilities
├── deployment/      # Deployment configurations
└── local-deployment/# Local development setup

forge-app/           # Forge-specific Axum binary
forge-extensions/    # Extension crates (omni, branch-templates, config)
forge-overrides/     # Source overrides for upstream

frontend/            # React app (upstream mirror)
frontend-forge/      # Forge-specific frontend extensions

shared/              # Generated TypeScript types
├── types.ts         # From server crate
└── forge-types.ts   # From forge-app

upstream/            # Git submodule (read-only base template)
npx-cli/             # Published npm CLI package
scripts/             # Dev helpers (ports, build, regression)
```

## Architecture Patterns

### Core Patterns
- **Event Streaming**: Server-Sent Events (SSE) for real-time updates
- **Git Isolation**: Per-task worktrees via `WorktreeManager` service
- **Executor Pattern**: Pluggable AI agents (Claude, Gemini, etc.)
- **API Style**: REST with SSE for real-time updates
- **Authentication**: GitHub OAuth (device flow)

### Automagik Forge-Specific Patterns

1. **Upstream Overlay Architecture**
   - `upstream/` submodule contains base Genie template (read-only)
   - `forge-extensions/` adds Forge-specific services
   - `forge-overrides/` patches upstream frontend/app at build time
   - Build-time composition via `./local-build.sh`

2. **Dual Type Generation**
   - Core types: `cargo run -p server --bin generate_types` → `shared/types.ts`
   - Forge extensions: `cargo run -p forge-app --bin generate_forge_types` → `shared/forge-types.ts`
   - CI validates with `-- --check` flag

3. **Multi-Executor Support**
   - 8 AI coding agents: Claude Code, Cursor CLI, Gemini, Codex, Amp, OpenCode, Qwen Code, Claude Router
   - Pluggable via executor pattern
   - Each executor wraps specific AI platform (API or CLI)

## Development

### Tooling
- Version Control: Git with worktree isolation
- Linting (Rust): cargo clippy
- Formatting (Rust): cargo fmt (rustfmt)
- Linting (TypeScript): ESLint
- Formatting (TypeScript): Prettier
- Type Checking: TypeScript compiler + ts-rs codegen
- Database Migrations: SQLx migrations
- Testing (Rust): cargo test
- Testing (Frontend): Vitest (as needed)

### Development Commands
```bash
# Start development servers
pnpm run dev                                             # Both frontend + backend
pnpm --filter frontend run dev -- --host --port 3000     # Frontend only
pnpm --filter frontend-forge run dev -- --host --port 3001  # Forge overlay UI
BACKEND_PORT=$(node scripts/setup-dev-environment.js backend) \
  cargo watch -w forge-app -x 'run -p forge-app --bin forge-app'   # Backend watch

# Testing & Validation
cargo test --workspace                                   # Rust tests
cargo clippy --all --all-targets --all-features -- -D warnings  # Linting
cargo fmt --all -- --check                              # Format check

pnpm --filter frontend run lint                         # Frontend lint
pnpm --filter frontend run format:check                 # Frontend format
pnpm --filter frontend exec tsc --noEmit                # Frontend types

pnpm --filter frontend-forge run lint                   # Forge overlay lint
pnpm --filter frontend-forge run format:check           # Forge overlay format
pnpm --filter frontend-forge exec tsc --noEmit          # Forge overlay types

# Type Generation
cargo run -p server --bin generate_types                # Core types
cargo run -p server --bin generate_types -- --check     # CI validation
cargo run -p forge-app --bin generate_forge_types       # Forge types
cargo run -p forge-app --bin generate_forge_types -- --check  # CI validation

# Database
sqlx migrate run                                        # Apply migrations
```

### Forge-Specific Development
- Build script: `./local-build.sh` (composes upstream + forge extensions)
- Regression harness: `./scripts/run-forge-regression.sh`
- Port management: `scripts/setup-dev-environment.js`
- NPM packaging: `pnpm pack --filter npx-cli`
- Database seeding: `dev_assets_seed/` → `dev_assets/` on dev start

## Deployment
- CI/CD Platform: GitHub Actions
- Build Command: `./local-build.sh`
- Package Distribution: npm registry (npx-cli)
- Binary Packaging: Cross-platform (Linux, macOS, Windows)
- Database: SQLite (bundled, seeded from dev_assets_seed/)

## Environment Variables

### Standard Variables
- `HOST`: 127.0.0.1 (default)
- `BACKEND_PORT`: Auto-assigned via scripts/setup-dev-environment.js
- `FRONTEND_PORT`: 3000 (default)
- `GITHUB_CLIENT_ID`: Optional (for custom GitHub OAuth)
- `POSTHOG_API_KEY`: Optional (analytics)

### Forge-Specific Variables
- `DISABLE_WORKTREE_ORPHAN_CLEANUP`: Debug flag for worktree management

## Key Dependencies

### Rust Crates
- axum (web framework)
- tokio (async runtime)
- sqlx (database)
- serde, serde_json (serialization)
- ts-rs (TypeScript generation)
- reqwest (HTTP client)
- anyhow, thiserror (error handling)

### Frontend Packages
- react, react-dom
- @tanstack/react-query (data fetching)
- tailwindcss (styling)
- shadcn/ui components
- vite (build tool)
- @ebay/nice-modal-react (modal management)

### Development Tools
- pnpm (package manager)
- cargo (Rust build)
- SQLx CLI (migrations)
- TypeScript compiler

## Testing

### Rust Testing
```bash
cargo test --workspace                                   # All tests
cargo test -p <crate>                                    # Specific crate
cargo test <test_name>                                   # Specific test
```

### Frontend Testing
```bash
pnpm --filter frontend run lint
pnpm --filter frontend run format:check
pnpm --filter frontend exec tsc --noEmit

pnpm --filter frontend-forge run lint
pnpm --filter frontend-forge run format:check
pnpm --filter frontend-forge exec tsc --noEmit
```

### Forge-Specific Testing
- Dual frontend validation: `frontend` and `frontend-forge`
- Dual type generation validation: `server` and `forge-app`
- Regression harness: `./scripts/run-forge-regression.sh`

## Development Workflow

1. **Backend changes first** when modifying both frontend and backend
2. **Run type generation** after Rust type changes
3. **Create migrations** for database schema changes in `crates/db/migrations/`
4. **Follow component patterns** in `frontend/src/components/` and `frontend-forge/src/`
5. **Test before commit** with full test suite and linters
