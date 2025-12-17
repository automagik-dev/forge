//! Forge Services
//!
//! Service composition layer that wraps upstream services with forge extensions.
//! Provides unified access to both upstream functionality and forge-specific features.

mod notification_hook;

use std::{path::Path, sync::Arc};

use anyhow::{Context, Result, anyhow};
use forge_core_db::models::project::Project;
use forge_core_deployment::Deployment;
use forge_core_server::DeploymentImpl;
// Import forge extension services from forge-core-services
use forge_core_services::services::forge_config::ForgeConfigService;
use forge_core_services::services::omni::{OmniConfig, OmniService};
use serde::Deserialize;
use serde_json::json;
use sqlx::{Row, SqlitePool};
use tokio::{
    sync::RwLock,
    time::{Duration, sleep},
};
use uuid::Uuid;

/// Main forge services container
#[derive(Clone)]
pub struct ForgeServices {
    pub deployment: Arc<DeploymentImpl>,
    pub omni: Arc<RwLock<OmniService>>,
    pub config: Arc<ForgeConfigService>,
    pub pool: SqlitePool,
}

impl ForgeServices {
    pub async fn new() -> Result<Self> {
        // Initialize upstream deployment (handles DB, sentry, analytics, etc.)
        // Note: All migrations (including forge-specific) are now in upstream/crates/db/migrations
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

        // Reuse upstream pool for forge features
        let pool = deployment.db().pool.clone();

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

    /// Load executor profiles for a specific workspace (Forge feature with hot-reload)
    /// Merges: defaults → user overrides → .genie folder profiles
    ///
    /// This is a Forge-specific feature that extends upstream profile loading
    /// with per-project .genie folder discovery and automatic hot-reload.
    ///
    /// The first call initializes a file watcher that automatically reloads
    /// profiles when .genie/*.md files change.
    pub async fn load_profiles_for_workspace(
        &self,
        workspace_root: &Path,
    ) -> Result<forge_core_executors::profile::ExecutorConfigs> {
        // Use the profile cache manager from deployment (with hot-reload)
        self.deployment
            .profile_cache()
            .get_profiles(workspace_root)
            .await
    }

    /// Ensure a project's executor profiles are available in the cache.
    ///
    /// Projects created after the server starts are not registered automatically,
    /// so we fetch the project, warm the cache for its workspace, and register it.
    pub async fn ensure_project_registered_in_profile_cache(
        &self,
        project_id: Uuid,
    ) -> Result<bool> {
        let Some(project) = Project::find_by_id(&self.pool, project_id).await? else {
            return Ok(false);
        };

        let workspace_root = project.git_repo_path.clone();

        // Warm cache/watchers for this workspace before registering
        self.load_profiles_for_workspace(&workspace_root).await?;

        self.deployment
            .profile_cache()
            .register_project(project_id, workspace_root)
            .await;

        Ok(true)
    }

    /// Load .genie profiles for all existing projects on server startup
    ///
    /// This method is called during server initialization to discover and cache
    /// .genie profiles for all existing projects in the database. For each project
    /// with a .genie folder, it initializes the profile cache and starts file watching.
    pub async fn load_genie_profiles_for_all_projects(&self) -> Result<()> {
        tracing::info!("Starting to load .genie profiles for all projects...");

        // Query all projects from database
        tracing::debug!("Querying all projects from database...");
        let projects = Project::find_all(&self.pool).await?;
        tracing::debug!("Found {} projects in database", projects.len());

        if projects.is_empty() {
            tracing::info!("No existing projects found to load .genie profiles from");
            return Ok(());
        }

        let project_count = projects.len();
        tracing::info!("Scanning {} projects for .genie profiles", project_count);

        let mut loaded_count = 0;
        let mut total_variants = 0;

        for project in projects {
            let genie_path = project.git_repo_path.join(".genie");

            tracing::debug!(
                "Checking project '{}' at path: {:?}",
                project.name,
                project.git_repo_path
            );

            if !genie_path.exists() || !genie_path.is_dir() {
                tracing::debug!(
                    "Project '{}' has no .genie folder at {:?}",
                    project.name,
                    genie_path
                );
                continue;
            }

            tracing::info!(
                "📁 Loading .genie profiles for project: {} ({})",
                project.name,
                project.git_repo_path.display()
            );

            tracing::debug!("Calling load_profiles_for_workspace...");
            match self
                .load_profiles_for_workspace(&project.git_repo_path)
                .await
            {
                Ok(configs) => {
                    let variant_count: usize = configs
                        .executors
                        .values()
                        .map(|e| e.configurations.len())
                        .sum();

                    // Register project → workspace mapping
                    self.deployment
                        .profile_cache()
                        .register_project(project.id, project.git_repo_path.clone())
                        .await;

                    tracing::info!(
                        "✅ Loaded {} profile variants for project: {} (registered project_id: {})",
                        variant_count,
                        project.name,
                        project.id
                    );

                    loaded_count += 1;
                    total_variants += variant_count;
                }
                Err(e) => {
                    tracing::warn!(
                        "⚠️  Failed to load .genie profiles for project '{}': {}",
                        project.name,
                        e
                    );
                    // Don't fail startup if one project has invalid profiles
                }
            }
        }

        if loaded_count > 0 {
            tracing::info!(
                "🎉 Successfully loaded .genie profiles for {}/{} projects ({} total variants)",
                loaded_count,
                project_count,
                total_variants
            );
        } else {
            tracing::info!("No projects with .genie folders found");
        }

        Ok(())
    }
}

/// Backfill base_branch column for legacy Vibe Kanban databases
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

fn spawn_omni_notification_worker(pool: SqlitePool, config: Arc<ForgeConfigService>) {
    tokio::spawn(async move {
        let mut consecutive_failures = 0u32;
        const MAX_CONSECUTIVE_FAILURES: u32 = 10;

        loop {
            match process_next_omni_notification(&pool, &config).await {
                Ok(true) => {
                    // Processed at least one item, reset failure counter
                    consecutive_failures = 0;
                    continue;
                }
                Ok(false) => {
                    // Queue empty → reset counter and short backoff
                    consecutive_failures = 0;
                    sleep(Duration::from_secs(10)).await;
                }
                Err(err) => {
                    consecutive_failures += 1;
                    tracing::error!(
                        consecutive_failures = consecutive_failures,
                        "Omni notification worker error: {err:?}"
                    );

                    if consecutive_failures >= MAX_CONSECUTIVE_FAILURES {
                        tracing::error!(
                            "Omni worker disabled after {} consecutive failures",
                            consecutive_failures
                        );
                        break;
                    }

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
        .with_context(|| format!("invalid task_attempt_id UUID: {attempt_id_str}"))?;
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
        Uuid::parse_str(&pid_str).with_context(|| format!("invalid project_id UUID: {pid_str}"))?
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
    use url::Url;

    // Priority 1: Explicit PUBLIC_BASE_URL (for tunnels/production)
    if let Ok(url_str) = std::env::var("PUBLIC_BASE_URL") {
        // Validate URL format and scheme
        match Url::parse(&url_str) {
            Ok(parsed_url) => {
                // Only allow http and https schemes
                if parsed_url.scheme() == "http" || parsed_url.scheme() == "https" {
                    return url_str.trim_end_matches('/').to_string();
                } else {
                    tracing::warn!(
                        "PUBLIC_BASE_URL has invalid scheme '{}' (only http/https allowed), falling back to HOST/PORT",
                        parsed_url.scheme()
                    );
                }
            }
            Err(e) => {
                tracing::warn!(
                    "PUBLIC_BASE_URL is not a valid URL ({}), falling back to HOST/PORT",
                    e
                );
            }
        }
    }

    // Priority 2: HOST/BACKEND_PORT env vars (for custom deployments)
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .unwrap_or_else(|_| "8887".to_string());

    // Sanitize host: only allow alphanumeric, dots, hyphens, and colons (for IPv6)
    let sanitized_host = sanitize_hostname(&host);
    if sanitized_host != host {
        tracing::warn!(
            "HOST env var contains invalid characters, sanitized '{}' -> '{}'",
            host,
            sanitized_host
        );
    }

    // Sanitize port: only allow digits
    let sanitized_port = sanitize_port(&port);
    if sanitized_port != port {
        tracing::warn!(
            "PORT env var contains invalid characters, sanitized '{}' -> '{}'",
            port,
            sanitized_port
        );
    }

    format!("http://{sanitized_host}:{sanitized_port}")
}

/// Sanitize hostname to prevent injection attacks
/// Allows: alphanumeric, dots, hyphens
/// Also allows colons and square brackets only for IPv6 addresses (when wrapped in brackets or contains multiple colons)
fn sanitize_hostname(host: &str) -> String {
    // Check if this looks like an IPv6 address (contains [ or has multiple colons)
    let is_ipv6 = host.starts_with('[') || host.matches(':').count() > 1;

    if is_ipv6 {
        // For IPv6, allow colons and square brackets
        host.chars()
            .filter(|c| {
                c.is_alphanumeric() || *c == '.' || *c == '-' || *c == ':' || *c == '[' || *c == ']'
            })
            .collect()
    } else {
        // For regular hostnames, don't allow colons (prevents header injection)
        host.chars()
            .filter(|c| c.is_alphanumeric() || *c == '.' || *c == '-')
            .collect()
    }
}

/// Sanitize port to prevent injection attacks
/// Allows: digits only
fn sanitize_port(port: &str) -> String {
    port.chars().filter(|c| c.is_ascii_digit()).collect()
}

#[cfg(test)]
mod tests;
