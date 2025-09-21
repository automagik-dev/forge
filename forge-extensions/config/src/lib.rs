use serde::{Deserialize, Serialize};
use ts_rs::TS;
use forge_extensions_omni::OmniConfig;

// Config v7 extension that adds Omni support to the base config
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct ForgeConfigExtensions {
    pub omni: OmniConfig,
}

impl Default for ForgeConfigExtensions {
    fn default() -> Self {
        Self {
            omni: OmniConfig::default(),
        }
    }
}

// Helper to migrate from v6 to v7 config
pub fn add_forge_extensions_to_config(base_config: serde_json::Value) -> serde_json::Value {
    let mut config = base_config;

    // Add Omni config if not present
    if let Some(obj) = config.as_object_mut() {
        if !obj.contains_key("omni") {
            obj.insert(
                "omni".to_string(),
                serde_json::to_value(OmniConfig::default()).unwrap(),
            );
        }

        // Update config version to v7 if it's v6
        if let Some(version) = obj.get("config_version") {
            if version == "v6" {
                obj.insert("config_version".to_string(), serde_json::json!("v7"));
            }
        }
    }

    config
}