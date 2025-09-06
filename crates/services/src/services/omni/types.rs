use serde::{Deserialize, Serialize};
use ts_rs::TS;

// Match the wish specification exactly - simple flat structure
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct OmniConfig {
    pub enabled: bool,
    pub host: Option<String>,
    pub api_key: Option<String>,
    pub instance: Option<String>,
    pub recipient: Option<String>, // phone_number or user_id
    pub recipient_type: Option<RecipientType>, // phone or user_id
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub enum RecipientType {
    PhoneNumber,
    UserId,
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct OmniInstance {
    pub instance_name: String,
    pub channel_type: String, // whatsapp, discord, telegram
    pub display_name: String,
    pub status: String,
    pub is_healthy: bool,
}

#[derive(Debug, Serialize)]
pub struct SendTextRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct SendTextResponse {
    pub success: bool,
    pub message_id: Option<String>,
    pub status: String,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListInstancesResponse {
    pub channels: Vec<OmniInstance>,
    pub total_count: i32,
}

// Additional types for internal use only (not from wish spec)

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