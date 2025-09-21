use axum::{routing::get, Json, Router};
use serde_json::json;

pub fn create_router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        // API routes will be added in Task 2
        // Frontend routes will be added in Task 3
}

async fn health_check() -> Json<serde_json::Value> {
    Json(json!({
        "status": "healthy",
        "service": "forge-app",
        "message": "Scaffold ready for migration"
    }))
}