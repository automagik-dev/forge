use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Main configuration for Omni notification service
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct OmniConfig {
    /// Whether Omni notifications are enabled
    pub enabled: bool,
    
    /// Omni service host URL
    pub host: String,
    
    /// API key for authentication
    pub api_key: String,
    
    /// Selected Omni instance for notifications
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instance: Option<OmniInstance>,
    
    /// Recipient configuration
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipient: Option<Recipient>,
}

/// Represents a recipient for Omni notifications
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct Recipient {
    /// Type of recipient identifier
    pub recipient_type: RecipientType,
    
    /// The actual recipient value (phone number or user ID)
    pub value: String,
}

/// Type of recipient identifier
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub enum RecipientType {
    /// Phone number identifier (e.g., WhatsApp)
    PhoneNumber,
    /// User ID identifier (e.g., Discord)
    UserId,
}

/// Represents an Omni instance with channel information
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct OmniInstance {
    /// Unique identifier for the instance
    pub id: String,
    
    /// Display name of the instance
    pub name: String,
    
    /// Communication channel type
    pub channel: ChannelType,
    
    /// Whether this instance is active
    pub active: bool,
    
    /// Optional description of the instance
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// Supported communication channels
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
pub enum ChannelType {
    WhatsApp,
    Discord,
}

/// Request to send a text message via Omni
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SendTextRequest {
    /// The instance ID to send through
    pub instance_id: String,
    
    /// The recipient of the message
    pub recipient: Recipient,
    
    /// The text message content
    pub message: String,
    
    /// Optional metadata for the message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<MessageMetadata>,
}

/// Metadata for messages
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct MessageMetadata {
    /// Task ID associated with this message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    
    /// Project ID associated with this message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    
    /// Event type that triggered this message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_type: Option<String>,
}

/// Response from sending a text message
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct SendTextResponse {
    /// Whether the message was sent successfully
    pub success: bool,
    
    /// Unique message ID from Omni
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_id: Option<String>,
    
    /// Error message if sending failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    
    /// Timestamp when the message was sent
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sent_at: Option<String>,
}

/// Response from listing available instances
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ListInstancesResponse {
    /// List of available Omni instances
    pub instances: Vec<OmniInstance>,
    
    /// Total count of instances
    pub total: usize,
}

/// Test connection request
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionRequest {
    /// Host to test connection to
    pub host: String,
    
    /// API key for authentication
    pub api_key: String,
}

/// Test connection response
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct TestConnectionResponse {
    /// Whether the connection test was successful
    pub success: bool,
    
    /// Error message if connection failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    
    /// Version information from the Omni service
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

/// Notification event types for Omni
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "snake_case")]
pub enum OmniNotificationEvent {
    TaskCreated,
    TaskUpdated,
    TaskCompleted,
    TaskFailed,
    ExecutionStarted,
    ExecutionCompleted,
    ExecutionFailed,
}

/// Utility struct for Omni errors
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct OmniError {
    /// Error code
    pub code: String,
    
    /// Human-readable error message
    pub message: String,
    
    /// Optional additional details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recipient_type_serialization() {
        let phone = RecipientType::PhoneNumber;
        let json = serde_json::to_string(&phone).unwrap();
        assert_eq!(json, r#""phoneNumber""#);
        
        let user = RecipientType::UserId;
        let json = serde_json::to_string(&user).unwrap();
        assert_eq!(json, r#""userId""#);
    }

    #[test]
    fn test_channel_type_serialization() {
        let whatsapp = ChannelType::WhatsApp;
        let json = serde_json::to_string(&whatsapp).unwrap();
        assert_eq!(json, r#""whatsapp""#);
        
        let discord = ChannelType::Discord;
        let json = serde_json::to_string(&discord).unwrap();
        assert_eq!(json, r#""discord""#);
    }

    #[test]
    fn test_omni_config_defaults() {
        let config = OmniConfig {
            enabled: false,
            host: "https://omni.example.com".to_string(),
            api_key: "secret-key".to_string(),
            instance: None,
            recipient: None,
        };
        
        assert!(!config.enabled);
        assert_eq!(config.host, "https://omni.example.com");
        assert!(config.instance.is_none());
        assert!(config.recipient.is_none());
    }
}