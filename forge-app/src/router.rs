use axum::{Router, routing::get};
use crate::services::ForgeApp;

pub fn create_router(_app: ForgeApp) -> Router {
    Router::new()
        .route("/health", get(|| async { "OK" }))
        // TODO: Add forge-specific routes here
}