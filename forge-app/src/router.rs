use axum::{routing::get, Router};

use crate::services::ForgeServices;

pub fn build_router(_services: ForgeServices) -> Router {
    Router::new().route("/health", get(|| async { "forge" }))
}
