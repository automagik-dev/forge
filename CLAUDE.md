# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Start development servers with hot reload (frontend + backend)
pnpm run dev

# Individual dev servers
npm run frontend:dev    # Frontend only (port 3000)
npm run backend:dev     # Backend only (port auto-assigned)

# Build production version
./build-npm-package.sh
```

### Testing & Validation
```bash
# Run all checks (frontend + backend)
npm run check

# Frontend specific
cd frontend && npm run lint          # Lint TypeScript/React code
cd frontend && npm run format:check  # Check formatting
cd frontend && npx tsc --noEmit     # TypeScript type checking

# Backend specific  
cargo test --workspace               # Run all Rust tests
cargo test -p <crate_name>          # Test specific crate
cargo test test_name                # Run specific test
cargo fmt --all -- --check          # Check Rust formatting
cargo clippy --all --all-targets --all-features -- -D warnings  # Linting

# Type generation (after modifying Rust types)
npm run generate-types               # Regenerate TypeScript types from Rust
npm run generate-types:check        # Verify types are up to date
```

### Database Operations
```bash
# SQLx migrations
sqlx migrate run                     # Apply migrations
sqlx database create                 # Create database

# Database is auto-copied from dev_assets_seed/ on dev server start
```

## Architecture Overview

### Tech Stack
- **Backend**: Rust with Axum web framework, Tokio async runtime, SQLx for database
- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui components  
- **Database**: SQLite with SQLx migrations
- **Type Sharing**: ts-rs generates TypeScript types from Rust structs
- **MCP Server**: Built-in Model Context Protocol server for AI agent integration

### Project Structure
```
crates/
├── server/         # Axum HTTP server, API routes, MCP server
├── db/            # Database models, migrations, SQLx queries
├── executors/     # AI coding agent integrations (Claude, Gemini, etc.)
├── services/      # Business logic, GitHub, auth, git operations
├── local-deployment/  # Local deployment logic
└── utils/         # Shared utilities

frontend/          # React application
├── src/
│   ├── components/  # React components (TaskCard, ProjectCard, etc.)
│   ├── pages/      # Route pages
│   ├── hooks/      # Custom React hooks (useEventSourceManager, etc.)
│   └── lib/        # API client, utilities

shared/types.ts    # Auto-generated TypeScript types from Rust
```

### Key Architectural Patterns

1. **Event Streaming**: Server-Sent Events (SSE) for real-time updates
   - Process logs stream to frontend via `/api/events/processes/:id/logs`
   - Task diffs stream via `/api/events/task-attempts/:id/diff`

2. **Git Worktree Management**: Each task execution gets isolated git worktree
   - Managed by `WorktreeManager` service
   - Automatic cleanup of orphaned worktrees

3. **Executor Pattern**: Pluggable AI agent executors
   - Each executor (Claude, Gemini, etc.) implements common interface
   - Actions: `coding_agent_initial`, `coding_agent_follow_up`, `script`

4. **MCP Integration**: Vibe Kanban acts as MCP server
   - Tools: `list_projects`, `list_tasks`, `create_task`, `update_task`, etc.
   - AI agents can manage tasks via MCP protocol

### API Patterns

- REST endpoints under `/api/*`
- Frontend dev server proxies to backend (configured in vite.config.ts)
- Authentication via GitHub OAuth (device flow)
- All database queries in `crates/db/src/models/`

### Development Workflow

1. **Backend changes first**: When modifying both frontend and backend, start with backend
2. **Type generation**: Run `npm run generate-types` after modifying Rust types
3. **Database migrations**: Create in `crates/db/migrations/`, apply with `sqlx migrate run`
4. **Component patterns**: Follow existing patterns in `frontend/src/components/`

### Testing Strategy

- **Unit tests**: Colocated with code in each crate
- **Integration tests**: In `tests/` directory of relevant crates  
- **Frontend tests**: TypeScript compilation and linting only
- **CI/CD**: GitHub Actions workflow in `.github/workflows/test.yml`

### Environment Variables

Build-time (set when building):
- `GITHUB_CLIENT_ID`: GitHub OAuth app ID (default: Bloop AI's app)
- `POSTHOG_API_KEY`: Analytics key (optional)

Runtime:
- `BACKEND_PORT`: Backend server port (default: auto-assign)
- `FRONTEND_PORT`: Frontend dev port (default: 3000)
- `HOST`: Backend host (default: 127.0.0.1)
- `DISABLE_WORKTREE_ORPHAN_CLEANUP`: Debug flag for worktrees

## Upstream Submodule Update Protocol

**CRITICAL**: This is the LAW for updating the `upstream/` submodule (vibe-kanban fork).

### Architecture
```
automagik-forge/                    ← Parent repo (THIS REPO)
├── crates/executors/
│   └── default_profiles.json      ← Namastex custom executor profiles (overrides upstream)
├── frontend/                       ← Namastex custom frontend
├── .gitmodules                     ← Points to release branch, NOT main
└── upstream/                       ← Submodule: clean vibe-kanban fork
    ├── crates/executors/
    │   ├── default_mcp.json        ← Generic MCP config
    │   └── default_profiles.json   ← Clean upstream defaults only
    └── frontend/                   ← Upstream frontend (NOT used by parent)
```

### Release Branch Protocol

**Rule**: Parent repo ALWAYS tracks a **release branch** in the upstream submodule, NEVER `main`.

**Why**: Pinning to a release branch prevents breaking changes in upstream `main` from affecting the production parent app.

### Step-by-Step Update Process

#### 1. Consolidate Work in Upstream Main
```bash
cd upstream/
git checkout main

# Merge all feature branches/fixes to main
git merge fix/some-feature
git merge release/v0.0.113-namastex-4  # If needed
git push origin main
```

#### 2. Create Namastex Release Branch
```bash
# From main, create new release branch
git checkout -b release/v0.0.113-namastex-N  # Increment N

# Push to origin
git push -u origin release/v0.0.113-namastex-N
```

#### 3. Tag the Release
```bash
# Create annotated tag
git tag -a v0.0.113-namastex-N -m "Release v0.0.113-namastex-N

Features:
- Feature 1
- Feature 2

Fixes:
- Fix 1
- Fix 2"

# Push tag
git push origin v0.0.113-namastex-N
```

#### 4. Update .gitmodules in Parent Repo
```bash
cd ..  # Back to parent automagik-forge/

# Edit .gitmodules
vim .gitmodules

# Change branch to new release:
[submodule "upstream"]
    path = upstream
    url = https://github.com/namastexlabs/vibe-kanban.git
    branch = release/v0.0.113-namastex-N  # ← Update this
```

#### 5. Update Git Config and Submodule
```bash
# Update .git/config
git config -f .git/config submodule.upstream.branch release/v0.0.113-namastex-N

# Update submodule to track new release branch
git submodule update --remote upstream

# Verify upstream is on release branch
cd upstream && git branch --show-current
# Should output: release/v0.0.113-namastex-N
```

#### 6. Commit Parent Repo Changes
```bash
cd ..  # Back to parent

# Stage changes
git add .gitmodules upstream

# Commit
git commit -m "chore: update upstream to release/v0.0.113-namastex-N

Updates upstream submodule from release/v0.0.113-namastex-(N-1) to v0.0.113-namastex-N.

Changes:
- List key changes from upstream
- Feature additions
- Bug fixes"

# Push
git push origin <current-branch>
```

#### 7. Merge to Parent Main (If Appropriate)
```bash
# Switch to main
git checkout main

# Merge feature branch with upstream updates
git merge <current-branch>

# Push
git push origin main
```

### Common Mistakes to Avoid

❌ **DO NOT** work on upstream `main` and forget to create release branch
❌ **DO NOT** point `.gitmodules` to `main` branch
❌ **DO NOT** commit changes to parent without updating `.gitmodules`
❌ **DO NOT** push upstream changes without creating release branch first
❌ **DO NOT** modify `upstream/crates/executors/default_profiles.json` (use parent's version)

✅ **DO** always create release branch before updating parent
✅ **DO** keep upstream clean and generic (no Namastex IP in upstream)
✅ **DO** update `.gitmodules` and git config together
✅ **DO** verify upstream is on release branch after update
✅ **DO** keep Namastex customizations in parent repo

### Quick Reference

```bash
# Check current upstream branch
cd upstream && git branch --show-current

# Check .gitmodules configuration
cat .gitmodules

# Check submodule status
git submodule status

# Force submodule to track configured branch
git submodule update --remote upstream
```

### File Ownership

**Parent Repo Owns:**
- `crates/executors/default_profiles.json` - Namastex executor profiles (MASTER, WISH, FORGE, REVIEW)
- `frontend/` - Namastex custom frontend
- All Namastex branding and IP

**Upstream Owns:**
- Backend/API code
- `crates/executors/default_mcp.json` - Generic MCP server config
- `crates/executors/default_profiles.json` - Clean defaults only (no Namastex profiles)
- Generic upstream frontend (not used by parent)