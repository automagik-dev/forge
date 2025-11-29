//! Configuration routes for Forge
//!
//! Handles global forge configuration and auth status endpoints.

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
};
use serde_json::{Value, json};

use super::state::ForgeAppState;
use crate::services::ForgeServices;
use forge_config::ForgeProjectSettings;
use server::{DeploymentImpl, routes::config as upstream_config};
use utils::response::ApiResponse;

/// Build config router with forge override for increased body limit on /profiles
pub fn forge_config_router() -> Router<DeploymentImpl> {
    use axum::extract::DefaultBodyLimit;

    upstream_config::router().layer(DefaultBodyLimit::max(20 * 1024 * 1024))
}

/// Check if auth is required
pub async fn get_auth_required(State(state): State<ForgeAppState>) -> Json<Value> {
    Json(json!({
        "auth_required": state.auth_required
    }))
}

/// Get global forge configuration
pub async fn get_forge_config(
    State(services): State<ForgeServices>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .get_global_settings()
        .await
        .map(|settings| Json(ApiResponse::success(settings)))
        .map_err(|e| {
            tracing::error!("Failed to load forge config: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

/// Update global forge configuration
pub async fn update_forge_config(
    State(services): State<ForgeServices>,
    Json(settings): Json<ForgeProjectSettings>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .set_global_settings(&settings)
        .await
        .map_err(|e| {
            tracing::error!("Failed to persist forge config: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    services.apply_global_omni_config().await.map_err(|e| {
        tracing::error!("Failed to refresh Omni config: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(ApiResponse::success(settings)))
}
