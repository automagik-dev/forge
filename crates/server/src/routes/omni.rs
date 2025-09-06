use axum::{
    Json, Router,
    extract::State,
    response::Json as ResponseJson,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use services::services::omni::{OmniInstance, OmniService};
use ts_rs::TS;
use utils::response::ApiResponse;

use crate::{DeploymentImpl, error::ApiError};

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route("/instances", get(list_instances))
        .route("/validate", post(validate_config))
        .route("/test", post(test_notification))
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct InstancesResponse {
    pub instances: Vec<OmniInstance>,
}

#[axum::debug_handler]
async fn list_instances(
    State(deployment): State<DeploymentImpl>,
) -> ResponseJson<ApiResponse<InstancesResponse>> {
    let config = deployment.config().read().await;
    
    // Check if Omni is configured
    if config.omni.is_none() {
        return ResponseJson(ApiResponse::error("Omni is not configured"));
    }
    
    let omni_config = config.omni.as_ref().unwrap();
    if omni_config.host.is_none() || omni_config.api_key.is_none() {
        return ResponseJson(ApiResponse::error("Omni host or API key is missing"));
    }
    
    // Create service and list instances
    let service = OmniService::new(omni_config.clone());
    match service.list_instances().await {
        Ok(instances) => ResponseJson(ApiResponse::success(InstancesResponse { instances })),
        Err(e) => ResponseJson(ApiResponse::error(&format!("Failed to list instances: {}", e))),
    }
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct ValidateConfigRequest {
    pub host: String,
    pub api_key: String,
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct ValidateConfigResponse {
    pub valid: bool,
    pub instances: Option<Vec<OmniInstance>>,
    pub error: Option<String>,
}

#[axum::debug_handler]
async fn validate_config(
    State(_deployment): State<DeploymentImpl>,
    Json(request): Json<ValidateConfigRequest>,
) -> ResponseJson<ApiResponse<ValidateConfigResponse>> {
    // Create temporary OmniService with provided credentials
    let temp_config = services::services::config::OmniConfig {
        enabled: Some(true),
        host: Some(request.host),
        api_key: Some(request.api_key),
    };
    
    let service = OmniService::new(temp_config);
    
    // Attempt to list instances as validation
    match service.list_instances().await {
        Ok(instances) => ResponseJson(ApiResponse::success(ValidateConfigResponse {
            valid: true,
            instances: Some(instances),
            error: None,
        })),
        Err(e) => ResponseJson(ApiResponse::success(ValidateConfigResponse {
            valid: false,
            instances: None,
            error: Some(format!("Configuration validation failed: {}", e)),
        })),
    }
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct TestNotificationRequest {
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct TestNotificationResponse {
    pub message: String,
}

#[axum::debug_handler]
async fn test_notification(
    State(deployment): State<DeploymentImpl>,
    Json(request): Json<TestNotificationRequest>,
) -> ResponseJson<ApiResponse<TestNotificationResponse>> {
    let config = deployment.config().read().await;
    
    // Check if Omni is enabled
    if config.omni.is_none() {
        return ResponseJson(ApiResponse::error("Omni is not configured"));
    }
    
    let omni_config = config.omni.as_ref().unwrap();
    if omni_config.enabled != Some(true) {
        return ResponseJson(ApiResponse::error("Omni is not enabled"));
    }
    
    if omni_config.host.is_none() || omni_config.api_key.is_none() {
        return ResponseJson(ApiResponse::error("Omni host or API key is missing"));
    }
    
    // Create service and send test notification
    let service = OmniService::new(omni_config.clone());
    let message = request.message.unwrap_or_else(|| "Test notification from Automagik Forge".to_string());
    
    match service.send_notification(&message).await {
        Ok(_) => ResponseJson(ApiResponse::success(TestNotificationResponse {
            message: "Test notification sent successfully".to_string(),
        })),
        Err(e) => ResponseJson(ApiResponse::error(&format!("Failed to send test notification: {}", e))),
    }
}