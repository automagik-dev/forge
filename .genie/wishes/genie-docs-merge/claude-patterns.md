# Claude-Specific Patterns for Automagik Forge

## Evidence-Based Challenge Protocol

**Pattern:** When the user states something that contradicts your observations, code, or previous statements, NEVER immediately agree. Verify and challenge with evidence.

**Forbidden Responses:**
- ❌ "You're absolutely right"
- ❌ "You're correct"
- ❌ "Good catch"
- ❌ "My mistake"
- ❌ Any immediate agreement without verification

**Required Response Pattern:**
1. **Pause**: "Let me verify that claim..."
2. **Investigate**: Read files, check git history, search codebase
3. **Present Evidence**: Show what you found with file paths and line numbers
4. **Conclude**: Either confirm their point with evidence OR politely challenge with counter-evidence

**Example (WRONG):**
User: "The task API endpoint uses a metrics flag"
Assistant: "You're absolutely right, I missed that."

**Example (CORRECT):**
User: "The task API endpoint uses a metrics flag"
Assistant: "Let me verify that..."
*reads codebase*
"I've checked the task router implementation at `crates/server/src/api/tasks.rs:45-120` and the API handler at `crates/server/src/api/mod.rs:30-50`. There's no `--metrics` flag defined. The available query parameters are `status` and `limit`. Could you point me to where you saw this flag referenced?"

**Automagik Forge Context:**
- Primary codebase: Rust backend (`crates/server/`, `crates/services/`) + TypeScript frontend (`frontend/src/`)
- Verification commands:
  - Backend: `grep -r "flag_name" crates/`
  - Frontend: `grep -r "flag_name" frontend/src/`
  - API routes: Check `crates/server/src/api/`
- Common file paths to reference:
  - API handlers: `crates/server/src/api/*.rs`
  - Services: `crates/services/src/*.rs`
  - Frontend components: `frontend/src/components/*.tsx`
  - Type definitions: `shared/types.ts`

**Why:**
- Users can misremember or hallucinate details
- Immediate agreement reinforces false beliefs
- Evidence-based discourse maintains accuracy in Rust/TypeScript projects
- Respectful challenge builds trust in code reviews

**Validation:**
- Before agreeing, search the relevant Rust/TypeScript code
- Provide file paths (absolute paths from `/home/namastex/workspace/automagik-forge/`) and line numbers
- If uncertain, admit it and investigate with `cargo` or `pnpm` tooling

---

## No Backwards Compatibility

**Pattern:** Automagik Forge does NOT support backwards compatibility or legacy features.

**When planning fixes or enhancements:**
- ❌ NEVER suggest `--legacy`, `--compat`, `--metrics` flags or similar
- ❌ NEVER propose preserving old behavior alongside new behavior
- ❌ NEVER say "we could add X flag for backwards compatibility"
- ✅ ALWAYS replace old behavior entirely with new behavior
- ✅ ALWAYS verify if suggested flags actually exist (search codebase first)
- ✅ ALWAYS simplify by removing obsolete code completely

**Example (WRONG):**
> "We could add a `--legacy-executor` flag to preserve the old Claude executor behavior for users who need it."

**Example (CORRECT):**
> "Replace the executor interface entirely with the new MCP-based approach. Remove all legacy executor code from `crates/executors/src/`."

**Automagik Forge Context:**
- **Backend validation:** `grep -r "flag_name" crates/`
- **Frontend validation:** `grep -r "flag_name" frontend/src/`
- **CLI validation:** Check `crates/server/src/bin/` for actual command-line arguments
- **Database migrations:** Use `sqlx migrate add` to create new migrations, never preserve old schemas
- **Type changes:** Regenerate TypeScript types with `pnpm run generate-types` after Rust changes

**Why:**
- Automagik Forge is an active development project
- Breaking changes are acceptable and expected
- Cleaner Rust/TypeScript codebase without legacy cruft
- Faster iteration in both backend (cargo) and frontend (pnpm) without compatibility constraints

**Validation:**
- Before suggesting new flags, run: `grep -r "flag_name" crates/ frontend/`
- If flag doesn't exist and solves backwards compat → it's hallucinated, remove it
- Check actual CLI parsing: `crates/server/src/bin/*.rs`
- Review type contracts: `shared/types.ts` and `crates/server/src/bin/generate_types.rs`

---

## Forge MCP Task Pattern

**Pattern:** When creating Forge MCP tasks via `mcp__forge__create_task`, explicitly instruct to use the subagent and load context from files.

**Template:**
```
Use the <persona> subagent to [action verb] this task.

@.genie/agents/specialists/<persona>.md
@.genie/wishes/<slug>/task-<group>.md
@.genie/wishes/<slug>-wish.md

Load all context from the referenced files above. Do not duplicate content here.
```

**Automagik Forge Example:**
```
Use the implementor subagent to implement this task.

@.genie/agents/specialists/implementor.md
@.genie/wishes/mcp-integration/task-a.md
@.genie/wishes/mcp-integration-wish.md

Load all context from the referenced files above. Do not duplicate content here.
```

**Automagik Forge Context:**
- **Task files location:** `.genie/wishes/<slug>/task-*.md`
- **Agent definitions:** `.genie/agents/specialists/*.md`
- **Project-specific patterns:**
  - Rust backend: `crates/server/`, `crates/executors/`, `crates/services/`
  - Frontend: `frontend/src/`
  - Database: `crates/db/migrations/`
- **Common verification commands:**
  - `cargo test --workspace` (Rust tests)
  - `pnpm run check` (Frontend type checking)
  - `pnpm run generate-types` (Type synchronization)

**Why:**
- Task files contain full context (Discovery, Implementation, Verification)
- Your `@` syntax loads files automatically
- Avoids duplicating hundreds of lines in Forge MCP descriptions
- Solves subagent context loading for Rust/TypeScript stack

**Critical Distinction:**

**Task files** (`.genie/wishes/<slug>/task-*.md`):
- Full context (100+ lines)
- Created by forge agent during planning
- Contains Rust-specific and TypeScript-specific details
- **Never changed by this pattern**

**Forge MCP descriptions:**
- Minimal (≤3 lines)
- `@.genie/agents/specialists/<persona>.md` prefix + file references only
- Points to task files for full context

**Validation:**
✅ Forge MCP description: ≤3 lines with `@.genie/agents/specialists/` prefix
✅ Task file: full context preserved (Discovery → Implementation → Verification)
✅ No duplication
✅ Includes project-specific commands (`cargo`, `pnpm`, `sqlx`)

❌ Forge MCP description: hundreds of lines duplicating task file
❌ Missing `@.genie/agents/specialists/` prefix or file references
❌ Generic instructions without Rust/TypeScript context

**Automagik Forge Stack Integration:**
- Reference Rust crates explicitly: `@crates/server/src/api/tasks.rs`
- Reference TypeScript components: `@frontend/src/components/TaskCard.tsx`
- Include type synchronization: `@shared/types.ts` and regeneration command
- Specify validation: `cargo test`, `pnpm run check`, `pnpm run lint`
