use serde::{Deserialize, Serialize};
use ts_rs::TS;

// Re-export OmniConfig for convenience
pub use forge_omni::types::{OmniConfig, RecipientType};

// Placeholder types that would come from upstream
// These are simplified versions for the forge extension
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct NotificationConfig {
    pub enabled: bool,
    pub sound_file: Option<String>,
}

impl Default for NotificationConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            sound_file: None,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub enum EditorType {
    Vscode,
    Cursor,
    Zed,
    Custom,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct EditorConfig {
    pub editor_type: EditorType,
    pub custom_command: Option<String>,
}

impl Default for EditorConfig {
    fn default() -> Self {
        Self {
            editor_type: EditorType::Vscode,
            custom_command: None,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct GitHubConfig {
    pub personal_access_token: Option<String>,
    pub username: Option<String>,
}

impl Default for GitHubConfig {
    fn default() -> Self {
        Self {
            personal_access_token: None,
            username: None,
        }
    }
}

// Forge-specific Config v7 that adds Omni support
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct ForgeConfig {
    pub config_version: String,
    pub theme: ThemeMode,
    pub disclaimer_acknowledged: bool,
    pub onboarding_acknowledged: bool,
    pub github_login_acknowledged: bool,
    pub telemetry_acknowledged: bool,
    pub notifications: NotificationConfig,
    pub editor: EditorConfig,
    pub github: GitHubConfig,
    pub analytics_enabled: Option<bool>,
    pub workspace_dir: Option<String>,
    pub last_app_version: Option<String>,
    pub show_release_notes: bool,
    pub omni: OmniConfig,
}

impl Default for ForgeConfig {
    fn default() -> Self {
        Self {
            config_version: "v7".to_string(),
            theme: ThemeMode::System,
            disclaimer_acknowledged: false,
            onboarding_acknowledged: false,
            github_login_acknowledged: false,
            telemetry_acknowledged: false,
            notifications: NotificationConfig::default(),
            editor: EditorConfig::default(),
            github: GitHubConfig::default(),
            analytics_enabled: None,
            workspace_dir: None,
            last_app_version: None,
            show_release_notes: false,
            omni: OmniConfig::default(),
        }
    }
}