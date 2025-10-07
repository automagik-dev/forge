# CLAUDE.md

> **Primary Behavioral Guidance**: See @AGENTS.md for orchestration rules, agent routing, tooling requirements, and behavioral learnings.

This document contains Claude-specific patterns and Automagik Forge project reference information.

---

## Claude-Specific Behavioral Patterns

### Evidence-Based Challenge Protocol

When users state something contradicting observations, NEVER immediately agree. Verify with evidence.

**Forbidden:** "You're absolutely right" without investigation.

**Required Pattern:**
1. Pause: "Let me verify that claim..."
2. Investigate: Read files, check history, search codebase
3. Present Evidence: File paths + line numbers
4. Conclude: Confirm OR politely challenge with counter-evidence

**Example:**
```
User: "The task API uses a metrics flag"
Assistant: "Let me verify..."
*checks crates/server/src/api/tasks.rs*
"I've checked the implementation. No `--metrics` flag exists. Available params: `status`, `limit`. Where did you see this referenced?"
```

**Verification Commands:**
- Backend: `grep -r "term" crates/`
- Frontend: `grep -r "term" frontend/src/`
- API routes: Check `crates/server/src/api/`

---

### No Backwards Compatibility

Automagik Forge does NOT support legacy features or compatibility flags.

**When planning changes:**
- ❌ NEVER suggest `--legacy`, `--compat`, `--metrics` flags
- ❌ NEVER preserve old behavior alongside new
- ✅ ALWAYS replace behavior entirely
- ✅ ALWAYS verify proposed flags exist first (search codebase)
- ✅ ALWAYS remove obsolete code completely

**Example (WRONG):** "Add `--legacy-executor` flag for compatibility"
**Example (CORRECT):** "Replace executor interface entirely. Remove legacy code from `crates/executors/src/`"

**Validation:**
- Before suggesting flags: `grep -r "flag_name" crates/ frontend/`
- Check CLI parsing: `crates/server/src/bin/*.rs`
- Review type contracts: `shared/types.ts`

---

### Forge MCP Task Pattern

When creating Forge MCP tasks via `mcp__forge__create_task`, use minimal descriptions with file references:

**Template:**
```
Use the <persona> subagent to [action].

@.genie/agents/specialists/<persona>.md
@.genie/wishes/<slug>/task-<group>.md
@.genie/wishes/<slug>-wish.md

Load all context from referenced files.
```

**Why:**
- Task files contain full context (Discovery/Implementation/Verification)
- `@` syntax loads files automatically
- Avoids duplication in Forge MCP descriptions

**Validation:**
- ✅ Forge MCP description: ≤3 lines with `@.genie/agents/specialists/` prefix
- ✅ Task file: full context preserved
- ✅ No duplication
- ❌ Hundreds of lines duplicating task file

---

## Automagik Forge Project Reference

### Project Structure
```
crates/           # Rust workspace
├── server/       # Axum HTTP, API routes, MCP server
├── db/           # SQLx models, migrations
├── executors/    # AI agent integrations (Claude, Gemini)
├── services/     # Business logic (GitHub, auth, git)
├── local-deployment/
└── utils/

frontend/         # React + TypeScript + Vite
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── lib/

shared/types.ts   # Auto-generated from Rust (ts-rs)
```

### Tech Stack
- **Backend**: Rust (Axum, Tokio, SQLx)
- **Frontend**: React 18, TypeScript, Vite, Tailwind, shadcn/ui
- **Database**: SQLite with SQLx migrations
- **Type Sharing**: ts-rs generates TypeScript from Rust
- **MCP Server**: Built-in for AI agent integration

### Essential Commands

**Development:**
```bash
pnpm run dev                 # Start both servers
pnpm run frontend:dev        # Frontend only
pnpm run backend:dev         # Backend only
./local-build.sh             # Production build
```

**Testing & Validation:**
```bash
pnpm run check               # All checks
cargo test --workspace       # Rust tests
cargo clippy --all --all-targets --all-features -- -D warnings
cd frontend && pnpm run lint
cd frontend && pnpm exec tsc --noEmit
pnpm run generate-types      # Regenerate TS types from Rust
pnpm run generate-types:check
```

**Database:**
```bash
sqlx migrate run             # Apply migrations
sqlx database create
# DB auto-copied from dev_assets_seed/ on dev start
```

### Key Architectural Patterns

1. **Event Streaming**: SSE for real-time updates
   - Process logs: `/api/events/processes/:id/logs`
   - Task diffs: `/api/events/task-attempts/:id/diff`

2. **Git Worktree Management**: Isolated worktrees per task
   - Managed by `WorktreeManager` service
   - Automatic orphan cleanup

3. **Executor Pattern**: Pluggable AI agent executors
   - Common interface for Claude, Gemini, etc.
   - Actions: `coding_agent_initial`, `coding_agent_follow_up`, `script`

4. **MCP Integration**: Automagik Forge acts as MCP server
   - Tools: `list_projects`, `list_tasks`, `create_task`, `update_task`, etc.

### Coding Style
- **Rust**: `rustfmt` enforced; snake_case modules, PascalCase types
- **TypeScript/React**: ESLint + Prettier (2 spaces, single quotes, 80 cols); PascalCase components, camelCase vars/functions

### Development Workflow
1. Backend changes first when modifying both
2. Run `pnpm run generate-types` after Rust type changes
3. Database migrations: `crates/db/migrations/`
4. Follow existing component patterns

### Environment Variables

**Build-time:**
- `GITHUB_CLIENT_ID`: OAuth app ID
- `POSTHOG_API_KEY`: Analytics (optional)

**Runtime:**
- `BACKEND_PORT`: Auto-assigned by default
- `FRONTEND_PORT`: Default 3000
- `HOST`: Default 127.0.0.1
- `DISABLE_WORKTREE_ORPHAN_CLEANUP`: Debug flag

---

## Behavioral Reference

**For comprehensive behavioral guidance, see @AGENTS.md:**
- Orchestration rules
- Agent routing matrix
- Tooling requirements (uv, git, forge)
- Behavioral learnings
- File/naming rules
- Wish workflow
- Forge workflow
- Death Testament integration
- Agent MCP integration
- Evidence-based thinking
- Time estimation ban
- pyproject.toml protection
