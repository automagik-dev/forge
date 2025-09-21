//! Forge Router
//!
//! This module will handle dual frontend routing (forge UI at / and upstream UI at /legacy).
//! Currently scaffolded with basic health endpoint - full implementation in Task 3.

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

pub fn create_router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        // TODO Task 2/3: Add API routes for forge services
        // TODO Task 3: Add dual frontend routing (/ and /legacy)
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "forge-app",
        "message": "Forge application scaffold ready - feature extraction pending"
    }))
}