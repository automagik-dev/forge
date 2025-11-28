//! Project routes for Forge
//!
//! Handles project-specific settings and profiles endpoints.

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use uuid::Uuid;

use crate::services::ForgeServices;
use forge_config::ForgeProjectSettings;
use utils::response::ApiResponse;

/// Get project-specific settings
pub async fn get_project_settings(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .get_forge_settings(project_id)
        .await
        .map(|settings| Json(ApiResponse::success(settings)))
        .map_err(|e| {
            tracing::error!("Failed to load project settings {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
}

/// Update project-specific settings
pub async fn update_project_settings(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
    Json(settings): Json<ForgeProjectSettings>,
) -> Result<Json<ApiResponse<ForgeProjectSettings>>, StatusCode> {
    services
        .config
        .set_forge_settings(project_id, &settings)
        .await
        .map_err(|e| {
            tracing::error!("Failed to persist project settings {}: {}", project_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::success(settings)))
}

/// Get executor profiles for a specific project
pub async fn get_project_profiles(
    Path(project_id): Path<Uuid>,
    State(services): State<ForgeServices>,
) -> Result<Json<ApiResponse<executors::profile::ExecutorConfigs>>, StatusCode> {
    services
        .profile_cache
        .get_profiles_for_project(project_id)
        .await
        .map(|profiles| {
            tracing::debug!(
                "Retrieved {} executor profiles for project {}",
                profiles.executors.len(),
                project_id
            );
            Json(ApiResponse::success(profiles))
        })
        .map_err(|e| {
            tracing::error!("Failed to load profiles for project {}: {}", project_id, e);
            StatusCode::NOT_FOUND
        })
}
