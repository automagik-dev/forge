# Task 2 Design Notes

## 1. Extension crate boundaries

### forge-extensions/omni
- **Modules**: `mod.rs` re-export; `client.rs` (reqwest HTTP wrapper), `service.rs` (high-level send/list helpers), `types.rs` (config + DTOs). Mirror current structure under `crates/services/src/services/omni`.
- **Public API**:
  ```rust
  pub struct OmniSettings { ... }            // alias for OmniConfig
  pub struct OmniService { ... }             // wraps OmniClient + settings
  pub struct OmniClient { ... }              // HTTP operations (list_instances/send_text)
  pub enum RecipientType { ... }
  pub struct OmniInstance { ... }
  pub struct SendTextRequest { ... }
  ```
- **Config compatibility**: Provide conversion helpers (`impl From<forge_extensions_config::OmniConfig> for OmniSettings`) so forge-app can bridge between config and omni crates.
- **Tests**: keep existing `send_task_notification` unit tests in crate.

### forge-extensions/branch-templates
- **Modules**: `mod.rs` expose `BranchTemplateService`, `BranchTemplateRecord`, `BranchTemplateName` helper; separate `naming.rs`, `store.rs` for clarity.
- **Public API**:
  ```rust
  pub struct BranchTemplateService<'a> { pool: &'a SqlitePool }
  impl<'a> BranchTemplateService<'a> {
      pub async fn get_for_task(&self, task_id: Uuid) -> Result<Option<String>>;
      pub async fn set_for_task(&self, task_id: Uuid, template: Option<String>) -> Result<()>;
      pub async fn migrate_from_tasks(&self) -> Result<u64>;
      pub fn generate_branch_name(title: &str, template: Option<&str>, attempt_id: &Uuid) -> String;
  }
  ```
- **Data structs**: `ForgeTaskExtension` representing auxiliary table row, plus helper for default naming fallback (`forge-{title}-{uuid}`) currently in `TaskAttempt::generate_branch_name`.
- **Dependencies**: `sqlx`, `uuid`, `chrono` (match existing), behind feature flag `sqlite` default.

### forge-extensions/config
- **Modules**: `mod.rs`, `versions::{v6, v7}`, `errors.rs`.
- **Public API**:
  ```rust
  pub use versions::v7::{ForgeConfig, NotificationConfig, EditorConfig, ...};
  pub fn upgrade_from_previous(raw: &str) -> Result<ForgeConfig>;
  pub fn default_config() -> ForgeConfig;
  pub fn merge_legacy_omni(config: ForgeConfig, omni: OmniOverride) -> ForgeConfig; // optional helper if needed
  ```
- Keep upgrade logic and `Default` implementation identical; replace `services::services::omni::types::OmniConfig` import with `forge_extensions_omni::OmniSettings`.

## 2. forge-app composition layer

### Services module layout
- `forge-app/src/services/mod.rs`
  - Define `ForgeServices` struct bundling references to upstream services (`DeploymentImpl`, `DbPool`, etc.) plus extension handles.
  - Provide `ForgeServices::bootstrap()` to initialise extensions (validate config, load settings, run migrations when necessary).
  - Expose domain-specific adapters:
    ```rust
    pub struct ForgeOmni<'a> { config: &'a ForgeConfig, svc: forge_extensions_omni::OmniService }
    pub struct ForgeTaskService<'a> { pool: &'a SqlitePool }
    ```
- Introduce `ForgeTaskService::generate_branch_name` delegating to extension helper and `ForgeTaskService::persist_branch_template` to call auxiliary table methods.
- Provide `ForgeServices::router()` helpers returning axum routers for `/api/forge/*` endpoints (even stub data in Task 2).

### Router layering
- `forge-app/src/router.rs`
  - Merge `/health` with new routes:
    - `GET /api/forge/omni/instances` – call `ForgeOmni` stub/list.
    - `GET /api/forge/branch-templates/:task_id` – fetch persisted template (stub placeholder for Task 2 but shaped via extension).
- Compose routers so that `forge-app` can be embedded into upstream server later (Task 3) but for now stand-alone compile.

## 3. Auxiliary schema

Create under `forge-app/migrations` (numbering matches Task 2 requirements):

### `001_auxiliary_tables.sql`
- Create tables with guards:
  ```sql
  CREATE TABLE IF NOT EXISTS forge_task_extensions (
      task_id BLOB PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
      branch_template TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS forge_project_settings (
      project_id BLOB PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
      default_branch_template TEXT,
      omni_opt_in BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS forge_omni_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id BLOB,
      payload JSON,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE VIEW IF NOT EXISTS forge_task_branch_templates AS
      SELECT t.id AS task_id,
             fx.branch_template,
             t.title,
             t.status,
             t.updated_at
        FROM tasks t
        LEFT JOIN forge_task_extensions fx ON fx.task_id = t.id;
  ```
- Include triggers to update `updated_at` on change (optional but recommended).

### `002_migrate_data.sql`
- Copy branch template values once:
  ```sql
  INSERT INTO forge_task_extensions (task_id, branch_template, created_at, updated_at)
  SELECT id, branch_template, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM tasks
   WHERE branch_template IS NOT NULL
     AND NOT EXISTS (
         SELECT 1 FROM forge_task_extensions fx WHERE fx.task_id = tasks.id
     );

  UPDATE tasks
     SET branch_template = NULL
   WHERE branch_template IS NOT NULL;
  ```
- Wrap in transaction; add comments for rollback instructions (manual set to `tasks` column if needed).

## 4. Adapter touchpoints in upstream crates
- **`crates/services/src/services/omni`**: replace module bodies with thin wrappers that depend on `forge-extensions/omni`, or remove module entirely and have upstream depend on new crate via Cargo feature gating.
- **`crates/db/src/models/task_attempt.rs`**: replace inline `generate_branch_name` logic with call to `forge_extensions_branch_templates::generate_branch_name`. Possibly inject service via trait to avoid cyclic dependency.
- **`crates/server/src/routes/omni.rs`**: rework to delegate to `forge-app` composition (e.g., by importing `forge_app::services::ForgeServices` or via a new adapter function).
- **`crates/server/src/routes/tasks.rs` & MCP**: when persisting/fetching branch template, call into `ForgeTaskService` instead of directly writing to `tasks` table.
- **`crates/services/src/services/config`**: adjust re-export to use extension crate types (or remove module, letting callers import `forge_extensions_config`).

## 5. Verification strategy
- **Rust checks**: `cargo check --workspace`, targeted tests for `forge-extensions-omni` (existing ones) and new branch template helpers.
- **SQLx migration dry run**: `cargo sqlx migrate run --dry-run` pointing at `forge-app/migrations` (document results if sandbox prohibits running).
- **Smoke endpoints**: run `cargo run -p forge-app`, curl endpoints (document if not run).
- **Docs**: update `genie/prep/wish-prep-restructure-upstream-library.md` with migration summary & clarify that Genie remains documentation-only (no service wiring).

## 6. Open questions / assumptions
- Upstream crates will accept new dependency on `forge-app` or raw extension crates? For now assume we can add `forge-extensions` as dependencies where needed.
- `forge-app` will likely not run concurrently with upstream server yet; we expose routers but actual integration deferred to Task 3.
- Genie extraction scope limited to git identity constants for Task 2; deeper automation deferred unless blocking tests.

## Next concrete actions
1. Update extension crate scaffolds with real module layout (`omni`, `branch-templates`, `config`).
2. Move Omni code into extension crate while updating imports + TS generation references.
3. Draft auxiliary migrations under `forge-app/migrations` before wiring branch template adapters.
