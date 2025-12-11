use serde::{Deserialize, Serialize};
use ts_rs_forge::TS;
use uuid::Uuid;

/// Project-level configuration stored in auxiliary tables
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct ProjectConfig {
    pub project_id: Uuid,
    #[ts(type = "JsonValue | null")]
    pub custom_executors: Option<serde_json::Value>,
    #[ts(type = "JsonValue | null")]
    pub forge_config: Option<serde_json::Value>,
}

/// Configuration for forge-specific project settings
#[derive(Debug, Clone, Serialize, Deserialize, TS, Default)]
pub struct ForgeProjectSettings {
    #[serde(default)]
    pub omni_enabled: bool,
    #[serde(default)]
    pub omni_config: Option<forge_omni::OmniConfig>,
}
