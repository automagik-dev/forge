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

use crate::services::{container_ext::forge_branch_from_task_attempt, ForgeServices};
use forge_config::ForgeProjectSettings;
use server::routes::{
    self as upstream, auth, config as upstream_config, containers, events, execution_processes,
    filesystem, images, projects, task_attempts, task_templates, tasks,
};
use server::DeploymentImpl;
use sqlx::{self, Row};

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

    let legacy_api = legacy_api_router(&deployment);

    Router::new()
        .route("/health", get(health_check))
        .merge(forge_api_routes())
        // Upstream API at /api
        .nest("/api", legacy_api)
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
        .route("/api/forge/omni/instances", get(list_omni_instances))
        .route("/api/forge/omni/notifications", get(list_omni_notifications))
        // Branch-templates extension removed - using simple forge/ prefix
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

