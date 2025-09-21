use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use std::sync::Arc;

use crate::services::ForgeServices;

pub fn create_router(services: Arc<ForgeServices>) -> Router {
    Router::new()
        .route("/health", get(health_check))
        // Forge API routes
        .nest("/api/forge", forge_api_routes())
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