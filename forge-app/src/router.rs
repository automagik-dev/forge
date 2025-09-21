//! Forge Router
//!
//! This module handles API routing for forge services and will include dual frontend routing.
//! Task 2: Basic API endpoints, Task 3: Dual frontend routing (/ and /legacy)

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, put},
    Json, Router,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::services::ForgeServices;

pub fn create_router(services: ForgeServices) -> Router {
    Router::new()
        .route("/health", get(health_check))
        // Forge API routes
        .route("/api/forge/omni/instances", get(list_omni_instances))
        .route(
            "/api/forge/branch-templates/:task_id",
            get(get_branch_template).put(set_branch_template),
        )
        .route(
            "/api/forge/genie/wishes",
            get(list_genie_wishes_placeholder),
        )
        .with_state(services)
    // TODO Task 3: Add dual frontend routing (/ and /legacy)
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "forge-app",
        "message": "Forge application ready - backend extensions extracted successfully"
    }))
}

async fn list_omni_instances(
    State(services): State<ForgeServices>,
) -> Result<Json<Value>, StatusCode> {
    match services.omni.list_instances().await {
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
    match services.branch_templates.get_template(task_id).await {
        Ok(template) => Ok(Json(json!({
            "task_id": task_id,
            "branch_template": template
        }))),
        Err(e) => {
            tracing::error!("Failed to get branch template: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn set_branch_template(
    Path(task_id): Path<Uuid>,
    State(services): State<ForgeServices>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
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
            "branch_template": template,
            "success": true
        }))),
        Err(e) => {
            tracing::error!("Failed to set branch template: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn list_genie_wishes_placeholder() -> Json<Value> {
    Json(json!({
        "wishes": [],
        "message": "Genie integration will be completed in Task 3"
    }))
}
