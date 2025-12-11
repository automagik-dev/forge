use serde::{Deserialize, Serialize};
use ts_rs_forge::TS;

/// Local Omni recipient type options.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub enum RecipientType {
    PhoneNumber,
    UserId,
}

/// Forge-scoped Omni configuration payload.
#[derive(Clone, Debug, Default, Serialize, Deserialize, TS)]
pub struct OmniConfig {
    pub enabled: bool,
    pub host: Option<String>,
    pub api_key: Option<String>,
    pub instance: Option<String>,
    pub recipient: Option<String>,
    pub recipient_type: Option<RecipientType>,
}

#[derive(Debug, Serialize, Deserialize, TS)]
pub struct OmniInstance {
    pub instance_name: String,
    pub channel_type: String,
    pub display_name: String,
    pub status: String,
    pub is_healthy: bool,
}

impl From<RawOmniInstance> for OmniInstance {
    fn from(raw: RawOmniInstance) -> Self {
        OmniInstance {
            instance_name: raw.instance_name,
            channel_type: raw.channel_type,
            display_name: raw.display_name,
            status: raw.status,
            is_healthy: raw.is_healthy,
        }
    }
}

#[derive(Debug, Deserialize)]
pub(crate) struct RawOmniInstance {
    pub instance_name: String,
    pub channel_type: String,
    pub display_name: String,
    pub status: String,
    pub is_healthy: bool,
}

#[derive(Debug, Deserialize)]
pub(crate) struct InstancesResponse {
    pub channels: Vec<RawOmniInstance>,
}

#[derive(Debug, Serialize, TS)]
pub struct SendTextRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,
    pub text: String,
}

#[derive(Debug, Deserialize, TS)]
pub struct SendTextResponse {
    pub success: bool,
    pub message_id: Option<String>,
    pub status: String,
    pub error: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recipient_type_serialization() {
        let phone = RecipientType::PhoneNumber;
        let json = serde_json::to_string(&phone).unwrap();
        assert_eq!(json, r#""PhoneNumber""#);

        let user = RecipientType::UserId;
        let json = serde_json::to_string(&user).unwrap();
        assert_eq!(json, r#""UserId""#);
    }

    #[test]
    fn test_omni_config_defaults() {
        let config = OmniConfig {
            enabled: false,
            host: Some("https://omni.example.com".to_string()),
            api_key: Some("secret-key".to_string()),
            instance: None,
            recipient: None,
            recipient_type: None,
        };

        assert!(!config.enabled);
        assert_eq!(config.host, Some("https://omni.example.com".to_string()));
        assert!(config.instance.is_none());
        assert!(config.recipient.is_none());
        assert!(config.recipient_type.is_none());
    }

    #[test]
    fn test_send_text_request_serialization() {
        let req = SendTextRequest {
            phone_number: Some("1234567890".to_string()),
            user_id: None,
            text: "Test message".to_string(),
        };

        let json = serde_json::to_string(&req).unwrap();
        assert!(json.contains("phone_number"));
        assert!(!json.contains("user_id")); // Should be skipped when None
        assert!(json.contains("Test message"));
    }

    #[test]
    fn test_raw_instance_conversion() {
        let raw = RawOmniInstance {
            instance_name: "felipe0008".to_string(),
            channel_type: "whatsapp".to_string(),
            display_name: "WhatsApp - felipe0008".to_string(),
            status: "connected".to_string(),
            is_healthy: true,
        };

        let instance: OmniInstance = raw.into();
        assert_eq!(instance.instance_name, "felipe0008");
        assert_eq!(instance.channel_type, "whatsapp");
        assert_eq!(instance.display_name, "WhatsApp - felipe0008");
        assert_eq!(instance.status, "connected");
        assert!(instance.is_healthy);

        let raw = RawOmniInstance {
            instance_name: "discord-bot".to_string(),
            channel_type: "discord".to_string(),
            display_name: "Discord - discord-bot".to_string(),
            status: "not_found".to_string(),
            is_healthy: false,
        };

        let instance: OmniInstance = raw.into();
        assert_eq!(instance.display_name, "Discord - discord-bot");
        assert_eq!(instance.status, "not_found");
        assert!(!instance.is_healthy);
    }
}
