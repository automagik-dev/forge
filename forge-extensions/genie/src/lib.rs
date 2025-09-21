//! Genie integration scaffold.

use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GenieConfig {
    pub provider: String,
}

pub fn connect(config: &GenieConfig) -> Result<String> {
    let provider = config.provider.trim();
    if provider.is_empty() {
        bail!("missing provider name");
    }
    Ok(format!("connected to {provider}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn connect_returns_provider() {
        let output = connect(&GenieConfig {
            provider: "claude".into(),
        })
        .unwrap();
        assert_eq!(output, "connected to claude");
    }
}
