//! Forge Config Extension
//!
//! This module contains forge-specific configuration functionality.
//! For Task 2, this focuses on project-level config management and Omni integration.

pub mod service;
pub mod types;

// Re-export Omni config for compatibility
pub use forge_omni::{OmniConfig, RecipientType};
pub use service::ForgeConfigService;
// Re-export upstream config primitives so downstream code can switch to forge-config without churn
pub use services::services::config::{
    Config, ConfigError, EditorConfig, EditorType, GitHubConfig, NotificationConfig, SoundFile,
    ThemeMode, UiLanguage, load_config_from_file, save_config_to_file,
};
pub use types::*;
