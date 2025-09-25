//! Forge Router
//!
//! This module handles API routing for forge services and dual frontend routing.
//! Serves forge UI at `/` and upstream UI at `/legacy`

use axum::{
    extract::{FromRef, Path, State},
    http::{header, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use rust_embed::RustEmbed;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::services::ForgeServices;
use forge_branch_templates::BranchNameResponse;
use forge_config::ForgeProjectSettings;
use server::routes::{
    self as upstream, auth, config as upstream_config, containers, events, execution_processes,
    filesystem, images, projects, task_attempts, task_templates, tasks,
};
use server::DeploymentImpl;
use sqlx::{self, Row};

#[derive(RustEmbed)]
#[folder = "../frontend-forge/dist"]
struct ForgeFrontend;

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct UpstreamFrontend;

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

    Router::new()
        .route("/health", get(health_check))
        .merge(forge_api_routes())
        .nest("/legacy/api", legacy_api_router(&deployment))
        // Dual frontend routing
        .nest("/legacy", legacy_frontend_router())
        .fallback(forge_frontend_handler)
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
        .route("/api/forge/omni/instances", get(list_omni_instances))
        .route(
            "/api/forge/branch-templates/{task_id}",
            get(get_branch_template).put(set_branch_template),
        )
        .route(
            "/api/forge/branch-templates/{task_id}/generate",
            post(generate_branch_name),
        )
}

fn legacy_api_router(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    let mut router = Router::new().route("/health", get(upstream::health::health_check));

    let dep_clone = deployment.clone();

    router = router.merge(upstream_config::router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(containers::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(projects::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(tasks::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
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

fn legacy_frontend_router() -> Router<ForgeAppState> {
    Router::new()
        .route("/", get(serve_legacy_index))
        .route("/{*path}", get(serve_legacy_assets))
}

async fn forge_frontend_handler(uri: axum::http::Uri) -> Response {
    let path = uri.path().trim_start_matches('/');

    if path.is_empty() {
        serve_forge_index().await
    } else {
        serve_forge_assets(Path(path.to_string())).await
    }
}

async fn serve_forge_index() -> Response {
    match ForgeFrontend::get("index.html") {
        Some(content) => Html(content.data.to_vec()).into_response(),
        None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
    }
}

async fn serve_forge_assets(Path(path): Path<String>) -> Response {
    serve_static_file::<ForgeFrontend>(&path).await
}

async fn serve_legacy_index() -> Response {
    match UpstreamFrontend::get("index.html") {
        Some(content) => Html(content.data.to_vec()).into_response(),
        None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
    }
}

async fn serve_legacy_assets(Path(path): Path<String>) -> Response {
    serve_static_file::<UpstreamFrontend>(&path).await
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
) -> Result<Json<ForgeProjectSettings>, StatusCode> {
    services
        .config
        .get_global_settings()
        .await
        .map(Json)
        .map_err(|e| {
            tracing::error!("Failed to load forge config: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

async fn update_forge_config(
    State(services): State<ForgeServices>,
    Json(settings): Json<ForgeProjectSettings>,
) -> Result<Json<ForgeProjectSettings>, StatusCode> {
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

    Ok(Json(settings))
}

async fn get_project_settings(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
) -> Result<Json<ForgeProjectSettings>, StatusCode> {
    services
        .config
        .get_forge_settings(project_id)
        .await
        .map(Json)
        .map_err(|e| {
            tracing::error!("Failed to load project settings {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

async fn update_project_settings(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
    Json(settings): Json<ForgeProjectSettings>,
) -> Result<Json<ForgeProjectSettings>, StatusCode> {
    services
        .config
        .set_forge_settings(project_id, &settings)
        .await
        .map_err(|e| {
            tracing::error!("Failed to persist project settings {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(settings))
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

async fn get_branch_template(
    Path(task_id): Path<Uuid>,
    State(services): State<ForgeServices>,
) -> Result<Json<Value>, StatusCode> {
    let project_id = resolve_project_id(&services, task_id).await?;
    let enabled = services
        .config
        .get_forge_settings(project_id)
        .await
        .map(|settings| settings.branch_templates_enabled)
        .map_err(|e| {
            tracing::error!("Failed to load project settings for {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let template = if enabled {
        services
            .branch_templates
            .get_template(task_id)
            .await
            .map_err(|e| {
                tracing::error!("Failed to get branch template: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
    } else {
        None
    };

    Ok(Json(json!({
        "task_id": task_id,
        "project_id": project_id,
        "branch_template": template,
        "enabled": enabled
    })))
}

async fn set_branch_template(
    Path(task_id): Path<Uuid>,
    State(services): State<ForgeServices>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    let project_id = ensure_branch_templates_enabled(&services, task_id).await?;

    let template = payload
        .get("branch_template")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    match services
        .branch_templates
        .set_template(task_id, template.clone())
        .await
    {
        Ok(()) => Ok(Json(json!({
            "task_id": task_id,
            "project_id": project_id,
            "branch_template": template,
            "enabled": true
        }))),
        Err(e) => {
            tracing::error!("Failed to set branch template: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Deserialize)]
struct BranchNameRequest {
    attempt_id: Option<Uuid>,
}

async fn generate_branch_name(
    Path(task_id): Path<Uuid>,
    State(services): State<ForgeServices>,
    Json(payload): Json<BranchNameRequest>,
) -> Result<Json<BranchNameResponse>, StatusCode> {
    ensure_branch_templates_enabled(&services, task_id).await?;

    let attempt_id = payload.attempt_id.unwrap_or_else(Uuid::new_v4);

    let branch_name = services
        .branch_templates
        .generate_branch_name(task_id, attempt_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to generate branch name: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(BranchNameResponse {
        attempt_id,
        branch_name,
    }))
}

async fn resolve_project_id(services: &ForgeServices, task_id: Uuid) -> Result<Uuid, StatusCode> {
    let pool = services.pool();
    let row = sqlx::query("SELECT project_id FROM tasks WHERE id = ?")
        .bind(task_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            tracing::error!("Failed to resolve project for task {}: {}", task_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let project_id = row
        .map(|r| r.try_get::<Uuid, _>("project_id"))
        .transpose()
        .map_err(|e| {
            tracing::error!("Invalid project id for task {}: {}", task_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(project_id)
}

async fn ensure_branch_templates_enabled(
    services: &ForgeServices,
    task_id: Uuid,
) -> Result<Uuid, StatusCode> {
    let project_id = resolve_project_id(services, task_id).await?;
    let settings = services
        .config
        .get_forge_settings(project_id)
        .await
        .map_err(|e| {
            tracing::error!(
                "Failed to load project settings for {} when validating branch templates: {}",
                project_id,
                e
            );
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if !settings.branch_templates_enabled {
        tracing::warn!(
            "Branch templates disabled for project {}, rejecting task {} operation",
            project_id,
            task_id
        );
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(project_id)
}
