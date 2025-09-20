use forge_omni::OmniConfig;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct ForgeConfigExtensions {
    pub omni: OmniConfig,
    // Add other forge-specific config fields here as needed
}

impl Default for ForgeConfigExtensions {
    fn default() -> Self {
        Self {
            omni: OmniConfig::default(),
        }
    }
}

// This struct will wrap the upstream config in forge-app
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct ForgeConfig {
    #[serde(flatten)]
    pub base: serde_json::Value, // Will be the upstream config
    pub forge: ForgeConfigExtensions,
}

pub trait ConfigExt {
    fn get_forge_extensions(&self) -> &ForgeConfigExtensions;
    fn get_omni_config(&self) -> &OmniConfig;
}