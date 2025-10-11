//! Forge Services
//!
//! Service composition layer that wraps upstream services with forge extensions.
//! Provides unified access to both upstream functionality and forge-specific features.

mod notification_hook;

use anyhow::{Context, Result, anyhow};
use deployment::Deployment;
use serde::Deserialize;
use serde_json::json;
use server::DeploymentImpl;
use sqlx::{ConnectOptions, Row, SqlitePool, sqlite::SqliteConnectOptions};
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{Duration, sleep};
use uuid::Uuid;

// Import forge extension services
use forge_config::ForgeConfigService;
use forge_omni::{OmniConfig, OmniService};

/// Main forge services container
#[derive(Clone)]
pub struct ForgeServices {
    #[allow(dead_code)]
    pub deployment: Arc<DeploymentImpl>,
    pub omni: Arc<RwLock<OmniService>>,
    pub config: Arc<ForgeConfigService>,
    pub pool: SqlitePool,
}

impl ForgeServices {
    pub async fn new() -> Result<Self> {
        purge_shared_migration_markers().await?;

        // Initialize upstream deployment (handles DB, sentry, analytics, etc.)
        let deployment = DeploymentImpl::new().await?;
        ensure_legacy_base_branch_column(&deployment.db().pool).await?;

        deployment.update_sentry_scope().await?;
        deployment.cleanup_orphan_executions().await?;
        deployment.backfill_before_head_commits().await?;
        deployment.spawn_pr_monitor_service().await;

        let deployment_for_cache = deployment.clone();
        tokio::spawn(async move {
            if let Err(e) = deployment_for_cache
                .file_search_cache()
                .warm_most_active(&deployment_for_cache.db().pool, 3)
                .await
            {
                tracing::warn!("Failed to warm file search cache: {}", e);
            }
        });

        deployment
            .track_if_analytics_allowed("session_start", json!({}))
            .await;

        let deployment = Arc::new(deployment);

        // Reuse upstream pool for forge migrations/features
        let pool = deployment.db().pool.clone();

        // Apply single Forge migration for Omni tables
        apply_forge_migrations(&pool).await?;

        // Initialize forge extension services
        let config = Arc::new(ForgeConfigService::new(pool.clone()));
        let global_settings = config.get_global_settings().await?;
        let omni_config = config.effective_omni_config(None).await?;
        let omni = Arc::new(RwLock::new(OmniService::new(omni_config)));

        tracing::info!(
            forge_omni_enabled = global_settings.omni_enabled,
            "Loaded forge extension settings from auxiliary schema"
        );

        // Install SQLite trigger for Omni notifications when tasks complete
        notification_hook::install_notification_trigger(&pool).await?;

        // Spawn background worker that processes queued Omni notifications
        spawn_omni_notification_worker(pool.clone(), config.clone());

        Ok(Self {
            deployment,
            omni,
            config,
            pool,
        })
    }

    #[allow(dead_code)]
    /// Get database connection pool for direct access
    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn apply_global_omni_config(&self) -> Result<()> {
        let omni_config = self.config.effective_omni_config(None).await?;
        let mut omni = self.omni.write().await;
        omni.apply_config(omni_config);
        Ok(())
    }

    #[allow(dead_code)]
    pub async fn effective_omni_config(&self, project_id: Option<Uuid>) -> Result<OmniConfig> {
        self.config.effective_omni_config(project_id).await
    }
}

/// Ensure forge-specific migrations do not pollute upstream tracking table.
async fn purge_shared_migration_markers() -> Result<()> {
    let mut urls: Vec<String> = Vec::new();

    if let Ok(url) = std::env::var("DATABASE_URL") {
        urls.push(url);
    }

    let crate_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let workspace_root = crate_dir
        .parent()
        .map(PathBuf::from)
        .unwrap_or_else(|| crate_dir.clone());

    let default_paths = [
        workspace_root.join("dev_assets/db.sqlite"),
        workspace_root.join("upstream/dev_assets/db.sqlite"),
        workspace_root.join("dev_assets_seed/forge-snapshot/forge.sqlite"),
    ];

    for path in default_paths {
        if path.exists() {
            urls.push(format!("sqlite://{}", path.to_string_lossy()));
        }
    }

    urls.sort();
    urls.dedup();

    for url in urls {
        let mut options = SqliteConnectOptions::from_str(&url)
            .with_context(|| format!("failed to parse sqlite URL: {url}"))?;
        options = options.create_if_missing(true);

        let mut conn = options
            .connect()
            .await
            .with_context(|| format!("failed to open sqlite connection: {url}"))?;

        let forge_table_exists: bool = sqlx::query_scalar(
            "SELECT COUNT(1) FROM sqlite_master WHERE type = 'table' AND name = '_forge_migrations'",
        )
        .fetch_one(&mut conn)
        .await
        .unwrap_or(0)
            > 0;

        if !forge_table_exists {
            continue;
        }

        let deleted =
            sqlx::query("DELETE FROM _forge_migrations WHERE version IN ('20250924090001', '20250924090003', '20251007000001')")
                .execute(&mut conn)
                .await;

        match deleted {
            Ok(result) => {
                if result.rows_affected() > 0 {
                    tracing::info!(database = %url, "Purged legacy forge migration markers");
                }
            }
            Err(sqlx::Error::Database(db_err)) if db_err.message().contains("no such table") => {
                tracing::debug!(database = %url, "Shared migration table disappeared during purge");
            }
            Err(err) => {
                return Err(err).with_context(|| {
                    format!("failed to clean shared migration table for database: {url}")
                });
            }
        }
    }

    Ok(())
}

struct ForgeMigration {
    version: &'static str,
    description: &'static str,
    sql: &'static str,
}

async fn ensure_legacy_base_branch_column(pool: &SqlitePool) -> Result<()> {
    let has_base_branch = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(1) FROM pragma_table_info('task_attempts') WHERE name = 'base_branch'",
    )
    .fetch_one(pool)
    .await?
        > 0;

    tracing::debug!(
        has_base_branch,
        "legacy schema check for task_attempts.base_branch"
    );

    if !has_base_branch {
        sqlx::query(
            "ALTER TABLE task_attempts ADD COLUMN base_branch TEXT NOT NULL DEFAULT 'main'",
        )
        .execute(pool)
        .await?;

        let has_target_branch = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(1) FROM pragma_table_info('task_attempts') WHERE name = 'target_branch'",
        )
        .fetch_one(pool)
        .await?
            > 0;

        if has_target_branch {
            sqlx::query(
                "UPDATE task_attempts SET base_branch = COALESCE(NULLIF(target_branch, ''), branch, 'main')",
            )
            .execute(pool)
            .await?;
        }

        tracing::info!(
            "Backfilled task_attempts.base_branch for legacy Vibe Kanban databases so orphan cleanup can run"
        );
    }

    sqlx::query(
        "UPDATE task_attempts SET base_branch = 'main' WHERE base_branch IS NULL OR TRIM(base_branch) = ''",
    )
    .execute(pool)
    .await?;

    Ok(())
}

const FORGE_MIGRATIONS: &[ForgeMigration] = &[ForgeMigration {
    version: "20251008000001",
    description: "forge_omni_tables",
    sql: include_str!("../../migrations/20251008000001_forge_omni_tables.sql"),
}];

async fn apply_forge_migrations(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _forge_migrations (
            version TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
    )
    .execute(pool)
    .await?;

    for migration in FORGE_MIGRATIONS {
        let already_applied: bool = sqlx::query_scalar::<_, i64>(
            "SELECT EXISTS(SELECT 1 FROM _forge_migrations WHERE version = ?)",
        )
        .bind(migration.version)
        .fetch_one(pool)
        .await?
            != 0;

        if already_applied {
            tracing::debug!(
                version = migration.version,
                "Forge migration already applied"
            );
            continue;
        }

        tracing::info!(version = migration.version, "Applying forge migration");
        let mut tx = pool.begin().await?;

        for statement in split_statements(migration.sql) {
            if statement.is_empty() {
                continue;
            }

            if let Err(err) = sqlx::query(&statement).execute(&mut *tx).await {
                if should_ignore_migration_error(migration.version, &statement, &err) {
                    tracing::info!(
                        version = migration.version,
                        stmt = statement,
                        "Ignorable migration error encountered; continuing"
                    );
                    continue;
                }

                tx.rollback().await.ok();
                return Err(err).with_context(|| {
                    format!("failed to execute forge migration {}", migration.version)
                });
            }
        }

        sqlx::query("INSERT INTO _forge_migrations (version, description) VALUES (?, ?)")
            .bind(migration.version)
            .bind(migration.description)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;
    }

    Ok(())
}

fn split_statements(sql: &str) -> Vec<String> {
    let mut statements = Vec::new();
    let mut current = String::new();
    let mut begin_depth: i32 = 0;

    for line in sql.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty() || trimmed.starts_with("--") {
            continue;
        }

        let upper = trimmed.to_ascii_uppercase();
        if upper.starts_with("BEGIN") {
            begin_depth += 1;
        }
        if upper.starts_with("END") && begin_depth > 0 {
            begin_depth -= 1;
        }

        current.push_str(trimmed);
        current.push('\n');

        if trimmed.ends_with(';') && begin_depth == 0 {
            statements.push(current.trim().to_string());
            current.clear();
        }
    }

    if !current.trim().is_empty() {
        statements.push(current.trim().to_string());
    }

    statements
}

fn should_ignore_migration_error(_version: &str, _statement: &str, _err: &sqlx::Error) -> bool {
    // No ignored errors - clean migration should succeed
    false
}

fn spawn_omni_notification_worker(pool: SqlitePool, config: Arc<ForgeConfigService>) {
    tokio::spawn(async move {
        loop {
            match process_next_omni_notification(&pool, &config).await {
                Ok(true) => {
                    // Processed at least one item, immediately attempt next
                    continue;
                }
                Ok(false) => {
                    // Queue empty → short backoff
                    sleep(Duration::from_secs(10)).await;
                }
                Err(err) => {
                    tracing::error!("Omni notification worker error: {err:?}");
                    sleep(Duration::from_secs(15)).await;
                }
            }
        }
    });
}

async fn process_next_omni_notification(
    pool: &SqlitePool,
    config: &ForgeConfigService,
) -> Result<bool> {
    let pending_row = sqlx::query(
        r#"SELECT id,
                  metadata
             FROM forge_omni_notifications
            WHERE status = 'pending'
            ORDER BY created_at
            LIMIT 1"#,
    )
    .fetch_optional(pool)
    .await?;

    let Some(row) = pending_row else {
        return Ok(false);
    };

    let row = PendingNotification {
        id: row.try_get::<String, _>("id")?,
        metadata: row.try_get::<Option<String>, _>("metadata")?,
    };

    // Mark as processing to avoid multiple workers picking it up
    let claimed = sqlx::query(
        "UPDATE forge_omni_notifications SET status = 'processing' WHERE id = ? AND status = 'pending'",
    )
    .bind(&row.id)
    .execute(pool)
    .await?;

    if claimed.rows_affected() == 0 {
        // Another worker grabbed it first; treat as processed and continue
        return Ok(true);
    }

    match handle_omni_notification(pool, config, &row).await {
        Ok(OmniQueueAction::Sent { message }) => {
            sqlx::query(
                "UPDATE forge_omni_notifications SET status = 'sent', sent_at = CURRENT_TIMESTAMP, message = ? WHERE id = ?",
            )
            .bind(&message)
            .bind(&row.id)
            .execute(pool)
            .await?;
        }
        Ok(OmniQueueAction::Skipped { reason }) => {
            sqlx::query(
                "UPDATE forge_omni_notifications SET status = 'skipped', error_message = ? WHERE id = ?",
            )
            .bind(&reason)
            .bind(&row.id)
            .execute(pool)
            .await?;
        }
        Err(err) => {
            sqlx::query(
                "UPDATE forge_omni_notifications SET status = 'failed', error_message = ? WHERE id = ?",
            )
            .bind(err.to_string())
            .bind(&row.id)
            .execute(pool)
            .await?;
        }
    }

    Ok(true)
}

#[derive(Debug)]
enum OmniQueueAction {
    Sent { message: String },
    Skipped { reason: String },
}

#[derive(Debug)]
struct PendingNotification {
    id: String,
    metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OmniNotificationMetadata {
    task_attempt_id: Option<String>,
    status: Option<String>,
    executor: Option<String>,
    branch: Option<String>,
    project_id: Option<String>,
}

async fn handle_omni_notification(
    pool: &SqlitePool,
    config: &ForgeConfigService,
    row: &PendingNotification,
) -> Result<OmniQueueAction> {
    let metadata: OmniNotificationMetadata = match &row.metadata {
        Some(payload) if !payload.is_empty() => {
            serde_json::from_str(payload).with_context(|| "failed to deserialize omni metadata")?
        }
        _ => return Err(anyhow!("missing metadata for omni notification")),
    };

    let attempt_id_str = metadata
        .task_attempt_id
        .ok_or_else(|| anyhow!("metadata missing task_attempt_id"))?;
    let attempt_id = Uuid::parse_str(&attempt_id_str)
        .with_context(|| format!("invalid task_attempt_id UUID: {}", attempt_id_str))?;
    let status = metadata
        .status
        .ok_or_else(|| anyhow!("metadata missing status"))?;

    let attempt_row = sqlx::query(
        r#"SELECT
                t.id         AS task_id,
                t.title      AS title,
                t.project_id AS project_id,
                ta.branch    AS branch,
                ta.executor  AS executor
           FROM task_attempts ta
           JOIN tasks t ON t.id = ta.task_id
          WHERE ta.id = ?"#,
    )
    .bind(attempt_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| anyhow!("task attempt not found for omni notification"))?;

    let project_id = if let Some(pid_str) = metadata.project_id {
        Uuid::parse_str(&pid_str)
            .with_context(|| format!("invalid project_id UUID: {}", pid_str))?
    } else {
        attempt_row
            .try_get::<Uuid, _>("project_id")
            .with_context(|| "missing project_id in database row")?
    };
    let omni_config = config.effective_omni_config(Some(project_id)).await?;

    if !omni_config.enabled {
        return Ok(OmniQueueAction::Skipped {
            reason: "Omni notifications disabled for project".into(),
        });
    }

    let host = omni_config
        .host
        .as_deref()
        .ok_or_else(|| anyhow!("Omni host not configured"))?;
    if host.is_empty() {
        return Err(anyhow!("Omni host configuration empty"));
    }

    let branch = metadata
        .branch
        .or_else(|| {
            attempt_row
                .try_get::<Option<String>, _>("branch")
                .ok()
                .flatten()
        })
        .unwrap_or_else(|| "unknown".to_string());
    let executor = metadata.executor.unwrap_or_else(|| {
        attempt_row
            .try_get::<String, _>("executor")
            .unwrap_or_else(|_| "unknown".into())
    });

    let title: String = attempt_row.try_get("title")?;
    let task_id: Uuid = attempt_row.try_get("task_id")?;

    let status_summary = format_status_summary(&status, &executor, &branch);
    let task_url = format!(
        "{}/projects/{}/tasks/{}",
        omni_base_url(),
        project_id,
        task_id
    );

    tracing::info!(
        "Attempting to send Omni notification for task '{}' with status '{}'",
        title,
        status_summary
    );

    let omni_service = OmniService::new(omni_config.clone());

    match omni_service
        .send_task_notification(&title, &status_summary, Some(&task_url))
        .await
    {
        Ok(()) => {
            tracing::info!("Successfully sent Omni notification for task '{}'", title);
            Ok(OmniQueueAction::Sent {
                message: status_summary,
            })
        }
        Err(e) => {
            tracing::error!("Failed to send Omni notification: {}", e);
            Err(e)
        }
    }
}

fn format_status_summary(status: &str, executor: &str, branch: &str) -> String {
    match status {
        "completed" => format!("✅ Execution completed\nBranch: {branch}\nExecutor: {executor}"),
        "failed" => format!("❌ Execution failed\nBranch: {branch}\nExecutor: {executor}"),
        "killed" => format!("🛑 Execution cancelled\nBranch: {branch}\nExecutor: {executor}"),
        other => format!("{other}\nBranch: {branch}\nExecutor: {executor}"),
    }
}

fn omni_base_url() -> String {
    if let Ok(url) = std::env::var("PUBLIC_BASE_URL") {
        return url.trim_end_matches('/').to_string();
    }

    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .unwrap_or_else(|_| "8887".to_string());

    format!("http://{host}:{port}")
}

#[cfg(test)]
mod tests {
    use super::*;
    use forge_config::{ForgeConfigService, ForgeProjectSettings, OmniConfig, RecipientType};
    use httpmock::prelude::*;
    use serde_json::json;
    use sqlx::SqlitePool;
    use uuid::Uuid;

    async fn setup_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("failed to create in-memory pool");

        sqlx::query(
            r#"CREATE TABLE tasks (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT,
                parent_task_attempt TEXT,
                created_at TEXT,
                updated_at TEXT
            )"#,
        )
        .execute(&pool)
        .await
        .expect("failed to create tasks table");

        sqlx::query(
            r#"CREATE TABLE projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )"#,
        )
        .execute(&pool)
        .await
        .expect("failed to create projects table");

        sqlx::query(
            r#"CREATE TABLE task_attempts (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                branch TEXT,
                base_branch TEXT,
                executor TEXT
            )"#,
        )
        .execute(&pool)
        .await
        .expect("failed to create task_attempts table");

        sqlx::query(
            r#"CREATE TABLE execution_processes (
                id TEXT PRIMARY KEY,
                task_attempt_id TEXT NOT NULL,
                status TEXT NOT NULL,
                run_reason TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )"#,
        )
        .execute(&pool)
        .await
        .expect("failed to create execution_processes table");

        apply_forge_migrations(&pool)
            .await
            .expect("forge migrations should apply cleanly");

        pool
    }

    async fn insert_project(pool: &SqlitePool, project_id: Uuid) {
        sqlx::query("INSERT INTO projects (id, name) VALUES (?, 'Forge Project')")
            .bind(project_id)
            .execute(pool)
            .await
            .expect("failed to insert project row");
    }

    async fn insert_task_graph(pool: &SqlitePool, project_id: Uuid) -> (Uuid, Uuid) {
        let task_id = Uuid::new_v4();
        let attempt_id = Uuid::new_v4();

        sqlx::query(
            "INSERT INTO tasks (id, project_id, title, status, created_at, updated_at)
             VALUES (?, ?, 'Omni Notification Test', 'todo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        )
        .bind(task_id)
        .bind(project_id)
        .execute(pool)
        .await
        .expect("failed to insert task row");

        sqlx::query(
            "INSERT INTO task_attempts (id, task_id, branch, base_branch, executor)
             VALUES (?, ?, 'feature/test', 'main', 'forge-agent')",
        )
        .bind(attempt_id)
        .bind(task_id)
        .execute(pool)
        .await
        .expect("failed to insert task attempt row");

        (task_id, attempt_id)
    }

    fn pending_metadata(attempt_id: Uuid, project_id: Uuid) -> String {
        json!({
            "task_attempt_id": attempt_id,
            "status": "completed",
            "executor": "forge-agent",
            "branch": "feature/test",
            "project_id": project_id,
        })
        .to_string()
    }

    // Removed: branch-templates extension tests (extension deleted)

    #[tokio::test]
    async fn omni_notification_skips_when_disabled() {
        let pool = setup_pool().await;
        let project_id = Uuid::new_v4();
        insert_project(&pool, project_id).await;
        let (_task_id, attempt_id) = insert_task_graph(&pool, project_id).await;

        let config = ForgeConfigService::new(pool.clone());

        let result = handle_omni_notification(
            &pool,
            &config,
            &PendingNotification {
                id: "notif-1".into(),
                metadata: Some(pending_metadata(attempt_id, project_id)),
            },
        )
        .await
        .expect("notification with disabled config should not error");

        match result {
            OmniQueueAction::Skipped { reason } => {
                assert!(reason.contains("disabled"));
            }
            other => panic!("expected skip, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn omni_notification_requires_host_configuration() {
        let pool = setup_pool().await;
        let project_id = Uuid::new_v4();
        insert_project(&pool, ForgeConfigService::GLOBAL_PROJECT_ID).await;
        insert_project(&pool, project_id).await;
        let (_task_id, attempt_id) = insert_task_graph(&pool, project_id).await;

        let config_service = ForgeConfigService::new(pool.clone());
        let settings = ForgeProjectSettings {
            omni_enabled: true,
            omni_config: Some(OmniConfig {
                enabled: true,
                host: None,
                api_key: None,
                instance: Some("forge-instance".into()),
                recipient: Some("+15550001111".into()),
                recipient_type: Some(RecipientType::PhoneNumber),
            }),
        };

        config_service
            .set_global_settings(&settings)
            .await
            .expect("should store global settings");

        let err = handle_omni_notification(
            &pool,
            &config_service,
            &PendingNotification {
                id: "notif-missing-host".into(),
                metadata: Some(pending_metadata(attempt_id, project_id)),
            },
        )
        .await
        .expect_err("missing host should raise error");

        assert!(err.to_string().contains("Omni host"));
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn process_next_notification_marks_sent() {
        let pool = setup_pool().await;
        let project_id = Uuid::new_v4();
        insert_project(&pool, ForgeConfigService::GLOBAL_PROJECT_ID).await;
        insert_project(&pool, project_id).await;
        let (task_id, attempt_id) = insert_task_graph(&pool, project_id).await;

        let config_service = ForgeConfigService::new(pool.clone());
        let server = MockServer::start_async().await;
        let mock = server.mock(|when, then| {
            when.method(POST)
                .path("/api/v1/instance/forge-instance/send-text");
            then.status(200)
                .header("Content-Type", "application/json")
                .json_body(json!({
                    "success": true,
                    "message_id": "msg-123",
                    "status": "queued",
                    "error": null
                }));
        });
        let base_url = server.base_url();

        let settings = ForgeProjectSettings {
            omni_enabled: true,
            omni_config: Some(OmniConfig {
                enabled: true,
                host: Some(base_url.clone()),
                api_key: None,
                instance: Some("forge-instance".into()),
                recipient: Some("+15550001111".into()),
                recipient_type: Some(RecipientType::PhoneNumber),
            }),
        };
        config_service
            .set_global_settings(&settings)
            .await
            .expect("should persist omni settings");

        sqlx::query(
            "INSERT INTO forge_omni_notifications (id, task_id, notification_type, recipient, message, status, metadata)
             VALUES ('execution-1', ?, 'execution_completed', '', '', 'pending', ?)",
        )
        .bind(task_id)
        .bind(pending_metadata(attempt_id, project_id))
        .execute(&pool)
        .await
        .expect("failed to queue notification");

        let previous_url = std::env::var("PUBLIC_BASE_URL").ok();
        unsafe {
            std::env::set_var("PUBLIC_BASE_URL", "http://forge.example");
        }

        let processed = process_next_omni_notification(&pool, &config_service)
            .await
            .expect("processing should succeed");
        assert!(processed);

        let row: (String, Option<String>, Option<String>) = sqlx::query_as(
            "SELECT status, message, sent_at FROM forge_omni_notifications WHERE id = 'execution-1'",
        )
        .fetch_one(&pool)
        .await
        .expect("queue row remains accessible");

        assert_eq!(row.0, "sent");
        assert!(row.1.unwrap_or_default().contains("Execution completed"));
        assert!(row.2.is_some());

        mock.assert_async().await;

        unsafe {
            if let Some(url) = previous_url {
                std::env::set_var("PUBLIC_BASE_URL", url);
            } else {
                std::env::remove_var("PUBLIC_BASE_URL");
            }
        }
    }

    #[test]
    fn status_summary_includes_branch_and_executor() {
        let summary = format_status_summary("completed", "forge-agent", "feature/auth");
        assert!(summary.contains("forge-agent"));
        assert!(summary.contains("feature/auth"));
        assert!(summary.starts_with("✅"));
    }
}
