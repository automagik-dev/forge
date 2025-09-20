use crate::DeploymentImpl;
use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, header},
    response::Json as ResponseJson,
    routing::{get, post},
};
use deployment::Deployment;
use serde::{Deserialize, Serialize};
use services::services::omni::{
    OmniService,
    types::{OmniConfig, OmniInstance},
};
use utils::response::ApiResponse;

pub fn router() -> Router<DeploymentImpl> {
    Router::new()
        .route("/instances", get(list_instances))
        .route("/validate", post(validate_config))
        .route("/test", post(test_notification))
}

async fn list_instances(
    State(deployment): State<DeploymentImpl>,
) -> ResponseJson<ApiResponse<Vec<OmniInstance>>> {
    let config = deployment.config().read().await;

    if config.omni.host.is_none() || config.omni.api_key.is_none() {
        return ResponseJson(ApiResponse::error("Omni not configured"));
    }

    // Convert v7 OmniConfig to omni::types::OmniConfig
    let omni_config = OmniConfig {
        enabled: config.omni.enabled,
        host: config.omni.host.clone(),
        api_key: config.omni.api_key.clone(),
        instance: config.omni.instance.clone(),
        recipient: config.omni.recipient.clone(),
        recipient_type: config.omni.recipient_type.clone().map(|rt| match rt {
            services::services::config::RecipientType::PhoneNumber => {
                services::services::omni::types::RecipientType::PhoneNumber
            }
            services::services::config::RecipientType::UserId => {
                services::services::omni::types::RecipientType::UserId
            }
        }),
    };

    let service = OmniService::new(omni_config);
    match service.client.list_instances().await {
        Ok(instances) => ResponseJson(ApiResponse::success(instances)),
        Err(e) => ResponseJson(ApiResponse::error(&format!(
            "Failed to list instances: {}",
            e
        ))),
    }
}

#[derive(Debug, Deserialize)]
struct ValidateConfigRequest {
    host: String,
    api_key: String,
}

#[derive(Debug, Serialize)]
struct ValidateConfigResponse {
    valid: bool,
    instances: Vec<OmniInstance>,
    error: Option<String>,
}

async fn validate_config(
    Json(req): Json<ValidateConfigRequest>,
) -> ResponseJson<ApiResponse<ValidateConfigResponse>> {
    let temp_config = OmniConfig {
        enabled: false,
        host: Some(req.host),
        api_key: Some(req.api_key),
        instance: None,
        recipient: None,
        recipient_type: None,
    };

    let service = OmniService::new(temp_config);
    match service.client.list_instances().await {
        Ok(instances) => ResponseJson(ApiResponse::success(ValidateConfigResponse {
            valid: true,
            instances,
            error: None,
        })),
        Err(e) => ResponseJson(ApiResponse::success(ValidateConfigResponse {
            valid: false,
            instances: vec![],
            error: Some(format!("Configuration validation failed: {}", e)),
        })),
    }
}

async fn test_notification(
    State(deployment): State<DeploymentImpl>,
    headers: HeaderMap,
) -> ResponseJson<ApiResponse<String>> {
    let config = deployment.config().read().await;

    if !config.omni.enabled {
        return ResponseJson(ApiResponse::error("Omni notifications not enabled"));
    }

    // Convert v7 OmniConfig to omni::types::OmniConfig
    let omni_config = OmniConfig {
        enabled: config.omni.enabled,
        host: config.omni.host.clone(),
        api_key: config.omni.api_key.clone(),
        instance: config.omni.instance.clone(),
        recipient: config.omni.recipient.clone(),
        recipient_type: config.omni.recipient_type.clone().map(|rt| match rt {
            services::services::config::RecipientType::PhoneNumber => {
                services::services::omni::types::RecipientType::PhoneNumber
            }
            services::services::config::RecipientType::UserId => {
                services::services::omni::types::RecipientType::UserId
            }
        }),
    };

    let service = OmniService::new(omni_config);
    // Build a base URL from the incoming request host header (e.g., 127.0.0.1:PORT)
    let host = headers
        .get(header::HOST)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("127.0.0.1");
    let base_url = format!("http://{}", host);
    match service
        .send_task_notification(
            "Test Task",
            "✅ Completed",
            Some(&format!("{}/projects/test/tasks/test", base_url)),
        )
        .await
    {
        Ok(_) => ResponseJson(ApiResponse::success(
            "Test notification sent successfully".to_string(),
        )),
        Err(e) => ResponseJson(ApiResponse::error(&format!(
            "Failed to send notification: {}",
            e
        ))),
    }
}
