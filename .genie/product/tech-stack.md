# Automagik Forge Technical Stack

## Core Technologies

**Backend:**
- Rust with Axum web framework
- Tokio async runtime
- SQLx for database operations with SQLite
- ts-rs for TypeScript type generation from Rust structs

**Frontend:**
- React 18 with TypeScript
- Vite build tool and dev server
- Tailwind CSS for styling
- shadcn/ui component library

**Task Orchestration:**
- Git worktree management for isolated execution
- Server-Sent Events (SSE) for real-time streaming
- SQLite database with SQLx migrations

**AI Agent Integration:**
- MCP (Model Context Protocol) server built-in
- 8 AI coding agent executors: Claude Code, Cursor CLI, Gemini, Codex, Amp, OpenCode, Qwen Code, Claude Router
- Specialized agent prompts stored as markdown templates

## Architecture

### Monorepo Structure
```
crates/              # Rust workspace
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
```

### Key Patterns

**1. Event Streaming via SSE**
- Process logs: `/api/events/processes/:id/logs`
- Task diffs: `/api/events/task-attempts/:id/diff`
- Real-time progress updates to frontend

**2. Git Worktree Isolation**
- Each task attempt gets its own git worktree
- Managed by `WorktreeManager` service
- Automatic orphan cleanup on shutdown
- No conflicts between parallel attempts

**3. Executor Pattern**
- Pluggable AI agent executors
- Common interface: `coding_agent_initial`, `coding_agent_follow_up`, `script`
- Each executor wraps specific AI platform (Claude API, Gemini API, CLI tools)

**4. MCP Server**
- Built-in Model Context Protocol server
- Tools: `list_projects`, `list_tasks`, `create_task`, `get_task`, `update_task`, `delete_task`
- Allows any MCP-compatible AI agent to manage tasks

**5. Type Sharing**
- Rust structs with `#[derive(TS)]` generate TypeScript equivalents
- `cargo run -p server --bin generate_types` → `shared/types.ts`
- `cargo run -p forge-app --bin generate_forge_types` → `shared/forge-types.ts`
- Never edit generated files manually

## Dependencies

**Rust Crates:**
- axum (web framework)
- tokio (async runtime)
- sqlx (database)
- serde, serde_json (serialization)
- ts-rs (TypeScript generation)
- reqwest (HTTP client)
- anyhow, thiserror (error handling)

**Frontend Packages:**
- react, react-dom
- @tanstack/react-query (data fetching)
- tailwindcss (styling)
- shadcn/ui components
- vite (build tool)

**Development Tools:**
- pnpm (package manager)
- cargo (Rust build)
- SQLx CLI (migrations)
- TypeScript compiler

## Infrastructure

**Development:**
- Frontend dev server: Vite on port 3000 (auto-proxy to backend)
- Backend dev server: Cargo watch with hot reload
- Database: SQLite file, auto-initialized from `dev_assets_seed/`
- Port management: `scripts/setup-dev-environment.js`

**Production:**
- Bundled binaries via `./local-build.sh`
- NPM package via `pnpm pack --filter npx-cli`
- Self-hostable: run on any Linux/macOS/Windows system
- No external dependencies beyond Node.js runtime

**CI/CD:**
- GitHub Actions for tests and builds
- Regression harness: `./scripts/run-forge-regression.sh`
- Type check, lint, clippy, format validation
- SQLx prepare check for query validation

## Configuration

**Build-time:**
- `GITHUB_CLIENT_ID`: OAuth app ID (optional, for custom auth)
- `POSTHOG_API_KEY`: Analytics key (optional)

**Runtime:**
- `FRONTEND_PORT`: Default 3000
- `BACKEND_PORT`: Auto-assigned or specified
- `HOST`: Default 127.0.0.1
- `DISABLE_WORKTREE_ORPHAN_CLEANUP`: Debug flag

**Environment Files:**
- `.env` for local overrides
- Never commit secrets or API keys
- Managed via `scripts/setup-dev-environment.js`

## Testing & Validation

**Backend:**
```bash
cargo test --workspace
cargo clippy --all --all-targets --all-features -- -D warnings
cargo fmt --all -- --check
```

**Frontend:**
```bash
pnpm --filter frontend run lint
pnpm --filter frontend run format:check
pnpm --filter frontend exec tsc --noEmit

pnpm --filter frontend-forge run lint
pnpm --filter frontend-forge run format:check
pnpm --filter frontend-forge exec tsc --noEmit
```

**Type Generation:**
```bash
cargo run -p server --bin generate_types -- --check
cargo run -p forge-app --bin generate_forge_types -- --check
```

**Database:**
```bash
sqlx migrate run
```

## Development Workflow

1. **Backend changes first** when modifying both frontend and backend
2. **Run type generation** after Rust type changes
3. **Create migrations** for database schema changes in `crates/db/migrations/`
4. **Follow component patterns** in `frontend/src/components/` and `frontend-forge/src/`
5. **Test before commit** with full test suite and linters
