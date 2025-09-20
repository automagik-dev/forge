use axum::{routing::get, Router};
use crate::services::deployment::ForgeDeployment;

pub fn create_router(deployment: ForgeDeployment) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .with_state(deployment)
}

async fn health_check() -> &'static str {
    "OK"
}