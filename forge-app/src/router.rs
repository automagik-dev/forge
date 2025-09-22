use std::{env, path::PathBuf, sync::Arc};

use axum::middleware::from_fn_with_state;
use axum::{
    extract::{Extension, Path, State},
    http::{HeaderMap, StatusCode, header},
    routing::{get, get_service, post},
    Json, Router,
};
use db::models::{
    image::TaskImage,
    task::{Task, TaskWithAttemptStatus},
    task_attempt::{CreateTaskAttempt, TaskAttempt},
};
use deployment::Deployment;
use forge_extensions_config::{OmniConfig as ForgeOmniConfig, RecipientType as ForgeRecipientType};
use forge_extensions_omni::OmniInstance;
use serde::{Deserialize, Serialize};
use serde_json::json;
use server::middleware::model_loaders::{load_task_attempt_middleware, load_task_middleware};
use server::{
    error::ApiError,
    routes::{
        auth, config, containers, events, execution_processes, filesystem, health, images,
        projects,
        task_attempts::{self, CreateTaskAttemptBody},
        task_templates,
        tasks::{self, CreateAndStartTaskRequest},
    },
};
use services::services::container::ContainerService;
use services::services::config as upstream_config;
use services::services::omni::{
    self as upstream_omni,
    types::{OmniConfig as UpstreamOmniConfig, OmniInstance as UpstreamOmniInstance},
};
use sqlx::Error as SqlxError;
use tower_http::services::{ServeDir, ServeFile};
use tracing::warn;
use utils::response::ApiResponse;
use uuid::Uuid;

use crate::services::ForgeServices;

const ENV_FORGE_FRONTEND_DIST: &str = "FORGE_FRONTEND_DIST";
const ENV_LEGACY_FRONTEND_DIST: &str = "FORGE_LEGACY_FRONTEND_DIST";
const ENV_BUNDLE_ROOT: &str = "FORGE_BUNDLE_PATH";

const DEV_FORGE_FRONTEND_DIST: &str = "frontend-forge/dist";
const DEV_LEGACY_FRONTEND_DIST: &str = "upstream/frontend/dist";
const BUNDLE_FORGE_FRONTEND_DIST: &str = "frontend-forge-dist";
const BUNDLE_LEGACY_FRONTEND_DIST: &str = "legacy-frontend-dist";

pub fn create_router(services: Arc<ForgeServices>) -> Router {
    let forge_frontend = static_frontend_service(
        ENV_FORGE_FRONTEND_DIST,
        DEV_FORGE_FRONTEND_DIST,
        BUNDLE_FORGE_FRONTEND_DIST,
        "forge",
    );

    let legacy_frontend = static_frontend_service(
        ENV_LEGACY_FRONTEND_DIST,
        DEV_LEGACY_FRONTEND_DIST,
        BUNDLE_LEGACY_FRONTEND_DIST,
        "legacy",
    );

    let base_api = build_base_api_router(services.deployment().clone(), Arc::clone(&services));
    let forge_api = forge_api_router().layer(Extension(Arc::clone(&services)));

    let mut router = Router::new()
        .route("/health", get(health_probe))
        .nest("/api/forge", forge_api)
        .nest("/api", base_api);

    router = match legacy_frontend {
        Some(service) => router.nest_service("/legacy", service),
        None => {
            let unavailable = get(legacy_frontend_unavailable);
            router
                .route("/legacy", unavailable.clone())
                .route("/legacy/*path", unavailable)
        }
    };

    match forge_frontend {
        Some(service) => router.fallback_service(service),
        None => router.fallback(get(forge_frontend_unavailable)),
    }
}

fn build_base_api_router(
    deployment: server::DeploymentImpl,
    services: Arc<ForgeServices>,
) -> Router {
    let base_routes = Router::new()
        .route("/health", get(health::health_check))
        .merge(config::router())
        .merge(containers::router(&deployment))
        .merge(projects::router(&deployment))
        .nest("/omni", forge_upstream_omni_router())
        .merge(forge_tasks_router(&deployment))
        .merge(forge_task_attempts_router(&deployment))
        .merge(execution_processes::router(&deployment))
        .merge(task_templates::router(&deployment))
        .merge(auth::router(&deployment))
        .merge(filesystem::router())
        .merge(events::router(&deployment))
        .nest("/images", images::routes())
        .layer(Extension(services))
        .with_state(deployment);

    base_routes
}

fn forge_tasks_router(deployment: &server::DeploymentImpl) -> Router<server::DeploymentImpl> {
    let task_id_router = Router::new()
        .route(
            "/",
            get(tasks::get_task)
                .put(tasks::update_task)
                .delete(tasks::delete_task),
        )
        .layer(from_fn_with_state(deployment.clone(), load_task_middleware));

    let inner = Router::new()
        .route("/", get(tasks::get_tasks).post(tasks::create_task))
        .route("/stream/ws", get(tasks::stream_tasks_ws))
        .route("/create-and-start", post(forge_create_task_and_start))
        .nest("/{task_id}", task_id_router);

    Router::new().nest("/tasks", inner)
}

fn forge_task_attempts_router(
    deployment: &server::DeploymentImpl,
) -> Router<server::DeploymentImpl> {
    let task_attempt_id_router = Router::new()
        .route("/", get(task_attempts::get_task_attempt))
        .route("/follow-up", post(task_attempts::follow_up))
        .route(
            "/follow-up-draft",
            get(task_attempts::get_follow_up_draft).put(task_attempts::save_follow_up_draft),
        )
        .route(
            "/follow-up-draft/stream/ws",
            get(task_attempts::stream_follow_up_draft_ws),
        )
        .route(
            "/follow-up-draft/queue",
            post(task_attempts::set_follow_up_queue),
        )
        .route("/replace-process", post(task_attempts::replace_process))
        .route("/commit-info", get(task_attempts::get_commit_info))
        .route(
            "/commit-compare",
            get(task_attempts::compare_commit_to_head),
        )
        .route("/start-dev-server", post(task_attempts::start_dev_server))
        .route(
            "/branch-status",
            get(task_attempts::get_task_attempt_branch_status),
        )
        .route("/diff", get(task_attempts::get_task_attempt_diff))
        .route("/merge", post(task_attempts::merge_task_attempt))
        .route("/push", post(task_attempts::push_task_attempt_branch))
        .route("/rebase", post(task_attempts::rebase_task_attempt))
        .route(
            "/conflicts/abort",
            post(task_attempts::abort_conflicts_task_attempt),
        )
        .route("/pr", post(task_attempts::create_github_pr))
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
        .layer(from_fn_with_state(
            deployment.clone(),
            load_task_attempt_middleware,
        ));

    let task_attempts_router = Router::new()
        .route(
            "/",
            get(task_attempts::get_task_attempts).post(forge_create_task_attempt),
        )
        .nest("/{id}", task_attempt_id_router);

    Router::new().nest("/task-attempts", task_attempts_router)
}

fn forge_api_router() -> Router {
    Router::new()
        .route("/omni/instances", get(list_omni_instances))
        .route(
            "/branch-templates/{task_id}",
            get(get_branch_template)
                .put(update_branch_template)
                .delete(delete_branch_template),
        )
}

async fn health_probe() -> &'static str {
    "ok"
}

fn forge_upstream_omni_router() -> Router<server::DeploymentImpl> {
    Router::new()
        .route("/instances", get(list_upstream_omni_instances))
        .route("/validate", post(validate_upstream_omni_config))
        .route("/test", post(test_upstream_omni_notification))
}

async fn list_omni_instances(
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Result<Json<OmniInstancesResponse>, (StatusCode, String)> {
    let instances = services
        .list_omni_instances()
        .await
        .map_err(internal_error)?
        .into_iter()
        .map(OmniInstanceDto::from)
        .collect();

    Ok(Json(OmniInstancesResponse { instances }))
}

async fn list_upstream_omni_instances(
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Json<ApiResponse<Vec<UpstreamOmniInstance>>> {
    let deployment = services.deployment();
    let config = deployment.config().read().await;

    if config.omni.host.is_none() || config.omni.api_key.is_none() {
        return Json(ApiResponse::error("Omni not configured"));
    }

    let omni_config = to_upstream_omni_config(&config.omni);
    let service = upstream_omni::OmniService::new(omni_config);

    match service.client.list_instances().await {
        Ok(instances) => Json(ApiResponse::success(instances)),
        Err(e) => Json(ApiResponse::error(&format!(
            "Failed to list instances: {}",
            e
        ))),
    }
}

#[derive(Debug, Deserialize)]
struct ValidateUpstreamConfigRequest {
    host: String,
    api_key: String,
}

#[derive(Debug, Serialize)]
struct ValidateUpstreamConfigResponse {
    valid: bool,
    instances: Vec<UpstreamOmniInstance>,
    error: Option<String>,
}

async fn validate_upstream_omni_config(
    Json(req): Json<ValidateUpstreamConfigRequest>,
) -> Json<ApiResponse<ValidateUpstreamConfigResponse>> {
    let temp_config = UpstreamOmniConfig {
        enabled: false,
        host: Some(req.host),
        api_key: Some(req.api_key),
        instance: None,
        recipient: None,
        recipient_type: None,
    };

    let service = upstream_omni::OmniService::new(temp_config);
    match service.client.list_instances().await {
        Ok(instances) => Json(ApiResponse::success(ValidateUpstreamConfigResponse {
            valid: true,
            instances,
            error: None,
        })),
        Err(e) => Json(ApiResponse::success(ValidateUpstreamConfigResponse {
            valid: false,
            instances: vec![],
            error: Some(format!("Configuration validation failed: {}", e)),
        })),
    }
}

async fn test_upstream_omni_notification(
    Extension(services): Extension<Arc<ForgeServices>>,
    headers: HeaderMap,
) -> Json<ApiResponse<String>> {
    let deployment = services.deployment();
    let config = deployment.config().read().await;

    if !config.omni.enabled {
        return Json(ApiResponse::error("Omni notifications not enabled"));
    }

    let omni_config = to_upstream_omni_config(&config.omni);
    let service = upstream_omni::OmniService::new(omni_config);

    let host = headers
        .get(header::HOST)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("127.0.0.1");
    let base_url = format!("http://{}", host);

    match service
        .send_task_notification(
            "Test Task",
            "✅ Completed",
            Some(&format!("{}/projects/test/tasks/test", base_url)),
        )
        .await
    {
        Ok(_) => Json(ApiResponse::success(
            "Test notification sent successfully".to_string(),
        )),
        Err(e) => Json(ApiResponse::error(&format!(
            "Failed to send notification: {}",
            e
        ))),
    }
}

fn to_upstream_omni_config(config: &ForgeOmniConfig) -> UpstreamOmniConfig {
    UpstreamOmniConfig {
        enabled: config.enabled,
        host: config.host.clone(),
        api_key: config.api_key.clone(),
        instance: config.instance.clone(),
        recipient: config.recipient.clone(),
        recipient_type: config.recipient_type.clone().map(|rt| match rt {
            ForgeRecipientType::PhoneNumber => upstream_config::RecipientType::PhoneNumber,
            ForgeRecipientType::UserId => upstream_config::RecipientType::UserId,
        }),
    }
}

async fn get_branch_template(
    Extension(services): Extension<Arc<ForgeServices>>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<BranchTemplateResponse>, (StatusCode, String)> {
    let branch_template = services
        .get_branch_template(task_id)
        .await
        .map_err(internal_error)?;

    Ok(Json(BranchTemplateResponse {
        task_id,
        branch_template,
    }))
}

async fn update_branch_template(
    Extension(services): Extension<Arc<ForgeServices>>,
    Path(task_id): Path<Uuid>,
    Json(payload): Json<UpdateBranchTemplateRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let value = payload
        .branch_template
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    if let Some(template) = value {
        services
            .set_branch_template(task_id, template)
            .await
            .map_err(internal_error)?;
    } else {
        services
            .clear_branch_template(task_id)
            .await
            .map_err(internal_error)?;
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_branch_template(
    Extension(services): Extension<Arc<ForgeServices>>,
    Path(task_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    services
        .clear_branch_template(task_id)
        .await
        .map_err(internal_error)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn forge_create_task_and_start(
    Extension(services): Extension<Arc<ForgeServices>>,
    State(deployment): State<server::DeploymentImpl>,
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
            json!({
                "task_id": task.id.to_string(),
                "project_id": task.project_id,
                "has_description": task.description.is_some(),
                "has_images": payload.task.image_ids.is_some(),
            }),
        )
        .await;

    let mut task_attempt = TaskAttempt::create(
        &deployment.db().pool,
        &CreateTaskAttempt {
            executor: payload.executor_profile_id.executor,
            base_branch: payload.base_branch.clone(),
        },
        task.id,
    )
    .await?;

    let branch_name = services
        .generate_branch_name(task.id, &task.title, &task_attempt.id)
        .await?;
    TaskAttempt::update_branch(&deployment.db().pool, task_attempt.id, &branch_name).await?;
    task_attempt.branch = Some(branch_name);

    let execution_process = deployment
        .container()
        .start_attempt(&task_attempt, payload.executor_profile_id.clone())
        .await?;

    deployment
        .track_if_analytics_allowed(
            "task_attempt_started",
            json!({
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

    tracing::info!("Started execution process {}", execution_process.id);
    Ok(Json(ApiResponse::success(TaskWithAttemptStatus {
        task,
        has_in_progress_attempt: true,
        has_merged_attempt: false,
        last_attempt_failed: false,
        executor: payload.executor_profile_id.executor.to_string(),
    })))
}

async fn forge_create_task_attempt(
    Extension(services): Extension<Arc<ForgeServices>>,
    State(deployment): State<server::DeploymentImpl>,
    Json(payload): Json<CreateTaskAttemptBody>,
) -> Result<Json<ApiResponse<TaskAttempt>>, ApiError> {
    let executor_profile_id = payload.get_executor_profile_id();

    let mut task_attempt = TaskAttempt::create(
        &deployment.db().pool,
        &CreateTaskAttempt {
            executor: executor_profile_id.executor.clone(),
            base_branch: payload.base_branch.clone(),
        },
        payload.task_id,
    )
    .await?;

    let task = Task::find_by_id(&deployment.db().pool, payload.task_id)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    let branch_name = services
        .generate_branch_name(task.id, &task.title, &task_attempt.id)
        .await?;
    TaskAttempt::update_branch(&deployment.db().pool, task_attempt.id, &branch_name).await?;
    task_attempt.branch = Some(branch_name);

    let execution_process = deployment
        .container()
        .start_attempt(&task_attempt, executor_profile_id.clone())
        .await?;

    deployment
        .track_if_analytics_allowed(
            "task_attempt_started",
            json!({
                "task_id": task_attempt.task_id.to_string(),
                "variant": &executor_profile_id.variant,
                "executor": &executor_profile_id.executor,
                "attempt_id": task_attempt.id.to_string(),
            }),
        )
        .await;

    tracing::info!("Started execution process {}", execution_process.id);

    Ok(Json(ApiResponse::success(task_attempt)))
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

fn static_frontend_service(
    env_var: &str,
    dev_relative: &str,
    bundle_relative: &str,
    label: &'static str,
) -> Option<axum::routing::MethodRouter> {
    let mut candidates = Vec::new();

    if let Ok(path) = env::var(env_var) {
        candidates.push(PathBuf::from(path));
    }

    if let Ok(bundle_root) = env::var(ENV_BUNDLE_ROOT) {
        candidates.push(PathBuf::from(&bundle_root).join(bundle_relative));
    }

    candidates.push(PathBuf::from(dev_relative));

    if let Ok(exe_path) = env::current_exe() {
        if let Some(parent) = exe_path.parent() {
            candidates.push(parent.join(bundle_relative));
        }
    }

    let root = candidates.into_iter().find(|path| path.exists());

    let root = match root {
        Some(path) => path,
        None => {
            warn!(
                frontend = label,
                "frontend assets missing; serving fallback"
            );
            return None;
        }
    };

    let fallback_file = root.join("index.html");
    if !fallback_file.exists() {
        warn!(
            frontend = label,
            path = %fallback_file.display(),
            "frontend index.html missing; spa fallback will return 404"
        );
    }

    let service = ServeDir::new(root.clone()).fallback(ServeFile::new(fallback_file));

    Some(get_service(service))
}

async fn legacy_frontend_unavailable() -> (StatusCode, &'static str) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        "legacy frontend not available (build missing)",
    )
}

async fn forge_frontend_unavailable() -> (StatusCode, &'static str) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        "forge frontend not available (build missing)",
    )
}

#[derive(serde::Serialize)]
struct OmniInstancesResponse {
    instances: Vec<OmniInstanceDto>,
}

#[derive(serde::Serialize)]
struct OmniInstanceDto {
    instance_name: String,
    channel_type: String,
    display_name: String,
    status: String,
    is_healthy: bool,
}

impl From<OmniInstance> for OmniInstanceDto {
    fn from(value: OmniInstance) -> Self {
        Self {
            instance_name: value.instance_name,
            channel_type: value.channel_type,
            display_name: value.display_name,
            status: value.status,
            is_healthy: value.is_healthy,
        }
    }
}

#[derive(serde::Serialize)]
struct BranchTemplateResponse {
    task_id: Uuid,
    branch_template: Option<String>,
}

#[derive(serde::Deserialize)]
struct UpdateBranchTemplateRequest {
    branch_template: Option<String>,
}
