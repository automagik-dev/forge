use axum::{
    routing::{get, post},
    Router,
};
use backend_common::deployment::Deployment;

use crate::routes::health;

pub fn router(deployment: impl Deployment) -> Router {
    // Public routes (no auth required)
    let public_routes = Router::new().route("/api/health", get(health::health_check));

    public_routes
}
