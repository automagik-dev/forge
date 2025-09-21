use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use rust_embed::{RustEmbed, Embed};
use serde_json::json;
use std::sync::Arc;

use crate::services::ForgeServices;

// Embed the new forge frontend (built from frontend-forge/)
// In development, this will be empty until built
#[derive(RustEmbed)]
#[folder = "../frontend-forge/dist"]
#[include = "*"]
struct ForgeFrontend;

// Embed the legacy frontend (built from frontend/)
#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
#[include = "*"]
struct LegacyFrontend;

pub fn create_router(services: Arc<ForgeServices>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        // Forge API routes
        .nest("/api/forge", forge_api_routes())
        // Legacy frontend at /legacy
        .nest("/legacy", legacy_frontend_router())
        // New forge frontend at root
        .route("/", get(serve_forge_index))
        .route("/{*path}", get(serve_forge_asset))
        .with_state(services)
}

fn forge_api_routes() -> Router<Arc<ForgeServices>> {
    Router::new()
        // Omni routes
        .route("/omni/instances", get(list_omni_instances))
        .route("/omni/test", post(test_omni_notification))
        // Branch template routes
        .route("/branch-templates/{task_id}", get(get_branch_template))
        .route("/branch-templates/{task_id}", post(set_branch_template))
        // Genie routes
        .route("/genie/wishes", get(list_genie_wishes))
        .route("/genie/commands", get(list_genie_commands))
}

fn legacy_frontend_router() -> Router<Arc<ForgeServices>> {
    Router::new()
        .route("/", get(serve_legacy_index))
        .route("/{*path}", get(serve_legacy_asset))
}

async fn serve_forge_index() -> impl IntoResponse {
    match <ForgeFrontend as Embed>::get("index.html") {
        Some(content) => {
            let body = std::str::from_utf8(content.data.as_ref())
                .unwrap_or("")
                .to_owned();
            Html(body).into_response()
        },
        None => (StatusCode::NOT_FOUND, "Forge frontend not built yet. Run: cd frontend-forge && pnpm build").into_response(),
    }
}

async fn serve_forge_asset(Path(path): Path<String>) -> impl IntoResponse {
    match <ForgeFrontend as Embed>::get(&path) {
        Some(content) => {
            let mime = mime_guess::from_path(&path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime.as_ref())
                .body(Body::from(content.data))
                .unwrap()
        }
        None => {
            // Try index.html for client-side routing
            if !path.contains('.') {
                return serve_forge_index().await.into_response();
            }
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("Not Found"))
                .unwrap()
        }
    }
}

async fn serve_legacy_index() -> impl IntoResponse {
    match <LegacyFrontend as Embed>::get("index.html") {
        Some(content) => {
            let body = std::str::from_utf8(content.data.as_ref())
                .unwrap_or("")
                .to_owned();
            Html(body).into_response()
        },
        None => (StatusCode::NOT_FOUND, "Legacy frontend not built yet. Run: cd frontend && pnpm build").into_response(),
    }
}

async fn serve_legacy_asset(Path(path): Path<String>) -> impl IntoResponse {
    match <LegacyFrontend as Embed>::get(&path) {
        Some(content) => {
            let mime = mime_guess::from_path(&path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime.as_ref())
                .body(Body::from(content.data))
                .unwrap()
        }
        None => {
            // Try index.html for client-side routing
            if !path.contains('.') {
                return serve_legacy_index().await.into_response();
            }
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::from("Not Found"))
                .unwrap()
        }
    }
}

async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "healthy",
        "service": "forge-app",
        "version": "0.1.0",
        "features": {
            "omni": true,
            "branch_templates": true,
            "config_v7": true,
            "genie": true
        }
    }))
}

async fn list_omni_instances(
    State(services): State<Arc<ForgeServices>>,
) -> Json<serde_json::Value> {
    // Placeholder for now - will connect to actual Omni service in production
    let instances = services.omni.client.list_instances().await;

    match instances {
        Ok(list) => Json(json!({
            "success": true,
            "instances": list
        })),
        Err(_) => Json(json!({
            "success": false,
            "instances": [],
            "message": "Omni service not configured or unavailable"
        }))
    }
}

async fn test_omni_notification(
    State(services): State<Arc<ForgeServices>>,
) -> Json<serde_json::Value> {
    // Placeholder test notification
    let result = services.omni.send_task_notification(
        "Test Task",
        "✅ Completed",
        Some("http://localhost:8887/test")
    ).await;

    match result {
        Ok(_) => Json(json!({
            "success": true,
            "message": "Test notification sent"
        })),
        Err(e) => Json(json!({
            "success": false,
            "error": e.to_string()
        }))
    }
}

async fn get_branch_template(
    Path(task_id): Path<String>,
    State(_services): State<Arc<ForgeServices>>,
) -> Json<serde_json::Value> {
    // Placeholder - parse UUID and fetch from branch template store
    // Will be connected to actual BranchTemplateStore once DB is initialized
    Json(json!({
        "task_id": task_id,
        "branch_template": "feature-example",
        "message": "Branch template retrieval placeholder"
    }))
}

async fn set_branch_template(
    Path(task_id): Path<String>,
    State(_services): State<Arc<ForgeServices>>,
    Json(payload): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    // Placeholder - parse UUID and update in branch template store
    // Will be connected to actual BranchTemplateStore once DB is initialized
    let template = payload.get("branch_template")
        .and_then(|v| v.as_str())
        .unwrap_or("default");

    Json(json!({
        "task_id": task_id,
        "branch_template": template,
        "message": "Branch template update placeholder"
    }))
}

async fn list_genie_wishes(
    State(services): State<Arc<ForgeServices>>,
) -> Json<serde_json::Value> {
    let wishes = services.genie.list_wishes();
    Json(json!({
        "wishes": wishes
    }))
}

async fn list_genie_commands(
    State(services): State<Arc<ForgeServices>>,
) -> Json<serde_json::Value> {
    let commands = services.genie.list_commands();
    Json(json!({
        "commands": commands
    }))
}