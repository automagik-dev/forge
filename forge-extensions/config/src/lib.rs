//! Forge configuration v7 extension

pub mod v7;
pub use v7::*;

/// Configuration service for v7 config with Omni support
pub struct ConfigService {
    // TODO: Add configuration storage and management
}

impl ConfigService {
    pub fn new() -> Self {
        Self {}
    }

    /// Load configuration from string
    pub fn load_config(&self, raw_config: String) -> ConfigV7 {
        ConfigV7::from(raw_config)
    }

    /// Get default configuration
    pub fn default_config(&self) -> ConfigV7 {
        ConfigV7::default()
    }
}