# Task 2 Backend Inventory

## Omni (notifications)
- **Services crate**: `crates/services/src/services/omni/{mod.rs,client.rs,types.rs}` holds config structs (`OmniConfig`, `RecipientType`), DTOs, async client, and `OmniService::send_task_notification`. Uses `reqwest`, `ts-rs` derives.
- **Server routes**: `crates/server/src/routes/omni.rs` exposes `/api/omni/*` endpoints. Converts config v7 structs into omni types, instantiates `OmniService`, and calls client methods.
- **Config v7 coupling**: `crates/services/src/services/config/versions/v7.rs` re-exports omni types and embeds an `OmniConfig` field in persisted user config.
- **Generating TS types**: `crates/server/src/bin/generate_types.rs` references `services::services::omni::types::*` for TS output.
- **Local deployment hooks**: `crates/local-deployment/src/container.rs:141` constructs an `OmniService` for notification webhooks.
- **Planned destination**:
  - Move service/client/types into `forge-extensions/omni` (becomes canonical owner).
  - Provide adapter APIs inside `forge-app` to expose Omni operations (list instances, validate config, send notifications) without touching upstream routes.
  - Upstream crates should depend on an abstracted interface (likely via new `forge-app` composition layer) instead of direct `services::services::omni::*` imports.

## Branch templates
- **Database schema**: `crates/db/src/models/task.rs` and `task_attempt.rs` include `branch_template` column usage (creation/update queries, branch generation helper `generate_branch_name`). Migration `20250903172012_add_branch_template_to_tasks.sql` adds column.
- **Service layer**: Branch-specific logic embedded in `TaskAttempt::create` (`generate_branch_name`) and elsewhere in `task.rs` queries; no standalone service yet.
- **Server + MCP touchpoints**:
  - REST: `crates/server/src/routes/tasks.rs` accepts/returns `branch_template` via `CreateTask`/`UpdateTask` and merges incoming data.
  - MCP: `crates/server/src/mcp/task_server.rs` surfaces `branch_template` in task creation/update flows.
- **TypeScript generation**: `shared/types.ts` (generated) includes branch template fields via `CreateTask`/`Task` structs.
- **Planned destination**:
  - Extract branch template helpers (naming rules, persistence) into `forge-extensions/branch-templates`, adding a data access layer that targets new auxiliary tables (`forge_task_extensions`, etc.).
  - Introduce adapters in `forge-app` (e.g., `ForgeTaskService`) that upstream code can call to read/write branch template metadata.
  - Legacy column remains but becomes a passthrough backed by migrations copying data to auxiliary tables.

## Config v7
- **Current location**: `crates/services/src/services/config/versions/v7.rs` defines latest schema, `Config::from` upgrade path, and default Omni section. Module re-exported from `crates/services/src/services/config/mod.rs`.
- **TS generation**: `generate_types.rs` exports `services::services::config::*` types for frontend consumption.
- **Usage**: `crates/server/src/routes/config.rs` reads/writes `Config`; `DeploymentImpl` caches config in memory.
- **Planned destination**:
  - Move v7 structs/logic into `forge-extensions/config`, keeping upgrade helpers and Omni dependency local to extension.
  - Provide `ForgeConfig` facade in extension returning/accepting upstream-friendly types; `forge-app` composes this with upstream deployment config loader.
  - Update TS generation to pull types from the new crate (likely via `forge_extensions_config::ForgeConfig` exports).

## Genie / MCP integration hooks (documentation only)
- **Current usage**: Genie branding appears in git commit identity helpers (`crates/services/src/services/git.rs`) and documentation assets (`genie/wishes/*.md`, `.claude/` commands). No runtime HTTP handlers exist today.
- **Scope guardrail**: Migration keeps Genie automation as documentation/process guidance; backend code only references Genie for naming/metadata defaults.
- **Follow-up note**: Any future automation would be handled as separate work; Task 2 ensures docs stay accurate without adding endpoints.

## Auxiliary data & migrations
- **Existing data model** relies on upstream tables (`tasks`, `task_attempts`) holding forge-only columns (`branch_template`).
- **Future auxiliary layer**: Task 2 requires new tables/views under `forge-app/migrations` (e.g., `forge_task_extensions`, `forge_project_settings`, `forge_omni_notifications`) plus data migration copying `branch_template` into auxiliary storage while nulling legacy column.
- **Snapshot tooling**: `scripts/collect-forge-snapshot.sh` collects local `.automagik-forge` data, which new loaders must ingest when seeding auxiliary tables.
- **Planning notes**:
  - Ensure migrations use `IF NOT EXISTS` guards and reversible operations (wrap updates in transactions, avoid destructive drops).
  - Data migration must be idempotent: copy non-null branch templates, update legacy column to NULL, but skip if already migrated.

## Composition targets (`forge-app`)
- `forge-app/src/services/mod.rs` currently stubs `bootstrap_extensions` and logs placeholder data.
- `forge-app/src/router.rs` only exposes `/health`.
- Goal: create a composition layer (`ForgeServices`, `ForgeTaskService`, Omni adapter) that wires extension crates to upstream services while respecting "no direct upstream modifications" constraint.

## Next steps summary
- Confirm all upstream references to forge-only logic (Omni imports, branch_template usage, config v7 re-exports, Genie identity) to scope refactors.
- Design extension crate APIs + forge-app adapters matching existing call sites before moving code.
- Draft auxiliary schema definitions aligned with branch template workflow and Omni metadata requirements.
