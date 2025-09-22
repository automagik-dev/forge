pub mod config;

pub use config::{
    Config, ConfigError, EditorConfig, EditorType, GitHubConfig, NotificationConfig, OmniConfig,
    RecipientType, SoundFile, ThemeMode, load_config_from_file, save_config_to_file,
};
