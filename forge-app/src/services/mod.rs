//! Forge Services
//!
//! Service composition layer that wraps upstream services with forge extensions.
//! Provides unified access to both upstream functionality and forge-specific features.

use anyhow::{Context, Result};
use deployment::Deployment;
use serde_json::json;
use server::DeploymentImpl;
use sqlx::{sqlite::SqliteConnectOptions, ConnectOptions, SqlitePool};
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

// Import forge extension services
use forge_branch_templates::BranchTemplateService;
use forge_config::ForgeConfigService;
use forge_omni::{OmniConfig, OmniService};

/// Main forge services container
#[derive(Clone)]
pub struct ForgeServices {
    #[allow(dead_code)]
    pub deployment: Arc<DeploymentImpl>,
    pub omni: Arc<RwLock<OmniService>>,
    pub branch_templates: Arc<BranchTemplateService>,
    pub config: Arc<ForgeConfigService>,
    pub pool: SqlitePool,
}

impl ForgeServices {
    pub async fn new() -> Result<Self> {
        purge_shared_migration_markers().await?;

        // Initialize upstream deployment (handles DB, sentry, analytics, etc.)
        let deployment = DeploymentImpl::new().await?;

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

        let forge_tables_ready = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(1) FROM sqlite_master WHERE type = 'table' AND name = 'forge_task_extensions'",
        )
        .fetch_one(&pool)
        .await
        .unwrap_or(0)
            > 0;

        tracing::debug!(forge_tables_ready, "Forge migration readiness check");

        apply_forge_migrations(&pool).await?;

        // Initialize forge extension services
        let config = Arc::new(ForgeConfigService::new(pool.clone()));
        let global_settings = config.get_global_settings().await?;
        let omni_config = config.effective_omni_config(None).await?;
        let omni = Arc::new(RwLock::new(OmniService::new(omni_config)));

        tracing::info!(
            forge_branch_templates_enabled = global_settings.branch_templates_enabled,
            forge_omni_enabled = global_settings.omni_enabled,
            "Loaded forge extension settings from auxiliary schema"
        );
        let branch_templates = Arc::new(BranchTemplateService::new(pool.clone()));

        Ok(Self {
            deployment,
            omni,
            branch_templates,
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

        let table_exists: bool = sqlx::query_scalar(
            "SELECT COUNT(1) FROM sqlite_master WHERE type = 'table' AND name = '_sqlx_migrations'",
        )
        .fetch_one(&mut conn)
        .await
        .unwrap_or(0)
            > 0;

        if !table_exists {
            continue;
        }

        let deleted = sqlx::query("DELETE FROM _sqlx_migrations WHERE version IN (0,1,2)")
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

const FORGE_MIGRATIONS: &[ForgeMigration] = &[
    ForgeMigration {
        version: "20250924090000",
        description: "add_branch_template_column",
        sql: include_str!("../../migrations/20250924090000_add_branch_template_column.sql"),
    },
    ForgeMigration {
        version: "20250924090001",
        description: "auxiliary_tables",
        sql: include_str!("../../migrations/20250924090001_auxiliary_tables.sql"),
    },
    ForgeMigration {
        version: "20250924090002",
        description: "migrate_branch_template_data",
        sql: include_str!("../../migrations/20250924090002_migrate_data.sql"),
    },
];

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
            statements.push(current.trim().trim_end_matches(';').to_string());
            current.clear();
        }
    }

    if !current.trim().is_empty() {
        statements.push(current.trim().trim_end_matches(';').to_string());
    }

    statements
}

fn should_ignore_migration_error(version: &str, statement: &str, err: &sqlx::Error) -> bool {
    if version == "20250924090000"
        && statement
            .to_ascii_lowercase()
            .starts_with("alter table tasks add column branch_template")
    {
        if let sqlx::Error::Database(db_err) = err {
            if db_err.message().contains("duplicate column name") {
                return true;
            }
        }
    }

    false
}
