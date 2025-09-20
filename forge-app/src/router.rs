use crate::services::ForgeServices;
use axum::{
    extract::State,
    http::StatusCode,
    response::Html,
    routing::{get, Router},
};
use rust_embed::RustEmbed;
use std::sync::Arc;

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct ForgeFrontend;

#[derive(RustEmbed)]
#[folder = "../upstream/frontend/dist"]
struct LegacyFrontend;

pub fn create_router(services: ForgeServices) -> Router {
    Router::new()
        // API routes (composed services)
        .nest("/api", api_router(services))
        // Legacy frontend at /legacy
        .nest("/legacy", legacy_frontend_router())
        // New frontend at root
        .fallback(forge_frontend_router())
}

fn api_router(services: ForgeServices) -> Router {
    Router::new()
        // Task routes with forge extensions
        .route("/tasks", get(handlers::list_tasks).post(handlers::create_task))
        .route("/tasks/:id", get(handlers::get_task).patch(handlers::update_task))
        // Omni notification routes
        .route("/omni/instances", get(handlers::list_omni_instances))
        .route("/omni/notify", post(handlers::send_notification))
        // Config routes
        .route("/config", get(handlers::get_config).post(handlers::update_config))
        .with_state(Arc::new(services))
}

fn forge_frontend_router() -> Router {
    Router::new()
        .route("/", get(serve_forge_index))
        .route("/*path", get(serve_forge_file))
}

fn legacy_frontend_router() -> Router {
    Router::new()
        .route("/", get(serve_legacy_index))
        .route("/*path", get(serve_legacy_file))
}

async fn serve_forge_index() -> Result<Html<String>, StatusCode> {
    match ForgeFrontend::get("index.html") {
        Some(content) => {
            let html = std::str::from_utf8(content.data.as_ref())
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(Html(html.to_string()))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn serve_forge_file(
    axum::extract::Path(path): axum::extract::Path<String>,
) -> Result<Html<String>, StatusCode> {
    match ForgeFrontend::get(&path) {
        Some(content) => {
            let html = std::str::from_utf8(content.data.as_ref())
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(Html(html.to_string()))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn serve_legacy_index() -> Result<Html<String>, StatusCode> {
    match LegacyFrontend::get("index.html") {
        Some(content) => {
            let html = std::str::from_utf8(content.data.as_ref())
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(Html(html.to_string()))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn serve_legacy_file(
    axum::extract::Path(path): axum::extract::Path<String>,
) -> Result<Html<String>, StatusCode> {
    match LegacyFrontend::get(&path) {
        Some(content) => {
            let html = std::str::from_utf8(content.data.as_ref())
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(Html(html.to_string()))
        }
        None => Err(StatusCode::NOT_FOUND),
    }
}

mod handlers {
    use super::*;
    use crate::services::ForgeServices;

    pub async fn list_tasks(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn create_task(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn get_task(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn update_task(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn list_omni_instances(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn send_notification(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn get_config(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }

    pub async fn update_config(State(services): State<Arc<ForgeServices>>) -> StatusCode {
        // Implementation to be added
        StatusCode::NOT_IMPLEMENTED
    }
}