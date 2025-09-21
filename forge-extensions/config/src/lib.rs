//! Forge configuration scaffold.

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ForgeConfig {
    pub version: u8,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ConfigError {
    #[error("forge configuration version {0} is not supported yet")]
    UnsupportedVersion(u8),
}

pub fn validate(config: &ForgeConfig) -> Result<(), ConfigError> {
    if config.version == 7 {
        Ok(())
    } else {
        Err(ConfigError::UnsupportedVersion(config.version))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_version_seven() {
        let cfg = ForgeConfig { version: 7 };
        assert!(validate(&cfg).is_ok());
    }
}
