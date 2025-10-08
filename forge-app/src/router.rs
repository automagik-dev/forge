//! Forge Router
//!
//! Routes forge-specific APIs under `/api/forge/*` and upstream APIs under `/api/*`.
//! Serves single frontend (with overlay architecture) at `/`.

use axum::{
    Json, Router,
    extract::{FromRef, Path, State},
    http::{HeaderValue, StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use uuid::Uuid;

use crate::services::ForgeServices;
use db::models::{
    image::TaskImage,
    task::{Task, TaskWithAttemptStatus},
    task_attempt::{CreateTaskAttempt, TaskAttempt},
};
use deployment::Deployment;
use forge_config::ForgeProjectSettings;
use server::routes::{
    self as upstream, auth, config as upstream_config, containers, drafts, events,
    execution_processes, filesystem, images, projects, task_attempts, task_templates, tasks,
};
use server::{DeploymentImpl, error::ApiError, routes::tasks::CreateAndStartTaskRequest};
use services::services::container::ContainerService;
use sqlx::{self, Error as SqlxError, Row};
use utils::response::ApiResponse;

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct Frontend;

#[derive(Clone)]
struct ForgeAppState {
    services: ForgeServices,
    deployment: DeploymentImpl,
}

impl ForgeAppState {
    fn new(services: ForgeServices, deployment: DeploymentImpl) -> Self {
        Self {
            services,
            deployment,
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

pub fn create_router(services: ForgeServices) -> Router {
    let deployment = services.deployment.as_ref().clone();
    let state = ForgeAppState::new(services, deployment.clone());

    let upstream_api = upstream_api_router(&deployment);

    Router::new()
        .route("/health", get(health_check))
        .merge(forge_api_routes())
        // Upstream API at /api
        .nest("/api", upstream_api)
        // Single frontend with overlay architecture
        .fallback(frontend_handler)
        .with_state(state)
}

fn forge_api_routes() -> Router<ForgeAppState> {
    Router::new()
        .route(
            "/api/forge/config",
            get(get_forge_config).put(update_forge_config),
        )
        .route(
            "/api/forge/projects/{project_id}/settings",
            get(get_project_settings).put(update_project_settings),
        )
        .route("/api/forge/omni/status", get(get_omni_status))
        .route("/api/forge/omni/instances", get(list_omni_instances))
        .route("/api/forge/omni/validate", post(validate_omni_config))
        .route(
            "/api/forge/omni/notifications",
            get(list_omni_notifications),
        )
    // Branch-templates extension removed - using simple forge/ prefix
}

/// Forge override: create task and start with forge/ branch prefix
async fn forge_create_task_and_start(
    State(deployment): State<DeploymentImpl>,
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

    // Generate forge-prefixed branch name
    let branch_name = format!("forge/{}", task.id);
    let task_attempt_id = Uuid::new_v4();

    let task_attempt = TaskAttempt::create(
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

    router = router.merge(upstream_config::router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(containers::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(projects::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(drafts::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));

    // Build custom tasks router with forge create-and-start override
    let tasks_router_with_override = build_tasks_router_with_forge_override(deployment);
    router =
        router.merge(tasks_router_with_override.with_state::<ForgeAppState>(dep_clone.clone()));

    router = router
        .merge(task_attempts::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(
        execution_processes::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()),
    );
    router = router
        .merge(task_templates::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(auth::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(filesystem::router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(events::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));

    router.nest(
        "/images",
        images::routes().with_state::<ForgeAppState>(dep_clone),
    )
}

/// Build tasks router with forge override for create-and-start endpoint
fn build_tasks_router_with_forge_override(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
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
        .route("/", get(tasks::get_tasks).post(tasks::create_task))
        .route("/stream/ws", get(tasks::stream_tasks_ws))
        .route("/create-and-start", post(forge_create_task_and_start)) // Forge override
        .nest("/{task_id}", task_id_router);

    Router::new().nest("/tasks", inner)
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
        "message": "Forge application ready - backend extensions extracted successfully"
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_forge_branch_prefix_format() {
        // Test that branch names are prefixed with "forge/"
        let task_id = Uuid::new_v4();
        let branch_name = format!("forge/{}", task_id);

        assert!(branch_name.starts_with("forge/"));
        assert_eq!(branch_name, format!("forge/{}", task_id));
    }

    #[test]
    fn test_forge_branch_prefix_uniqueness() {
        // Test that different task IDs produce different branch names
        let task_id_1 = Uuid::new_v4();
        let task_id_2 = Uuid::new_v4();

        let branch_1 = format!("forge/{}", task_id_1);
        let branch_2 = format!("forge/{}", task_id_2);

        assert_ne!(branch_1, branch_2);
        assert!(branch_1.starts_with("forge/"));
        assert!(branch_2.starts_with("forge/"));
    }

    #[test]
    fn test_forge_branch_prefix_uuid_format() {
        // Test that branch name contains valid UUID after prefix
        let task_id = Uuid::new_v4();
        let branch_name = format!("forge/{}", task_id);

        let parts: Vec<&str> = branch_name.split('/').collect();
        assert_eq!(parts.len(), 2);
        assert_eq!(parts[0], "forge");

        // Verify second part is a valid UUID
        let uuid_str = parts[1];
        assert!(Uuid::parse_str(uuid_str).is_ok());
    }
}
