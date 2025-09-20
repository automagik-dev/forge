use anyhow::Error;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

// Import OmniConfig from the omni extension
pub use forge_omni::types::{OmniConfig, RecipientType};

/// Extended configuration v7 with Omni support
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct ConfigV7 {
    pub config_version: String,
    pub theme: String, // Simplified for demo
    pub executor_profile: String, // Simplified for demo
    pub disclaimer_acknowledged: bool,
    pub onboarding_acknowledged: bool,
    pub github_login_acknowledged: bool,
    pub telemetry_acknowledged: bool,
    pub analytics_enabled: Option<bool>,
    pub workspace_dir: Option<String>,
    pub last_app_version: Option<String>,
    pub show_release_notes: bool,
    pub omni: OmniConfig,
}

impl ConfigV7 {
    pub fn from_previous_version(raw_config: &str) -> Result<Self, Error> {
        // Simplified migration logic
        // In real implementation, this would parse v6 config
        let _old_config: serde_json::Value = serde_json::from_str(raw_config)?;

        Ok(Self {
            config_version: "v7".to_string(),
            theme: "system".to_string(),
            executor_profile: "claude-code".to_string(),
            disclaimer_acknowledged: false,
            onboarding_acknowledged: false,
            github_login_acknowledged: false,
            telemetry_acknowledged: false,
            analytics_enabled: None,
            workspace_dir: None,
            last_app_version: None,
            show_release_notes: false,
            omni: OmniConfig {
                enabled: false,
                host: None,
                api_key: None,
                instance: None,
                recipient: None,
                recipient_type: None,
            },
        })
    }
}

impl From<String> for ConfigV7 {
    fn from(raw_config: String) -> Self {
        if let Ok(config) = serde_json::from_str::<ConfigV7>(&raw_config)
            && config.config_version == "v7"
        {
            return config;
        }

        match Self::from_previous_version(&raw_config) {
            Ok(config) => {
                println!("Config upgraded to v7");
                config
            }
            Err(e) => {
                println!("Config migration failed: {}, using default", e);
                Self::default()
            }
        }
    }
}

impl Default for ConfigV7 {
    fn default() -> Self {
        Self {
            config_version: "v7".to_string(),
            theme: "system".to_string(),
            executor_profile: "claude-code".to_string(),
            disclaimer_acknowledged: false,
            onboarding_acknowledged: false,
            github_login_acknowledged: false,
            telemetry_acknowledged: false,
            analytics_enabled: None,
            workspace_dir: None,
            last_app_version: None,
            show_release_notes: false,
            omni: OmniConfig {
                enabled: false,
                host: None,
                api_key: None,
                instance: None,
                recipient: None,
                recipient_type: None,
            },
        }
    }
}