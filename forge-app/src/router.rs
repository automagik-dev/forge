use axum::{
    extract::State,
    http::{header, StatusCode, Uri},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Router,
};
use rust_embed::RustEmbed;
use tower_http::cors::CorsLayer;

use crate::services::ForgeServices;

// Embed the new forge frontend (will be built later)
#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct ForgeFrontend;

// Embed the legacy upstream frontend
#[derive(RustEmbed)]
#[folder = "../upstream/frontend/dist"]
struct LegacyFrontend;

/// Create the main router with dual frontend support
pub async fn create_router(forge_services: ForgeServices) -> anyhow::Result<Router> {
    let app = Router::new()
        // API routes (composed forge + upstream services)
        .nest("/api", api_router())

        // Legacy frontend at /legacy
        .nest("/legacy", legacy_frontend_router())

        // Health check
        .route("/health", get(health_check))

        // New forge frontend at root (fallback)
        .fallback(forge_frontend_router())

        // Add CORS middleware
        .layer(CorsLayer::permissive())

        // Add forge services state
        .with_state(forge_services);

    Ok(app)
}

/// API router that composes upstream and forge services
fn api_router() -> Router<ForgeServices> {
    Router::new()
        // Forge-specific API endpoints
        .route("/forge/omni/instances", get(list_omni_instances))
        .route("/forge/omni/send", post(send_omni_notification))
        .route("/forge/branch-templates/:task_id", get(get_branch_template))
        .route("/forge/branch-templates/:task_id", post(set_branch_template))
        .route("/forge/genie/wishes", get(list_wishes))
        .route("/forge/genie/commands", get(list_commands))

        // Upstream API endpoints will be proxied through composition services
        // For now, we'll create basic placeholders
        .route("/tasks", get(list_tasks))
        .route("/tasks", post(create_task))
        .route("/projects", get(list_projects))
}

/// Serve the new forge frontend
fn forge_frontend_router() -> Router<ForgeServices> {
    Router::new()
        .route("/*path", get(serve_forge_frontend))
        .route("/", get(serve_forge_index))
}

/// Serve the legacy upstream frontend
fn legacy_frontend_router() -> Router<ForgeServices> {
    Router::new()
        .route("/*path", get(serve_legacy_frontend))
        .route("/", get(serve_legacy_index))
}

// Handler functions

async fn health_check() -> impl IntoResponse {
    "🔥 Forge app is running with upstream-as-library architecture"
}

async fn serve_forge_frontend(uri: Uri) -> impl IntoResponse {
    serve_embedded_file::<ForgeFrontend>(uri.path())
}

async fn serve_forge_index() -> impl IntoResponse {
    serve_embedded_file::<ForgeFrontend>("index.html")
}

async fn serve_legacy_frontend(uri: Uri) -> impl IntoResponse {
    let path = uri.path().strip_prefix("/legacy").unwrap_or(uri.path());
    serve_embedded_file::<LegacyFrontend>(path)
}

async fn serve_legacy_index() -> impl IntoResponse {
    serve_embedded_file::<LegacyFrontend>("index.html")
}

/// Generic function to serve embedded files
fn serve_embedded_file<T: RustEmbed>(path: &str) -> Response {
    let path = path.trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    match T::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime.as_ref())
                .body(content.data.into())
                .unwrap()
        }
        None => {
            // Fallback to index.html for SPA routing
            match T::get("index.html") {
                Some(content) => Html(String::from_utf8_lossy(&content.data).to_string()).into_response(),
                None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
            }
        }
    }
}

// Forge-specific API handlers

async fn list_omni_instances(State(services): State<ForgeServices>) -> impl IntoResponse {
    match services.omni().list_instances().await {
        Ok(instances) => axum::Json(instances).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn send_omni_notification(State(services): State<ForgeServices>) -> impl IntoResponse {
    // Placeholder implementation
    (StatusCode::NOT_IMPLEMENTED, "Omni notifications not yet implemented").into_response()
}

async fn get_branch_template(State(services): State<ForgeServices>) -> impl IntoResponse {
    // Placeholder implementation
    (StatusCode::NOT_IMPLEMENTED, "Branch templates not yet implemented").into_response()
}

async fn set_branch_template(State(services): State<ForgeServices>) -> impl IntoResponse {
    // Placeholder implementation
    (StatusCode::NOT_IMPLEMENTED, "Branch templates not yet implemented").into_response()
}

async fn list_wishes(State(services): State<ForgeServices>) -> impl IntoResponse {
    match services.genie().list_wishes().await {
        Ok(wishes) => axum::Json(wishes).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn list_commands(State(services): State<ForgeServices>) -> impl IntoResponse {
    match services.genie().list_commands().await {
        Ok(commands) => axum::Json(commands).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

// Upstream API handlers (placeholder implementations)

async fn list_tasks(State(_services): State<ForgeServices>) -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, "Tasks API not yet implemented").into_response()
}

async fn create_task(State(_services): State<ForgeServices>) -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, "Create task not yet implemented").into_response()
}

async fn list_projects(State(_services): State<ForgeServices>) -> impl IntoResponse {
    (StatusCode::NOT_IMPLEMENTED, "Projects API not yet implemented").into_response()
}