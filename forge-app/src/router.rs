//! Forge Router
//!
//! Routes forge-specific APIs under `/api/forge/*` and upstream APIs under `/api/*`.
//! Serves single frontend (with overlay architecture) at `/`.

use axum::{
    Json, Router,
    extract::{
        FromRef, Path, Query, State,
        ws::{WebSocket, WebSocketUpgrade},
    },
    http::{HeaderValue, Method, StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use futures_util::{SinkExt, StreamExt, TryStreamExt};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

use crate::services::ForgeServices;
use db::models::{
    image::TaskImage,
    task::{Task, TaskWithAttemptStatus},
    task_attempt::{CreateTaskAttempt, TaskAttempt},
};
use deployment::Deployment;
use executors::profile::ExecutorProfileId;
use forge_config::ForgeProjectSettings;
use server::routes::{
    self as upstream, approvals, auth, config as upstream_config, containers, drafts, events,
    execution_processes, filesystem, images, projects, tags, task_attempts, tasks,
};
use server::{DeploymentImpl, error::ApiError, routes::tasks::CreateAndStartTaskRequest};
use services::services::container::ContainerService;
use sqlx::{self, Error as SqlxError, Row};
use utils::log_msg::LogMsg;
use utils::response::ApiResponse;
use utils::text::{git_branch_id, short_uuid};

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct Frontend;

#[derive(Clone)]
struct ForgeAppState {
    services: ForgeServices,
    deployment: DeploymentImpl,
    auth_required: bool,
}

impl ForgeAppState {
    fn new(services: ForgeServices, deployment: DeploymentImpl, auth_required: bool) -> Self {
        Self {
            services,
            deployment,
            auth_required,
        }
    }
}

impl FromRef<ForgeAppState> for ForgeServices {
    fn from_ref(state: &ForgeAppState) -> ForgeServices {
        state.services.clone()
    }
}

impl FromRef<ForgeAppState> for DeploymentImpl {
    fn from_ref(state: &ForgeAppState) -> DeploymentImpl {
        state.deployment.clone()
    }
}

pub fn create_router(services: ForgeServices, auth_required: bool) -> Router {
    let deployment = services.deployment.as_ref().clone();
    let state = ForgeAppState::new(services, deployment.clone(), auth_required);

    let upstream_api = upstream_api_router(&deployment);

    // Configure CORS for Swagger UI and external API access
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health_check))
        .route("/docs", get(serve_swagger_ui))
        .route("/api/openapi.json", get(serve_openapi_spec))
        .route("/api/routes", get(list_routes))
        // Public PWA manifest - must be accessible without authentication
        .route("/site.webmanifest", get(serve_assets_public))
        .merge(forge_api_routes())
        // Upstream API at /api
        .nest("/api", upstream_api)
        // Single frontend with overlay architecture
        .fallback(frontend_handler)
        .layer(cors)
        .with_state(state)
}

fn forge_api_routes() -> Router<ForgeAppState> {
    Router::new()
        .route("/api/forge/auth-required", get(get_auth_required))
        .route(
            "/api/forge/config",
            get(get_forge_config).put(update_forge_config),
        )
        .route(
            "/api/forge/projects/{project_id}/settings",
            get(get_project_settings).put(update_project_settings),
        )
        .route(
            "/api/forge/projects/{project_id}/profiles",
            get(get_project_profiles),
        )
        .route(
            "/api/forge/projects/{project_id}/branch-status",
            get(get_project_branch_status),
        )
        .route(
            "/api/forge/projects/{project_id}/pull",
            post(post_project_pull),
        )
        .route("/api/forge/omni/status", get(get_omni_status))
        .route("/api/forge/omni/instances", get(list_omni_instances))
        .route("/api/forge/omni/validate", post(validate_omni_config))
        .route(
            "/api/forge/omni/notifications",
            get(list_omni_notifications),
        )
        .route("/api/forge/releases", get(get_github_releases))
        .route(
            "/api/forge/master-genie/{attempt_id}/neurons",
            get(get_master_genie_neurons),
        )
        .route(
            "/api/forge/neurons/{neuron_attempt_id}/subtasks",
            get(get_neuron_subtasks),
        )
        .route(
            "/api/forge/agents",
            get(get_forge_agents).post(create_forge_agent),
        )
    // Branch-templates extension removed - using simple forge/ prefix
}

/// Forge-specific CreateTask that includes is_agent field
#[derive(Debug, Serialize, Deserialize)]
struct ForgeCreateTask {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub parent_task_attempt: Option<Uuid>,
    pub image_ids: Option<Vec<Uuid>>,
    pub is_agent: Option<bool>, // Forge extension: mark as agent-managed task
}

/// Forge override: create task (standard behavior, no special status handling)
/// The is_agent field is kept for future use but not currently used in task creation
async fn forge_create_task(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<ForgeCreateTask>,
) -> Result<Json<ApiResponse<Task>>, ApiError> {
    let task_id = Uuid::new_v4();
    let task = Task::create(
        &deployment.db().pool,
        &db::models::task::CreateTask {
            project_id: payload.project_id,
            title: payload.title,
            description: payload.description,
            parent_task_attempt: payload.parent_task_attempt,
            image_ids: payload.image_ids.clone(),
        },
        task_id,
    )
    .await?;

    if let Some(image_ids) = &payload.image_ids {
        TaskImage::associate_many(&deployment.db().pool, task.id, image_ids).await?;
    }

    deployment
        .track_if_analytics_allowed(
            "task_created",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "project_id": task.project_id,
                "has_description": task.description.is_some(),
                "has_images": payload.image_ids.is_some(),
            }),
        )
        .await;

    Ok(Json(ApiResponse::success(task)))
}

/// Forge-specific CreateTaskAttemptBody that includes use_worktree field
#[derive(Debug, Serialize, Deserialize)]
struct ForgeCreateTaskAttemptBody {
    pub task_id: Uuid,
    pub executor_profile_id: ExecutorProfileId,
    pub base_branch: String,
    #[serde(default = "default_use_worktree")]
    pub use_worktree: bool,
}

fn default_use_worktree() -> bool {
    true
}

impl ForgeCreateTaskAttemptBody {
    pub fn get_executor_profile_id(&self) -> ExecutorProfileId {
        self.executor_profile_id.clone()
    }
}

/// Forge override: create task attempt with forge/ branch prefix (vk -> forge only)
async fn forge_create_task_attempt(
    State(deployment): State<DeploymentImpl>,
    State(forge_services): State<ForgeServices>,
    Json(payload): Json<ForgeCreateTaskAttemptBody>,
) -> Result<Json<ApiResponse<TaskAttempt>>, ApiError> {
    let executor_profile_id = payload.get_executor_profile_id();
    let task = Task::find_by_id(&deployment.db().pool, payload.task_id)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    let attempt_id = Uuid::new_v4();

    // If use_worktree is false, use the current branch (base_branch) directly
    // Otherwise, generate a new branch name for the worktree with "forge" prefix
    let git_branch_name = if payload.use_worktree {
        let task_title_id = git_branch_id(&task.title);
        let short_id = short_uuid(&attempt_id);
        format!("forge/{}-{}", short_id, task_title_id)
    } else {
        payload.base_branch.clone()
    };

    let mut task_attempt = TaskAttempt::create(
        &deployment.db().pool,
        &CreateTaskAttempt {
            executor: executor_profile_id.executor,
            base_branch: payload.base_branch.clone(),
            branch: git_branch_name.clone(),
        },
        attempt_id,
        payload.task_id,
    )
    .await?;

    // Insert use_worktree flag into forge_task_attempt_config
    sqlx::query(
        "INSERT INTO forge_task_attempt_config (task_attempt_id, use_worktree) VALUES (?, ?)",
    )
    .bind(attempt_id)
    .bind(payload.use_worktree)
    .execute(&deployment.db().pool)
    .await?;

    // Store executor with variant for agent task filtering
    if let Some(variant) = &executor_profile_id.variant {
        let executor_with_variant = format!("{}:{}", executor_profile_id.executor, variant);
        sqlx::query(
            "UPDATE task_attempts SET executor = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .bind(&executor_with_variant)
        .bind(attempt_id)
        .execute(&deployment.db().pool)
        .await?;
        task_attempt.executor = executor_with_variant;
    }

    // Get project to determine workspace root
    let project = task
        .parent_project(&deployment.db().pool)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    // Load workspace-specific .genie profiles and inject into global cache just-in-time
    if let Ok(workspace_profiles) = forge_services
        .load_profiles_for_workspace(&project.git_repo_path)
        .await
    {
        // Log profile details for validation
        let variant_count = workspace_profiles
            .executors
            .values()
            .map(|config| config.configurations.len())
            .sum::<usize>();

        let variant_list: Vec<String> = workspace_profiles
            .executors
            .iter()
            .flat_map(|(executor, config)| {
                config
                    .configurations
                    .iter()
                    .map(move |(variant, coding_agent)| {
                        // Extract append_prompt from the CodingAgent enum
                        let prompt_preview = match coding_agent {
                            executors::executors::CodingAgent::ClaudeCode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Codex(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Amp(cfg) => cfg.append_prompt.get(),
                            executors::executors::CodingAgent::Gemini(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Opencode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::CursorAgent(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::QwenCode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Copilot(cfg) => {
                                cfg.append_prompt.get()
                            }
                        }
                        .map(|p| {
                            let trimmed = p.trim();
                            if trimmed.len() > 60 {
                                format!("{}...", &trimmed[..60])
                            } else {
                                trimmed.to_string()
                            }
                        })
                        .unwrap_or_else(|| "<none>".to_string());

                        format!("{}:{} ({})", executor, variant, prompt_preview)
                    })
            })
            .collect();

        tracing::info!(
            "🔧 Injected {} .genie profile variant(s) for workspace: {} | Profiles: [{}]",
            variant_count,
            project.git_repo_path.display(),
            variant_list.join(", ")
        );

        executors::profile::ExecutorConfigs::set_cached(workspace_profiles);
    } else {
        tracing::warn!(
            "⚠️  Failed to load .genie profiles for workspace: {}, using defaults",
            project.git_repo_path.display()
        );
    }

    let _execution_process = deployment
        .container()
        .start_attempt(&task_attempt, executor_profile_id.clone())
        .await?;

    deployment
        .track_if_analytics_allowed(
            "task_attempt_started",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "executor": &executor_profile_id.executor,
                "attempt_id": task_attempt.id.to_string(),
            }),
        )
        .await;

    Ok(Json(ApiResponse::success(task_attempt)))
}

/// Forge override: create task and start with forge/ branch prefix (vk -> forge only)
async fn forge_create_task_and_start(
    State(deployment): State<DeploymentImpl>,
    State(forge_services): State<ForgeServices>,
    Json(payload): Json<CreateAndStartTaskRequest>,
) -> Result<Json<ApiResponse<TaskWithAttemptStatus>>, ApiError> {
    let task_id = Uuid::new_v4();
    let task = Task::create(&deployment.db().pool, &payload.task, task_id).await?;

    if let Some(image_ids) = &payload.task.image_ids {
        TaskImage::associate_many(&deployment.db().pool, task.id, image_ids).await?;
    }

    deployment
        .track_if_analytics_allowed(
            "task_created",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "project_id": task.project_id,
                "has_description": task.description.is_some(),
                "has_images": payload.task.image_ids.is_some(),
            }),
        )
        .await;

    let task_attempt_id = Uuid::new_v4();

    // Use same logic as upstream but replace "vk" with "forge" prefix
    let task_title_id = git_branch_id(&task.title);
    let short_id = short_uuid(&task_attempt_id);
    let branch_name = format!("forge/{}-{}", short_id, task_title_id);

    let mut task_attempt = TaskAttempt::create(
        &deployment.db().pool,
        &CreateTaskAttempt {
            executor: payload.executor_profile_id.executor,
            base_branch: payload.base_branch.clone(),
            branch: branch_name,
        },
        task_attempt_id,
        task.id,
    )
    .await?;

    // Insert use_worktree flag into forge_task_attempt_config (defaults to true for regular tasks)
    sqlx::query(
        "INSERT INTO forge_task_attempt_config (task_attempt_id, use_worktree) VALUES (?, ?)",
    )
    .bind(task_attempt_id)
    .bind(true) // Regular tasks always use worktree
    .execute(&deployment.db().pool)
    .await?;

    // Store executor with variant for agent task filtering
    if let Some(variant) = &payload.executor_profile_id.variant {
        let executor_with_variant = format!("{}:{}", payload.executor_profile_id.executor, variant);
        sqlx::query(
            "UPDATE task_attempts SET executor = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .bind(&executor_with_variant)
        .bind(task_attempt_id)
        .execute(&deployment.db().pool)
        .await?;
        task_attempt.executor = executor_with_variant;
    }

    // Get project to determine workspace root
    let project = task
        .parent_project(&deployment.db().pool)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    // Load workspace-specific .genie profiles and inject into global cache just-in-time
    if let Ok(workspace_profiles) = forge_services
        .load_profiles_for_workspace(&project.git_repo_path)
        .await
    {
        // Log profile details for validation
        let variant_count = workspace_profiles
            .executors
            .values()
            .map(|config| config.configurations.len())
            .sum::<usize>();

        let variant_list: Vec<String> = workspace_profiles
            .executors
            .iter()
            .flat_map(|(executor, config)| {
                config
                    .configurations
                    .iter()
                    .map(move |(variant, coding_agent)| {
                        // Extract append_prompt from the CodingAgent enum
                        let prompt_preview = match coding_agent {
                            executors::executors::CodingAgent::ClaudeCode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Codex(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Amp(cfg) => cfg.append_prompt.get(),
                            executors::executors::CodingAgent::Gemini(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Opencode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::CursorAgent(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::QwenCode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Copilot(cfg) => {
                                cfg.append_prompt.get()
                            }
                        }
                        .map(|p| {
                            let trimmed = p.trim();
                            if trimmed.len() > 60 {
                                format!("{}...", &trimmed[..60])
                            } else {
                                trimmed.to_string()
                            }
                        })
                        .unwrap_or_else(|| "<none>".to_string());

                        format!("{}:{} ({})", executor, variant, prompt_preview)
                    })
            })
            .collect();

        tracing::info!(
            "🔧 Injected {} .genie profile variant(s) for workspace: {} | Profiles: [{}]",
            variant_count,
            project.git_repo_path.display(),
            variant_list.join(", ")
        );

        executors::profile::ExecutorConfigs::set_cached(workspace_profiles);
    } else {
        tracing::warn!(
            "⚠️  Failed to load .genie profiles for workspace: {}, using defaults",
            project.git_repo_path.display()
        );
    }

    let execution_process = deployment
        .container()
        .start_attempt(&task_attempt, payload.executor_profile_id.clone())
        .await?;

    deployment
        .track_if_analytics_allowed(
            "task_attempt_started",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "executor": &payload.executor_profile_id.executor,
                "variant": &payload.executor_profile_id.variant,
                "attempt_id": task_attempt.id.to_string(),
            }),
        )
        .await;

    let task = Task::find_by_id(&deployment.db().pool, task.id)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    tracing::info!(
        "Started execution process {} with forge/ branch",
        execution_process.id
    );
    Ok(Json(ApiResponse::success(TaskWithAttemptStatus {
        task,
        has_in_progress_attempt: true,
        has_merged_attempt: false,
        last_attempt_failed: false,
        executor: task_attempt.executor,
    })))
}

fn upstream_api_router(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    let mut router = Router::new().route("/health", get(upstream::health::health_check));

    let dep_clone = deployment.clone();

    // Forge override: config router with increased body limit for /profiles
    router = router.merge(forge_config_router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(containers::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(projects::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(drafts::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));

    // Build custom tasks router with forge override (already typed as ForgeAppState)
    let tasks_router_with_override = build_tasks_router_with_forge_override(deployment);
    router = router.merge(tasks_router_with_override);

    // Build custom task_attempts router with forge override (already typed as ForgeAppState)
    let task_attempts_router_with_override =
        build_task_attempts_router_with_forge_override(deployment);
    router = router.merge(task_attempts_router_with_override);
    router = router.merge(
        execution_processes::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()),
    );
    router = router.merge(auth::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(tags::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(filesystem::router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(events::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(approvals::router().with_state::<ForgeAppState>(dep_clone.clone()));

    router.nest(
        "/images",
        forge_images_router().with_state::<ForgeAppState>(dep_clone),
    )
}

/// Build tasks router with forge override for create-and-start endpoint
fn build_tasks_router_with_forge_override(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    use axum::middleware::from_fn_with_state;
    use server::middleware::load_task_middleware;

    let task_id_router = Router::new()
        .route(
            "/",
            get(tasks::get_task)
                .put(tasks::update_task)
                .delete(tasks::delete_task),
        )
        .layer(from_fn_with_state(deployment.clone(), load_task_middleware));

    let inner = Router::new()
        .route("/", get(forge_get_tasks).post(forge_create_task)) // Forge: override list to exclude agent tasks; creation only
        .route("/stream/ws", get(forge_stream_tasks_ws)) // Forge: WebSocket stream with agent filtering
        .route("/create-and-start", post(forge_create_task_and_start)) // Forge: create + start
        .nest("/{task_id}", task_id_router);

    Router::new().nest("/tasks", inner)
}

#[derive(Deserialize)]
struct GetTasksParams {
    project_id: Uuid,
}

/// Forge override for list tasks: Exclude agent tasks (those in forge_agents table)
/// Agent tasks are managed separately via /api/forge/agents
async fn forge_get_tasks(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<GetTasksParams>,
) -> Result<Json<ApiResponse<Vec<TaskWithAttemptStatus>>>, ApiError> {
    let pool = &deployment.db().pool;

    // Exclude tasks that are registered as agent tasks in forge_agents table
    let query_str = r#"SELECT
  t.id                            AS "id",
  t.project_id                    AS "project_id",
  t.title,
  t.description,
  t.status                        AS "status",
  t.parent_task_attempt           AS "parent_task_attempt",
  t.created_at                    AS "created_at",
  t.updated_at                    AS "updated_at",

  CASE WHEN EXISTS (
    SELECT 1
      FROM task_attempts ta
      JOIN execution_processes ep
        ON ep.task_attempt_id = ta.id
     WHERE ta.task_id       = t.id
       AND ep.status        = 'running'
       AND ep.run_reason IN ('setupscript','cleanupscript','codingagent')
     LIMIT 1
  ) THEN 1 ELSE 0 END            AS has_in_progress_attempt,

  CASE WHEN (
    SELECT ep.status
      FROM task_attempts ta
      JOIN execution_processes ep
        ON ep.task_attempt_id = ta.id
     WHERE ta.task_id       = t.id
     AND ep.run_reason IN ('setupscript','cleanupscript','codingagent')
     ORDER BY ep.created_at DESC
     LIMIT 1
  ) IN ('failed','killed') THEN 1 ELSE 0 END
                                 AS last_attempt_failed,

  ( SELECT ta.executor
      FROM task_attempts ta
      WHERE ta.task_id = t.id
     ORDER BY ta.created_at DESC
      LIMIT 1
    )                               AS executor

FROM tasks t
WHERE t.project_id = ?
  AND t.id NOT IN (SELECT task_id FROM forge_agents)
ORDER BY t.created_at DESC"#;

    let rows = sqlx::query(query_str)
        .bind(params.project_id)
        .fetch_all(pool)
        .await?;

    let mut items: Vec<TaskWithAttemptStatus> = Vec::with_capacity(rows.len());
    for row in rows {
        let task_id: Uuid = row.try_get("id").map_err(ApiError::Database)?;
        let task = db::models::task::Task::find_by_id(pool, task_id)
            .await?
            .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

        let has_in_progress_attempt = row
            .try_get::<i64, _>("has_in_progress_attempt")
            .map(|v| v != 0)
            .unwrap_or(false);
        let last_attempt_failed = row
            .try_get::<i64, _>("last_attempt_failed")
            .map(|v| v != 0)
            .unwrap_or(false);
        let executor: String = row.try_get("executor").unwrap_or_else(|_| String::new());

        items.push(TaskWithAttemptStatus {
            task,
            has_in_progress_attempt,
            has_merged_attempt: false,
            last_attempt_failed,
            executor,
        });
    }

    Ok(Json(ApiResponse::success(items)))
}

/// Forge WebSocket stream handler with agent task filtering
/// Streams tasks for a project via WebSocket, excluding agent tasks
#[derive(Deserialize)]
struct TaskQuery {
    project_id: Uuid,
}

async fn forge_stream_tasks_ws(
    ws: WebSocketUpgrade,
    State(deployment): State<DeploymentImpl>,
    Query(query): Query<TaskQuery>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        if let Err(e) = handle_forge_tasks_ws(socket, deployment, query.project_id).await {
            tracing::warn!("forge tasks WS closed: {}", e);
        }
    })
}

async fn handle_forge_tasks_ws(
    socket: WebSocket,
    deployment: DeploymentImpl,
    project_id: Uuid,
) -> anyhow::Result<()> {
    let pool = deployment.db().pool.clone();

    // Batch query for all agent task IDs at initialization (fixes N+1 pattern)
    let agent_task_ids: Arc<RwLock<HashSet<Uuid>>> = {
        let agent_tasks: Vec<Uuid> = sqlx::query_scalar(
            "SELECT task_id FROM forge_agents fa
             INNER JOIN tasks t ON fa.task_id = t.id
             WHERE t.project_id = ?",
        )
        .bind(project_id)
        .fetch_all(&pool)
        .await
        .unwrap_or_else(|e| {
            tracing::warn!(
                "Failed to fetch initial agent task IDs for project {}: {}",
                project_id,
                e
            );
            Vec::new()
        });

        Arc::new(RwLock::new(agent_tasks.into_iter().collect()))
    };

    // Spawn background task to refresh agent task IDs periodically
    // Store the handle so we can abort it when the WebSocket closes
    let refresh_cache = agent_task_ids.clone();
    let refresh_pool = pool.clone();
    let refresh_project_id = project_id;
    let refresh_task_handle = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        loop {
            interval.tick().await;

            match sqlx::query_scalar::<_, Uuid>(
                "SELECT task_id FROM forge_agents fa
                 INNER JOIN tasks t ON fa.task_id = t.id
                 WHERE t.project_id = ?",
            )
            .bind(refresh_project_id)
            .fetch_all(&refresh_pool)
            .await
            {
                Ok(tasks) => {
                    let mut cache = refresh_cache.write().await;
                    cache.clear();
                    cache.extend(tasks);
                    tracing::trace!(
                        "Refreshed agent task cache for project {}: {} tasks",
                        refresh_project_id,
                        cache.len()
                    );
                }
                Err(e) => {
                    tracing::warn!(
                        "Failed to refresh agent task cache for project {}: {}",
                        refresh_project_id,
                        e
                    );
                }
            }
        }
    });

    // Get the raw stream from upstream (includes initial snapshot + live updates)
    // Filter out agent tasks using cache with DB fallback for unknown tasks
    let stream = deployment
        .events()
        .stream_tasks_raw(project_id)
        .await?
        .filter_map(move |msg_result| {
            let agent_task_ids = agent_task_ids.clone();
            let pool = pool.clone();
            async move {
                match msg_result {
                    Ok(LogMsg::JsonPatch(patch)) => {
                        // Check if this patch contains agent tasks we need to filter out
                        if let Some(patch_op) = patch.0.first() {
                            // Handle direct task patches (new format)
                            if patch_op.path().starts_with("/tasks/") {
                                match patch_op {
                                    json_patch::PatchOperation::Add(op) => {
                                        if let Ok(task_with_status) =
                                            serde_json::from_value::<TaskWithAttemptStatus>(
                                                op.value.clone(),
                                            )
                                        {
                                            let task_id = task_with_status.task.id;

                                            // First check cache (read lock, released before any await)
                                            let in_cache = {
                                                let cache = agent_task_ids.read().await;
                                                cache.contains(&task_id)
                                            };

                                            let is_agent = if in_cache {
                                                true
                                            } else {
                                                // Fallback: DB query for tasks not in cache
                                                // This ensures newly created agent tasks are filtered immediately
                                                let is_agent_db: bool = sqlx::query_scalar(
                                                    "SELECT EXISTS(SELECT 1 FROM forge_agents WHERE task_id = ?)",
                                                )
                                                .bind(task_id)
                                                .fetch_one(&pool)
                                                .await
                                                .unwrap_or_else(|e| {
                                                    tracing::warn!(
                                                        "Failed to check forge_agents for task {}: {}",
                                                        task_id,
                                                        e
                                                    );
                                                    false
                                                });

                                                // If it's an agent, update cache so subsequent patches don't hit DB
                                                if is_agent_db {
                                                    let mut cache = agent_task_ids.write().await;
                                                    cache.insert(task_id);
                                                }

                                                is_agent_db
                                            };

                                            if !is_agent {
                                                return Some(Ok(LogMsg::JsonPatch(patch)));
                                            }
                                            // Filter out agent tasks
                                            return None;
                                        }
                                    }
                                    json_patch::PatchOperation::Replace(op) => {
                                        if let Ok(task_with_status) =
                                            serde_json::from_value::<TaskWithAttemptStatus>(
                                                op.value.clone(),
                                            )
                                        {
                                            let task_id = task_with_status.task.id;

                                            // First check cache (read lock, released before any await)
                                            let in_cache = {
                                                let cache = agent_task_ids.read().await;
                                                cache.contains(&task_id)
                                            };

                                            let is_agent = if in_cache {
                                                true
                                            } else {
                                                // Fallback: DB query for tasks not in cache
                                                // This ensures newly created agent tasks are filtered immediately
                                                let is_agent_db: bool = sqlx::query_scalar(
                                                    "SELECT EXISTS(SELECT 1 FROM forge_agents WHERE task_id = ?)",
                                                )
                                                .bind(task_id)
                                                .fetch_one(&pool)
                                                .await
                                                .unwrap_or_else(|e| {
                                                    tracing::warn!(
                                                        "Failed to check forge_agents for task {}: {}",
                                                        task_id,
                                                        e
                                                    );
                                                    false
                                                });

                                                // If it's an agent, update cache so subsequent patches don't hit DB
                                                if is_agent_db {
                                                    let mut cache = agent_task_ids.write().await;
                                                    cache.insert(task_id);
                                                }

                                                is_agent_db
                                            };

                                            if !is_agent {
                                                return Some(Ok(LogMsg::JsonPatch(patch)));
                                            }
                                            // Filter out agent tasks
                                            return None;
                                        }
                                    }
                                    json_patch::PatchOperation::Remove(_) => {
                                        // Allow all remove operations
                                        return Some(Ok(LogMsg::JsonPatch(patch)));
                                    }
                                    _ => {}
                                }
                            }
                            // Handle initial snapshot (replace /tasks with map)
                            else if patch_op.path() == "/tasks"
                                && let json_patch::PatchOperation::Replace(op) = patch_op
                                && let Some(tasks_obj) = op.value.as_object()
                            {
                                // Filter out agent tasks from the initial snapshot using hybrid approach
                                let mut filtered_tasks = serde_json::Map::new();
                                for (task_id_str, task_value) in tasks_obj {
                                    if let Ok(task_with_status) =
                                        serde_json::from_value::<TaskWithAttemptStatus>(
                                            task_value.clone(),
                                        )
                                    {
                                        let task_id = task_with_status.task.id;

                                        // First check cache (read lock, released before any await)
                                        let in_cache = {
                                            let cache = agent_task_ids.read().await;
                                            cache.contains(&task_id)
                                        };

                                        let is_agent = if in_cache {
                                            true
                                        } else {
                                            // Fallback: DB query for tasks not in cache
                                            // This ensures newly created agent tasks are filtered immediately
                                            let is_agent_db: bool = sqlx::query_scalar(
                                                "SELECT EXISTS(SELECT 1 FROM forge_agents WHERE task_id = ?)",
                                            )
                                            .bind(task_id)
                                            .fetch_one(&pool)
                                            .await
                                            .unwrap_or_else(|e| {
                                                tracing::warn!(
                                                    "Failed to check forge_agents for task {}: {}",
                                                    task_id,
                                                    e
                                                );
                                                false
                                            });

                                            // If it's an agent, update cache so subsequent patches don't hit DB
                                            if is_agent_db {
                                                let mut cache = agent_task_ids.write().await;
                                                cache.insert(task_id);
                                            }

                                            is_agent_db
                                        };

                                        // Only include non-agent tasks in the filtered snapshot
                                        if !is_agent {
                                            filtered_tasks.insert(
                                                task_id_str.to_string(),
                                                task_value.clone(),
                                            );
                                        }
                                    }
                                }

                                // Return filtered snapshot
                                let filtered_patch = json!([{
                                    "op": "replace",
                                    "path": "/tasks",
                                    "value": filtered_tasks
                                }]);
                                return Some(Ok(LogMsg::JsonPatch(
                                    serde_json::from_value(filtered_patch).unwrap(),
                                )));
                            }
                        }
                        // Pass through non-task patches
                        Some(Ok(LogMsg::JsonPatch(patch)))
                    }
                    Ok(other) => Some(Ok(other)),
                    Err(e) => Some(Err(e)),
                }
            }
        })
        .map_ok(|msg| msg.to_ws_message_unchecked());

    // Pin the stream for iteration
    futures_util::pin_mut!(stream);

    // Split socket into sender and receiver
    let (mut sender, mut receiver) = socket.split();

    // Drain (and ignore) any client->server messages so pings/pongs work
    tokio::spawn(async move { while let Some(Ok(_)) = receiver.next().await {} });

    // Forward server messages
    while let Some(item) = stream.next().await {
        match item {
            Ok(msg) => {
                if sender.send(msg).await.is_err() {
                    break; // client disconnected
                }
            }
            Err(e) => {
                tracing::error!("stream error: {}", e);
                break;
            }
        }
    }

    // Cancel the background cache refresh task when WebSocket closes
    refresh_task_handle.abort();

    Ok(())
}

/// Forge override: inject workspace profiles before follow-up
async fn forge_follow_up(
    axum::Extension(task_attempt): axum::Extension<TaskAttempt>,
    State(deployment): State<DeploymentImpl>,
    State(forge_services): State<ForgeServices>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<db::models::execution_process::ExecutionProcess>>, ApiError> {
    // Get task and project to determine workspace root
    let task = task_attempt
        .parent_task(&deployment.db().pool)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    let project = task
        .parent_project(&deployment.db().pool)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    // Load workspace-specific .genie profiles and inject into global cache just-in-time
    if let Ok(workspace_profiles) = forge_services
        .load_profiles_for_workspace(&project.git_repo_path)
        .await
    {
        // Log profile details for validation
        let variant_count = workspace_profiles
            .executors
            .values()
            .map(|config| config.configurations.len())
            .sum::<usize>();

        let variant_list: Vec<String> = workspace_profiles
            .executors
            .iter()
            .flat_map(|(executor, config)| {
                config
                    .configurations
                    .iter()
                    .map(move |(variant, coding_agent)| {
                        // Extract append_prompt from the CodingAgent enum
                        let prompt_preview = match coding_agent {
                            executors::executors::CodingAgent::ClaudeCode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Codex(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Amp(cfg) => cfg.append_prompt.get(),
                            executors::executors::CodingAgent::Gemini(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Opencode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::CursorAgent(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::QwenCode(cfg) => {
                                cfg.append_prompt.get()
                            }
                            executors::executors::CodingAgent::Copilot(cfg) => {
                                cfg.append_prompt.get()
                            }
                        }
                        .map(|p| {
                            let trimmed = p.trim();
                            if trimmed.len() > 60 {
                                format!("{}...", &trimmed[..60])
                            } else {
                                trimmed.to_string()
                            }
                        })
                        .unwrap_or_else(|| "<none>".to_string());

                        format!("{}:{} ({})", executor, variant, prompt_preview)
                    })
            })
            .collect();

        tracing::info!(
            "🔧 Injected {} .genie profile variant(s) for workspace: {} (follow-up) | Profiles: [{}]",
            variant_count,
            project.git_repo_path.display(),
            variant_list.join(", ")
        );

        executors::profile::ExecutorConfigs::set_cached(workspace_profiles);
    } else {
        tracing::warn!(
            "⚠️  Failed to load .genie profiles for workspace: {} (follow-up), using defaults",
            project.git_repo_path.display()
        );
    }

    // Call upstream follow_up - re-parse JSON into the correct type
    let typed_payload: task_attempts::CreateFollowUpAttempt = serde_json::from_value(payload)
        .map_err(|e| {
            ApiError::TaskAttempt(db::models::task_attempt::TaskAttemptError::ValidationError(
                format!("Invalid follow-up payload: {}", e),
            ))
        })?;

    task_attempts::follow_up(
        axum::Extension(task_attempt),
        State(deployment),
        Json(typed_payload),
    )
    .await
}

/// Forge override for get_task_attempt_branch_status
/// Adds remote_commits_behind and remote_commits_ahead calculation
///
/// TODO: Remove this override when forge-core fix is merged
/// Upstream: namastexlabs/forge-core (issues disabled - cannot report)
/// Tracking issue: https://github.com/automagik-dev/forge/issues/232
///
/// This override wraps the upstream implementation and adds calculation for remote_commits_behind
/// and remote_commits_ahead by comparing the local branch against its remote tracking branch
/// (e.g., forge/task-xyz vs origin/forge/task-xyz). These values are needed for the
/// UpdateNeededBadge and PushToPRButton components.
async fn forge_get_task_attempt_branch_status(
    axum::Extension(task_attempt): axum::Extension<TaskAttempt>,
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<Value>>, ApiError> {
    use std::process::Command;

    // Call upstream to get basic branch status - this returns all the standard fields
    // We'll then augment it with remote tracking information
    let upstream_result = task_attempts::get_task_attempt_branch_status(
        axum::Extension(task_attempt.clone()),
        State(deployment.clone()),
    )
    .await;

    // If upstream fails, propagate the error
    let Json(api_response) = upstream_result?;

    // Serialize the ApiResponse to JSON so we can modify it
    let branch_status_value = serde_json::to_value(&api_response).map_err(|e| {
        ApiError::TaskAttempt(db::models::task_attempt::TaskAttemptError::ValidationError(
            format!("Failed to serialize upstream response: {}", e),
        ))
    })?;

    // Extract the actual data object (ApiResponse has a wrapper structure)
    let mut branch_status = if let Some(data) = branch_status_value.get("data").cloned() {
        data
    } else if branch_status_value.is_object() {
        // If it's already the data object, use it directly
        branch_status_value.clone()
    } else {
        // Fallback: serialize the response to Value and return
        let fallback_value = serde_json::to_value(&api_response).unwrap_or(json!({}));
        return Ok(Json(ApiResponse::success(fallback_value)));
    };

    // Get worktree path from task attempt's container_ref
    // container_ref is an Option, so we need to unwrap it or use a default
    let container_ref_str = task_attempt.container_ref.as_ref().ok_or_else(|| {
        ApiError::TaskAttempt(db::models::task_attempt::TaskAttemptError::ValidationError(
            "Task attempt has no container_ref".to_string(),
        ))
    })?;
    let worktree_path = std::path::PathBuf::from(container_ref_str);

    // Get current branch in the worktree
    let current_branch_output = Command::new("git")
        .current_dir(&worktree_path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .output();

    let current_branch = match current_branch_output {
        Ok(output) if output.status.success() => {
            String::from_utf8_lossy(&output.stdout).trim().to_string()
        }
        _ => {
            tracing::warn!(
                "Failed to get current branch for task attempt {}, cannot calculate remote commits",
                task_attempt.id
            );
            // Return upstream response as-is if we can't get the current branch
            // We already have branch_status as Value, so return that
            return Ok(Json(ApiResponse::success(branch_status)));
        }
    };

    // Get the configured upstream tracking branch (e.g., origin/forge/task-xyz, upstream/main, etc.)
    let upstream_output = Command::new("git")
        .current_dir(&worktree_path)
        .args(["rev-parse", "--abbrev-ref", "@{u}"])
        .output();

    let remote_tracking_branch = match upstream_output {
        Ok(output) if output.status.success() => {
            String::from_utf8_lossy(&output.stdout).trim().to_string()
        }
        _ => {
            // No upstream configured - branch might not be pushed yet
            tracing::debug!(
                "No upstream tracking branch for {} in task attempt {}, cannot calculate remote commits",
                current_branch,
                task_attempt.id
            );
            // Return upstream response as-is if no tracking branch exists
            return Ok(Json(ApiResponse::success(branch_status)));
        }
    };

    // Fetch from remote to ensure we have latest refs (don't fail if this fails)
    // Extract remote name from tracking branch (e.g., "origin" from "origin/branch")
    if let Some(remote_name) = remote_tracking_branch.split('/').next() {
        let _ = Command::new("git")
            .current_dir(&worktree_path)
            .args(["fetch", remote_name, &current_branch])
            .output();
    }

    let remote_commits_output = Command::new("git")
        .current_dir(&worktree_path)
        .args([
            "rev-list",
            "--left-right",
            "--count",
            &format!("{}...{}", remote_tracking_branch, current_branch),
        ])
        .output();

    let (remote_commits_behind, remote_commits_ahead) = match remote_commits_output {
        Ok(output) if output.status.success() => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = output_str.split_whitespace().collect();
            if parts.len() == 2 {
                (parts[0].parse::<i32>().ok(), parts[1].parse::<i32>().ok())
            } else {
                (None, None)
            }
        }
        _ => {
            // Remote tracking branch might not exist yet (e.g., new local branch not pushed)
            tracing::debug!(
                "Remote tracking branch {} not found for task attempt {}, likely not pushed yet",
                remote_tracking_branch,
                task_attempt.id
            );
            (None, None)
        }
    };

    // Add the calculated values to the branch status
    if let Some(obj) = branch_status.as_object_mut() {
        obj.insert(
            "remote_commits_behind".to_string(),
            json!(remote_commits_behind),
        );
        obj.insert(
            "remote_commits_ahead".to_string(),
            json!(remote_commits_ahead),
        );
    }

    // Return the augmented response
    Ok(Json(ApiResponse::success(branch_status)))
}

/// Build task_attempts router with forge override for create endpoint
fn build_task_attempts_router_with_forge_override(
    deployment: &DeploymentImpl,
) -> Router<ForgeAppState> {
    use axum::middleware::from_fn_with_state;
    use server::middleware::load_task_attempt_middleware;

    let task_attempt_id_router = Router::new()
        .route("/", get(task_attempts::get_task_attempt))
        .route("/follow-up", post(forge_follow_up))
        .route(
            "/draft",
            get(task_attempts::drafts::get_draft)
                .put(task_attempts::drafts::save_draft)
                .delete(task_attempts::drafts::delete_draft),
        )
        .route("/draft/queue", post(task_attempts::drafts::set_draft_queue))
        .route("/replace-process", post(task_attempts::replace_process))
        .route("/commit-info", get(task_attempts::get_commit_info))
        .route(
            "/commit-compare",
            get(task_attempts::compare_commit_to_head),
        )
        .route("/start-dev-server", post(task_attempts::start_dev_server))
        .route(
            "/branch-status",
            get(forge_get_task_attempt_branch_status), // Forge override to calculate remote_commits_behind/ahead
        )
        .route("/diff/ws", get(task_attempts::stream_task_attempt_diff_ws))
        .route("/merge", post(task_attempts::merge_task_attempt))
        .route("/push", post(task_attempts::push_task_attempt_branch))
        .route("/rebase", post(task_attempts::rebase_task_attempt))
        .route(
            "/conflicts/abort",
            post(task_attempts::abort_conflicts_task_attempt),
        )
        .route("/pr", post(task_attempts::create_github_pr))
        .route("/pr/attach", post(task_attempts::attach_existing_pr))
        .route(
            "/open-editor",
            post(task_attempts::open_task_attempt_in_editor),
        )
        .route(
            "/delete-file",
            post(task_attempts::delete_task_attempt_file),
        )
        .route("/children", get(task_attempts::get_task_attempt_children))
        .route("/stop", post(task_attempts::stop_task_attempt_execution))
        .route(
            "/change-target-branch",
            post(task_attempts::change_target_branch),
        )
        .layer(from_fn_with_state(
            deployment.clone(),
            load_task_attempt_middleware,
        ));

    let task_attempts_router = Router::new()
        .route(
            "/",
            get(task_attempts::get_task_attempts).post(forge_create_task_attempt),
        ) // Forge override
        .nest("/{id}", task_attempt_id_router);

    Router::new().nest("/task-attempts", task_attempts_router)
}

/// Build config router with forge override for increased body limit on /profiles
fn forge_config_router() -> Router<DeploymentImpl> {
    use axum::extract::DefaultBodyLimit;

    // Use upstream router and layer on increased body limit globally for config routes
    // This affects all config routes, but /profiles is the only one with large payloads
    upstream_config::router().layer(DefaultBodyLimit::max(20 * 1024 * 1024)) // 20MB limit for 37 agent profiles
}

/// Build images router with forge override for increased body limit on uploads
fn forge_images_router() -> Router<DeploymentImpl> {
    use axum::extract::DefaultBodyLimit;

    // Use upstream router and layer on increased body limit globally for image routes
    // Upstream has 20MB limits on upload routes, we increase to 100MB for large images
    images::routes().layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB limit for image uploads
}

async fn frontend_handler(uri: axum::http::Uri) -> Response {
    let path = uri.path().trim_start_matches('/');

    if path.is_empty() {
        serve_index().await
    } else {
        serve_assets(Path(path.to_string())).await
    }
}

async fn serve_index() -> Response {
    match Frontend::get("index.html") {
        Some(content) => Html(content.data.to_vec()).into_response(),
        None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
    }
}

async fn serve_assets(Path(path): Path<String>) -> Response {
    serve_static_file::<Frontend>(&path).await
}

/// Serve public assets (no auth required) - used for PWA manifest and other public files
async fn serve_assets_public() -> Response {
    serve_static_file::<Frontend>("site.webmanifest").await
}

async fn serve_static_file<T: RustEmbed>(path: &str) -> Response {
    match T::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();

            let mut response = Response::new(content.data.into());
            response.headers_mut().insert(
                header::CONTENT_TYPE,
                HeaderValue::from_str(mime.as_ref()).unwrap(),
            );
            response
        }
        None => {
            // Fallback to index.html for SPA routing
            if let Some(index) = T::get("index.html") {
                Html(index.data.to_vec()).into_response()
            } else {
                (StatusCode::NOT_FOUND, "404 Not Found").into_response()
            }
        }
    }
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "forge-app",
        "version": env!("CARGO_PKG_VERSION"),
        "message": "Forge application ready - backend extensions extracted successfully"
    }))
}

/// Serve OpenAPI specification as JSON
async fn serve_openapi_spec() -> Result<Json<Value>, (StatusCode, String)> {
    const OPENAPI_YAML: &str = include_str!("../openapi.yaml");

    serde_yaml::from_str::<Value>(OPENAPI_YAML)
        .map(Json)
        .map_err(|e| {
            tracing::error!("Failed to parse openapi.yaml: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to parse OpenAPI spec: {}", e),
            )
        })
}

/// Serve Swagger UI HTML
async fn serve_swagger_ui() -> Html<String> {
    Html(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automagik Forge API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {{
            SwaggerUIBundle({{
                url: "/api/openapi.json",
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                deepLinking: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
                persistAuthorization: true
            }});
        }};
    </script>
</body>
</html>"#
            .to_string(),
    )
}

/// Simple route listing - practical solution instead of broken OpenAPI
async fn list_routes() -> Json<Value> {
    Json(json!({
        "version": env!("CARGO_PKG_VERSION"),
        "routes": {
            "core": [
                "GET /health",
                "GET /api/health",
                "GET /api/routes (this endpoint)"
            ],
            "auth": [
                "POST /api/auth/github/device",
                "POST /api/auth/github/device/poll",
                "POST /api/auth/logout"
            ],
            "projects": [
                "GET /api/projects",
                "POST /api/projects",
                "GET /api/projects/{id}",
                "PUT /api/projects/{id}",
                "DELETE /api/projects/{id}"
            ],
            "tasks": [
                "GET /api/tasks",
                "POST /api/tasks",
                "POST /api/tasks/create-and-start",
                "GET /api/tasks/{id}",
                "PUT /api/tasks/{id}",
                "DELETE /api/tasks/{id}",
                "GET /api/tasks/stream/ws"
            ],
            "task_attempts": [
                "GET /api/task-attempts",
                "POST /api/task-attempts",
                "GET /api/task-attempts/{id}",
                "POST /api/task-attempts/{id}/follow-up",
                "POST /api/task-attempts/{id}/stop",
                "POST /api/task-attempts/{id}/merge",
                "POST /api/task-attempts/{id}/push",
                "POST /api/task-attempts/{id}/rebase",
                "POST /api/task-attempts/{id}/pr",
                "POST /api/task-attempts/{id}/pr/attach",
                "GET /api/task-attempts/{id}/branch-status",
                "GET /api/task-attempts/{id}/diff/ws",
                "GET /api/task-attempts/{id}/draft",
                "PUT /api/task-attempts/{id}/draft",
                "DELETE /api/task-attempts/{id}/draft"
            ],
            "processes": [
                "GET /api/execution-processes",
                "GET /api/execution-processes/{id}",
                "POST /api/execution-processes/{id}/stop"
            ],
            "events": [
                "GET /api/events/processes/{id}/logs",
                "GET /api/events/task-attempts/{id}/diff"
            ],
            "images": [
                "POST /api/images",
                "GET /api/images/{id}"
            ],
            "forge": [
                "GET /api/forge/config",
                "PUT /api/forge/config",
                "GET /api/forge/projects/{id}/settings",
                "PUT /api/forge/projects/{id}/settings",
                "GET /api/forge/omni/status",
                "GET /api/forge/omni/instances",
                "POST /api/forge/omni/validate",
                "GET /api/forge/omni/notifications",
                "GET /api/forge/releases",
                "GET /api/forge/master-genie/{attempt_id}/neurons",
                "GET /api/forge/neurons/{neuron_attempt_id}/subtasks"
            ],
            "filesystem": [
                "GET /api/filesystem/tree",
                "GET /api/filesystem/file"
            ],
            "config": [
                "GET /api/config",
                "PUT /api/config"
            ],
            "drafts": [
                "GET /api/drafts",
                "POST /api/drafts",
                "GET /api/drafts/{id}",
                "PUT /api/drafts/{id}",
                "DELETE /api/drafts/{id}"
            ],
            "containers": [
                "GET /api/containers",
                "GET /api/containers/{id}"
            ],
            "approvals": [
                "POST /api/approvals/create",
                "GET /api/approvals/{id}/status",
                "POST /api/approvals/{id}/respond",
                "GET /api/approvals/pending"
            ]
        },
        "note": "This is a simple route listing. Most endpoints require GitHub OAuth authentication via /api/auth/github/device"
    }))
}

async fn get_auth_required(State(state): State<ForgeAppState>) -> Json<Value> {
    Json(json!({
        "auth_required": state.auth_required
    }))
}

async fn get_forge_config(
    State(services): State<ForgeServices>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .get_global_settings()
        .await
        .map(|settings| Json(ApiResponse::success(settings)))
        .map_err(|e| {
            tracing::error!("Failed to load forge config: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

async fn update_forge_config(
    State(services): State<ForgeServices>,
    Json(settings): Json<ForgeProjectSettings>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .set_global_settings(&settings)
        .await
        .map_err(|e| {
            tracing::error!("Failed to persist forge config: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    services.apply_global_omni_config().await.map_err(|e| {
        tracing::error!("Failed to refresh Omni config: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(ApiResponse::success(settings)))
}

async fn get_project_settings(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .get_forge_settings(project_id)
        .await
        .map(|settings| Json(ApiResponse::success(settings)))
        .map_err(|e| {
            tracing::error!("Failed to load project settings {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

async fn update_project_settings(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
    Json(settings): Json<ForgeProjectSettings>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .set_forge_settings(project_id, &settings)
        .await
        .map_err(|e| {
            tracing::error!("Failed to persist project settings {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::success(settings)))
}

/// Get executor profiles for a specific project
async fn get_project_profiles(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
) -> Result<Json<ApiResponse<executors::profile::ExecutorConfigs>>, StatusCode> {
    services
        .profile_cache
        .get_profiles_for_project(project_id)
        .await
        .map(|profiles| {
            tracing::debug!(
                "Retrieved {} executor profiles for project {}",
                profiles.executors.len(),
                project_id
            );
            Json(ApiResponse::success(profiles))
        })
        .map_err(|e| {
            tracing::error!("Failed to load profiles for project {}: {}", project_id, e);
            StatusCode::NOT_FOUND
        })
}

#[derive(Deserialize)]
struct BranchStatusQuery {
    /// Optional base branch to compare against (defaults to "main")
    base: Option<String>,
}

/// Get branch status for a project's main repository
/// This checks the git status of the project's working directory (not worktree)
/// Supports optional ?base=<branch> query parameter to specify target branch
async fn get_project_branch_status(
    Path(project_id): Path<Uuid>,
    Query(query): Query<BranchStatusQuery>,
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<ApiResponse<Value>>, StatusCode> {
    use db::models::project::Project;
    use std::process::Command;

    // Get project to determine workspace root
    let project = match Project::find_by_id(&deployment.db().pool, project_id).await {
        Ok(Some(p)) => p,
        Ok(None) => {
            tracing::error!("Project {} not found", project_id);
            return Err(StatusCode::NOT_FOUND);
        }
        Err(e) => {
            tracing::error!("Database error finding project {}: {}", project_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get current branch
    let current_branch_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .output();

    let current_branch = match current_branch_output {
        Ok(output) if output.status.success() => {
            String::from_utf8_lossy(&output.stdout).trim().to_string()
        }
        _ => {
            tracing::warn!(
                "Failed to get current branch for project {}, defaulting to 'main'",
                project_id
            );
            "main".to_string()
        }
    };

    // Get target branch from query parameter or default to "main"
    let target_branch = query.base.as_deref().unwrap_or("main");

    // Fetch from remote to ensure we have latest refs
    let _ = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["fetch", "origin"])
        .output();

    // Compare against remote tracking branch (origin/target_branch)
    let remote_branch = format!("origin/{}", target_branch);
    let commits_behind_ahead_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args([
            "rev-list",
            "--left-right",
            "--count",
            &format!("{}...{}", remote_branch, current_branch),
        ])
        .output();

    let (commits_behind, commits_ahead) = match commits_behind_ahead_output {
        Ok(output) if output.status.success() => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = output_str.split_whitespace().collect();
            if parts.len() == 2 {
                (parts[0].parse::<i32>().ok(), parts[1].parse::<i32>().ok())
            } else {
                (None, None)
            }
        }
        _ => (None, None),
    };

    // Get the configured upstream tracking branch (e.g., origin/main, upstream/main, etc.)
    // This tells us if we need to push (local ahead) or pull (remote ahead)
    let upstream_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["rev-parse", "--abbrev-ref", "@{u}"])
        .output();

    let (remote_commits_behind, remote_commits_ahead) = match upstream_output {
        Ok(output) if output.status.success() => {
            let remote_tracking_branch = String::from_utf8_lossy(&output.stdout).trim().to_string();

            // Compare local to its configured upstream
            let remote_commits_output = Command::new("git")
                .current_dir(&project.git_repo_path)
                .args([
                    "rev-list",
                    "--left-right",
                    "--count",
                    &format!("{}...{}", remote_tracking_branch, current_branch),
                ])
                .output();

            match remote_commits_output {
                Ok(output) if output.status.success() => {
                    let output_str = String::from_utf8_lossy(&output.stdout);
                    let parts: Vec<&str> = output_str.split_whitespace().collect();
                    if parts.len() == 2 {
                        (parts[0].parse::<i32>().ok(), parts[1].parse::<i32>().ok())
                    } else {
                        (None, None)
                    }
                }
                _ => (None, None),
            }
        }
        _ => {
            // No upstream tracking branch configured (e.g., new local branch not pushed)
            tracing::debug!(
                "No upstream tracking branch for {} in project {}",
                current_branch,
                project_id
            );
            (None, None)
        }
    };

    // Check for uncommitted changes
    let status_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["status", "--porcelain"])
        .output();

    let (has_uncommitted_changes, uncommitted_count, untracked_count) = match status_output {
        Ok(output) if output.status.success() => {
            let status_str = String::from_utf8_lossy(&output.stdout).to_string();
            let status_lines: Vec<&str> = status_str.lines().collect();
            let uncommitted = status_lines.iter().filter(|l| !l.starts_with("??")).count();
            let untracked = status_lines.iter().filter(|l| l.starts_with("??")).count();
            (
                !status_lines.is_empty(),
                Some(uncommitted as i32),
                Some(untracked as i32),
            )
        }
        _ => (false, None, None),
    };

    // Get HEAD commit OID
    let head_oid_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["rev-parse", "HEAD"])
        .output();

    let head_oid = match head_oid_output {
        Ok(output) if output.status.success() => {
            Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        _ => None,
    };

    // Build response matching BranchStatus structure
    let response = json!({
        "commits_behind": commits_behind,
        "commits_ahead": commits_ahead,
        "has_uncommitted_changes": has_uncommitted_changes,
        "head_oid": head_oid,
        "uncommitted_count": uncommitted_count,
        "untracked_count": untracked_count,
        "target_branch_name": target_branch,
        "remote_commits_behind": remote_commits_behind,
        "remote_commits_ahead": remote_commits_ahead,
        "merges": [],
        "is_rebase_in_progress": false,
        "conflict_op": null,
        "conflicted_files": []
    });

    Ok(Json(ApiResponse::success(response)))
}

/// Pull updates for a project's main repository
/// This performs a git pull --rebase to update the working tree with remote changes
async fn post_project_pull(
    Path(project_id): Path<Uuid>,
    State(deployment): State<DeploymentImpl>,
) -> Result<Json<Value>, StatusCode> {
    use db::models::project::Project;
    use std::process::Command;

    // Get project
    let project = match Project::find_by_id(&deployment.db().pool, project_id).await {
        Ok(Some(p)) => p,
        Ok(None) => {
            tracing::error!("Project {} not found", project_id);
            return Err(StatusCode::NOT_FOUND);
        }
        Err(e) => {
            tracing::error!("Database error finding project {}: {}", project_id, e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get current branch name
    let branch_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .output();

    let current_branch = match branch_output {
        Ok(output) if output.status.success() => {
            String::from_utf8_lossy(&output.stdout).trim().to_string()
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            tracing::error!(
                "Failed to get current branch for project {}: {}",
                project_id,
                stderr
            );
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
        Err(e) => {
            tracing::error!(
                "Failed to execute git rev-parse for project {}: {}",
                project_id,
                e
            );
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Run git pull to actually update the working tree
    tracing::info!(
        "Pulling updates for project {} branch {} at {:?}",
        project_id,
        current_branch,
        project.git_repo_path
    );

    let pull_output = Command::new("git")
        .current_dir(&project.git_repo_path)
        .args(["pull", "--rebase", "origin", &current_branch])
        .output();

    match pull_output {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            tracing::info!(
                "Successfully pulled updates for project {}: {}",
                project_id,
                stdout
            );
            Ok(Json(json!({
                "success": true,
                "message": format!("Successfully pulled updates from origin/{}", current_branch)
            })))
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let stdout = String::from_utf8_lossy(&output.stdout);

            // Check if it's a merge conflict or dirty working tree
            if stderr.contains("conflict") || stderr.contains("Cannot rebase") {
                tracing::warn!(
                    "Git pull conflict for project {}: {} {}",
                    project_id,
                    stdout,
                    stderr
                );
                Ok(Json(json!({
                    "success": false,
                    "message": "Cannot pull: working tree has conflicts or uncommitted changes. Please resolve manually.",
                    "details": stderr.to_string()
                })))
            } else {
                tracing::error!(
                    "Git pull failed for project {}: {} {}",
                    project_id,
                    stdout,
                    stderr
                );
                Err(StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
        Err(e) => {
            tracing::error!(
                "Failed to execute git pull for project {}: {}",
                project_id,
                e
            );
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_omni_status(State(services): State<ForgeServices>) -> Result<Json<Value>, StatusCode> {
    let omni = services.omni.read().await;
    let config = omni.config();

    Ok(Json(json!({
        "enabled": config.enabled,
        "version": env!("CARGO_PKG_VERSION"),
        "config": if config.enabled {
            serde_json::to_value(config).ok()
        } else {
            None
        }
    })))
}

async fn list_omni_instances(
    State(services): State<ForgeServices>,
) -> Result<Json<Value>, StatusCode> {
    let omni = services.omni.read().await;
    match omni.list_instances().await {
        Ok(instances) => Ok(Json(json!({ "instances": instances }))),
        Err(e) => {
            tracing::error!("Failed to list Omni instances: {}", e);
            Ok(Json(json!({
                "instances": [],
                "error": "Failed to connect to Omni service"
            })))
        }
    }
}

async fn list_omni_notifications(
    State(services): State<ForgeServices>,
) -> Result<Json<Value>, StatusCode> {
    let rows = sqlx::query(
        r#"SELECT
                id,
                task_id,
                notification_type,
                status,
                message,
                error_message,
                sent_at,
                created_at,
                metadata
           FROM forge_omni_notifications
          ORDER BY created_at DESC
          LIMIT 50"#,
    )
    .fetch_all(services.pool())
    .await
    .map_err(|error| {
        tracing::error!("Failed to fetch Omni notifications: {}", error);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let mut notifications = Vec::with_capacity(rows.len());

    for row in rows {
        let metadata = match row.try_get::<Option<String>, _>("metadata") {
            Ok(Some(raw)) => serde_json::from_str::<Value>(&raw).ok(),
            _ => None,
        };

        let record = json!({
            "id": row.try_get::<String, _>("id").unwrap_or_default(),
            "task_id": row.try_get::<Option<String>, _>("task_id").unwrap_or(None),
            "notification_type": row
                .try_get::<String, _>("notification_type")
                .unwrap_or_else(|_| "unknown".to_string()),
            "status": row
                .try_get::<String, _>("status")
                .unwrap_or_else(|_| "pending".to_string()),
            "message": row.try_get::<Option<String>, _>("message").unwrap_or(None),
            "error_message": row
                .try_get::<Option<String>, _>("error_message")
                .unwrap_or(None),
            "sent_at": row.try_get::<Option<String>, _>("sent_at").unwrap_or(None),
            "created_at": row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339()),
            "metadata": metadata,
        });

        notifications.push(record);
    }

    Ok(Json(json!({ "notifications": notifications })))
}

#[derive(Debug, Deserialize)]
struct ValidateOmniRequest {
    host: String,
    api_key: String,
}

#[derive(Debug, Serialize)]
struct ValidateOmniResponse {
    valid: bool,
    instances: Vec<forge_omni::OmniInstance>,
    error: Option<String>,
}

async fn validate_omni_config(
    State(_services): State<ForgeServices>,
    Json(req): Json<ValidateOmniRequest>,
) -> Result<Json<ValidateOmniResponse>, StatusCode> {
    // Create temporary OmniService with provided credentials
    let temp_config = forge_omni::OmniConfig {
        enabled: false,
        host: Some(req.host),
        api_key: Some(req.api_key),
        instance: None,
        recipient: None,
        recipient_type: None,
    };

    let temp_service = forge_omni::OmniService::new(temp_config);
    match temp_service.list_instances().await {
        Ok(instances) => Ok(Json(ValidateOmniResponse {
            valid: true,
            instances,
            error: None,
        })),
        Err(e) => Ok(Json(ValidateOmniResponse {
            valid: false,
            instances: vec![],
            error: Some(format!("Configuration validation failed: {}", e)),
        })),
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct GitHubRelease {
    tag_name: String,
    name: String,
    body: Option<String>,
    prerelease: bool,
    created_at: String,
    published_at: Option<String>,
    html_url: String,
}

/// Fetch GitHub releases from the repository
async fn get_github_releases() -> Result<Json<ApiResponse<Vec<GitHubRelease>>>, StatusCode> {
    let client = reqwest::Client::new();

    match client
        .get("https://api.github.com/repos/automagik.dev/automagik-forge/releases")
        .header("User-Agent", "automagik-forge")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<GitHubRelease>>().await {
                    Ok(releases) => Ok(Json(ApiResponse::success(releases))),
                    Err(e) => {
                        tracing::error!("Failed to parse GitHub releases: {}", e);
                        Err(StatusCode::INTERNAL_SERVER_ERROR)
                    }
                }
            } else {
                tracing::error!("GitHub API returned error: {}", response.status());
                Err(StatusCode::BAD_GATEWAY)
            }
        }
        Err(e) => {
            tracing::error!("Failed to fetch GitHub releases: {}", e);
            Err(StatusCode::BAD_GATEWAY)
        }
    }
}

/// Neuron type definitions
#[derive(Debug, Serialize)]
struct Neuron {
    #[serde(rename = "type")]
    neuron_type: String, // "wish", "forge", or "review"
    task: Task,
    attempt: TaskAttempt,
}

/// Get neurons for a Master Genie task attempt
/// Returns Wish, Forge, and Review neurons (tasks with parent_task_attempt = master_attempt_id)
async fn get_master_genie_neurons(
    State(deployment): State<DeploymentImpl>,
    Path(attempt_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<Neuron>>>, ApiError> {
    let pool = &deployment.db().pool;

    // Find all tasks where parent_task_attempt = master_attempt_id AND status = 'agent'
    let neuron_tasks: Vec<Task> = sqlx::query_as::<_, Task>(
        r#"SELECT * FROM tasks
           WHERE parent_task_attempt = ? AND status = 'agent'
           ORDER BY created_at ASC"#,
    )
    .bind(attempt_id)
    .fetch_all(pool)
    .await?;

    let mut neurons = Vec::new();

    // For each neuron task, find its latest attempt and determine type from executor variant
    for task in neuron_tasks {
        // Get latest attempt for this neuron task (fetch_all returns newest first)
        if let Ok(attempts) = TaskAttempt::fetch_all(pool, Some(task.id)).await
            && let Some(attempt) = attempts.into_iter().next()
        {
            // Parse executor to get variant (e.g., "CLAUDE_CODE:WISH" → "WISH")
            let neuron_type = if let Some((_base, variant)) = attempt.executor.split_once(':') {
                variant.to_string() // Keep uppercase to match profile variants
            } else {
                "unknown".to_string()
            };

            neurons.push(Neuron {
                neuron_type,
                task,
                attempt,
            });
        }
    }

    Ok(Json(ApiResponse::success(neurons)))
}

/// Get subtasks for a neuron
/// Returns tasks where parent_task_attempt = neuron_attempt_id AND status = 'agent'
async fn get_neuron_subtasks(
    State(deployment): State<DeploymentImpl>,
    Path(neuron_attempt_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<Task>>>, ApiError> {
    let pool = &deployment.db().pool;

    // Find all tasks where parent_task_attempt = neuron_attempt_id AND status = 'agent'
    let subtasks: Vec<Task> = sqlx::query_as::<_, Task>(
        r#"SELECT * FROM tasks
           WHERE parent_task_attempt = ? AND status = 'agent'
           ORDER BY created_at DESC"#,
    )
    .bind(neuron_attempt_id)
    .fetch_all(pool)
    .await?;

    Ok(Json(ApiResponse::success(subtasks)))
}

/// Forge Agent model
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
struct ForgeAgent {
    id: Uuid,
    project_id: Uuid,
    agent_type: String, // 'master', 'wish', 'forge', 'review'
    task_id: Uuid,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
struct GetForgeAgentsParams {
    project_id: Uuid,
    agent_type: Option<String>,
}

/// Get forge agents for a project
async fn get_forge_agents(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<GetForgeAgentsParams>,
) -> Result<Json<ApiResponse<Vec<ForgeAgent>>>, ApiError> {
    let pool = &deployment.db().pool;

    let agents = if let Some(agent_type) = params.agent_type {
        sqlx::query_as::<_, ForgeAgent>(
            "SELECT * FROM forge_agents WHERE project_id = ? AND agent_type = ?",
        )
        .bind(params.project_id)
        .bind(agent_type)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, ForgeAgent>("SELECT * FROM forge_agents WHERE project_id = ?")
            .bind(params.project_id)
            .fetch_all(pool)
            .await?
    };

    Ok(Json(ApiResponse::success(agents)))
}

#[derive(Debug, Deserialize)]
struct CreateForgeAgentBody {
    project_id: Uuid,
    agent_type: String,
}

/// Create a forge agent (and its fixed task)
async fn create_forge_agent(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<CreateForgeAgentBody>,
) -> Result<Json<ApiResponse<ForgeAgent>>, ApiError> {
    let pool = &deployment.db().pool;
    let agent_id = Uuid::new_v4();
    let task_id = Uuid::new_v4();

    // Create the fixed task
    let title = "Genie".to_string();

    sqlx::query(
        r#"INSERT INTO tasks (id, project_id, title, description, status, created_at, updated_at)
           VALUES (?, ?, ?, NULL, 'agent', datetime('now'), datetime('now'))"#,
    )
    .bind(task_id)
    .bind(payload.project_id)
    .bind(&title)
    .execute(pool)
    .await?;

    // Create the agent entry
    sqlx::query(
        r#"INSERT INTO forge_agents (id, project_id, agent_type, task_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"#,
    )
    .bind(agent_id)
    .bind(payload.project_id)
    .bind(&payload.agent_type)
    .bind(task_id)
    .execute(pool)
    .await?;

    // Fetch the created agent
    let agent: ForgeAgent = sqlx::query_as("SELECT * FROM forge_agents WHERE id = ?")
        .bind(agent_id)
        .fetch_one(pool)
        .await?;

    Ok(Json(ApiResponse::success(agent)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_forge_branch_prefix_format() {
        // Test that branch names use "forge" prefix instead of "vk"
        let attempt_id = Uuid::new_v4();
        let task_title = "test task";

        let task_title_id = git_branch_id(task_title);
        let short_id = short_uuid(&attempt_id);
        let branch_name = format!("forge/{}-{}", short_id, task_title_id);

        assert!(branch_name.starts_with("forge/"));
        assert!(branch_name.contains(&short_id));
        assert!(branch_name.contains(&task_title_id));
    }

    #[test]
    fn test_forge_branch_prefix_uniqueness() {
        // Test that different attempt IDs produce different branch names
        let attempt_id_1 = Uuid::new_v4();
        let attempt_id_2 = Uuid::new_v4();
        let task_title = "test";

        let task_title_id = git_branch_id(task_title);
        let short_id_1 = short_uuid(&attempt_id_1);
        let short_id_2 = short_uuid(&attempt_id_2);

        let branch_1 = format!("forge/{}-{}", short_id_1, task_title_id);
        let branch_2 = format!("forge/{}-{}", short_id_2, task_title_id);

        assert_ne!(branch_1, branch_2);
        assert!(branch_1.starts_with("forge/"));
        assert!(branch_2.starts_with("forge/"));
    }

    #[test]
    fn test_forge_branch_format_matches_upstream() {
        // Verify format is identical to upstream except for "forge" vs "vk" prefix
        let attempt_id = Uuid::new_v4();
        let task_title = "my-test-task";

        let task_title_id = git_branch_id(task_title);
        let short_id = short_uuid(&attempt_id);

        let forge_branch = format!("forge/{}-{}", short_id, task_title_id);
        let upstream_branch = format!("vk/{}-{}", short_id, task_title_id);

        // Only difference should be the prefix
        assert_eq!(
            forge_branch.replace("forge/", ""),
            upstream_branch.replace("vk/", "")
        );
    }
}
