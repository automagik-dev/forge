//! Omni routes for Forge
//!
//! Handles Omni service status, instances, notifications, and validation endpoints.

use axum::{
    Json,
    extract::State,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sqlx::Row;

use crate::services::ForgeServices;

#[derive(Debug, Deserialize)]
pub struct ValidateOmniRequest {
    host: String,
    api_key: String,
}

#[derive(Debug, Serialize)]
pub struct ValidateOmniResponse {
    valid: bool,
    instances: Vec<forge_omni::OmniInstance>,
    error: Option<String>,
}

/// Get Omni service status
pub async fn get_omni_status(State(services): State<ForgeServices>) -> Result<Json<Value>, StatusCode> {
    let omni = services.omni.read().await;
    let config = omni.config();

    Ok(Json(json!({
        "enabled": config.enabled,
        "version": env!("CARGO_PKG_VERSION"),
        "config": if config.enabled {
            serde_json::to_value(config).ok()
        } else {
            None
        }
    })))
}

/// List Omni instances
pub async fn list_omni_instances(
    State(services): State<ForgeServices>,
) -> Result<Json<Value>, StatusCode> {
    let omni = services.omni.read().await;
    match omni.list_instances().await {
        Ok(instances) => Ok(Json(json!({ "instances": instances }))),
        Err(e) => {
            tracing::error!("Failed to list Omni instances: {}", e);
            Ok(Json(json!({
                "instances": [],
                "error": "Failed to connect to Omni service"
            })))
        }
    }
}

/// List Omni notifications
pub async fn list_omni_notifications(
    State(services): State<ForgeServices>,
) -> Result<Json<Value>, StatusCode> {
    let rows = sqlx::query(
        r#"SELECT
                id,
                task_id,
                notification_type,
                status,
                message,
                error_message,
                sent_at,
                created_at,
                metadata
           FROM forge_omni_notifications
          ORDER BY created_at DESC
          LIMIT 50"#,
    )
    .fetch_all(services.pool())
    .await
    .map_err(|error| {
        tracing::error!("Failed to fetch Omni notifications: {}", error);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let mut notifications = Vec::with_capacity(rows.len());

    for row in rows {
        let metadata = match row.try_get::<Option<String>, _>("metadata") {
            Ok(Some(raw)) => serde_json::from_str::<Value>(&raw).ok(),
            _ => None,
        };

        let record = json!({
            "id": row.try_get::<String, _>("id").unwrap_or_default(),
            "task_id": row.try_get::<Option<String>, _>("task_id").unwrap_or(None),
            "notification_type": row
                .try_get::<String, _>("notification_type")
                .unwrap_or_else(|_| "unknown".to_string()),
            "status": row
                .try_get::<String, _>("status")
                .unwrap_or_else(|_| "pending".to_string()),
            "message": row.try_get::<Option<String>, _>("message").unwrap_or(None),
            "error_message": row
                .try_get::<Option<String>, _>("error_message")
                .unwrap_or(None),
            "sent_at": row.try_get::<Option<String>, _>("sent_at").unwrap_or(None),
            "created_at": row
                .try_get::<String, _>("created_at")
                .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339()),
            "metadata": metadata,
        });

        notifications.push(record);
    }

    Ok(Json(json!({ "notifications": notifications })))
}

/// Validate Omni configuration
pub async fn validate_omni_config(
    State(_services): State<ForgeServices>,
    Json(req): Json<ValidateOmniRequest>,
) -> Result<Json<ValidateOmniResponse>, StatusCode> {
    let temp_config = forge_omni::OmniConfig {
        enabled: false,
        host: Some(req.host),
        api_key: Some(req.api_key),
        instance: None,
        recipient: None,
        recipient_type: None,
    };

    let temp_service = forge_omni::OmniService::new(temp_config);
    match temp_service.list_instances().await {
        Ok(instances) => Ok(Json(ValidateOmniResponse {
            valid: true,
            instances,
            error: None,
        })),
        Err(e) => Ok(Json(ValidateOmniResponse {
            valid: false,
            instances: vec![],
            error: Some(format!("Configuration validation failed: {}", e)),
        })),
    }
}
