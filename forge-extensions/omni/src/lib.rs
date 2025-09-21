//! Forge Omni extension scaffold.

use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OmniSettings {
    pub enabled: bool,
}

pub fn init(settings: &OmniSettings) {
    if settings.enabled {
        info!("Omni extension scaffold initialised");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_are_disabled() {
        let settings = OmniSettings::default();
        assert!(!settings.enabled);
    }
}
