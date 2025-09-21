use axum::{Router, routing::get};

pub fn create_router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        // API routes will be nested here in future tasks
        // .nest("/api", api_router())
        // Frontend fallback will be added later
}

async fn health_check() -> &'static str {
    "Forge App Scaffold - OK"
}