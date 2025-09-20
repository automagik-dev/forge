use serde::{Deserialize, Serialize};

// Re-export omni types from forge-omni extension
pub use forge_omni::{OmniConfig, RecipientType};

/// Forge configuration that extends upstream config with additional features
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ForgeConfig {
    /// Base upstream config (will be flattened in composition layer)
    #[serde(flatten)]
    pub base: serde_json::Value, // Use Value to avoid tight coupling to upstream

    /// Forge-specific extensions
    pub omni: Option<OmniConfig>,
    pub branch_templates_enabled: bool,
    pub genie_enabled: bool,

    /// Forge metadata
    pub forge_version: String,
}

impl Default for ForgeConfig {
    fn default() -> Self {
        Self {
            base: serde_json::Value::Object(serde_json::Map::new()),
            omni: None,
            branch_templates_enabled: true,
            genie_enabled: true,
            forge_version: "0.1.0".to_string(),
        }
    }
}

impl ForgeConfig {
    /// Create a new ForgeConfig by extending upstream config
    pub fn from_upstream(upstream_config: serde_json::Value) -> Self {
        Self {
            base: upstream_config,
            omni: None,
            branch_templates_enabled: true,
            genie_enabled: true,
            forge_version: "0.1.0".to_string(),
        }
    }

    /// Merge forge config back with upstream config for serialization
    pub fn to_merged_config(&self) -> serde_json::Value {
        let mut merged = self.base.clone();

        if let serde_json::Value::Object(ref mut map) = merged {
            // Add forge-specific fields
            if let Some(omni) = &self.omni {
                map.insert("omni".to_string(), serde_json::to_value(omni).unwrap_or_default());
            }
            map.insert("branch_templates_enabled".to_string(), serde_json::Value::Bool(self.branch_templates_enabled));
            map.insert("genie_enabled".to_string(), serde_json::Value::Bool(self.genie_enabled));
            map.insert("forge_version".to_string(), serde_json::Value::String(self.forge_version.clone()));
        }

        merged
    }

    /// Check if Omni notifications are enabled and configured
    pub fn is_omni_enabled(&self) -> bool {
        self.omni.as_ref().map(|o| o.enabled).unwrap_or(false)
    }

    /// Get Omni configuration if available
    pub fn omni_config(&self) -> Option<&OmniConfig> {
        self.omni.as_ref()
    }
}

/// Configuration service for managing forge-specific settings
pub struct ForgeConfigService {
    config: ForgeConfig,
}

impl ForgeConfigService {
    pub fn new(config: ForgeConfig) -> Self {
        Self { config }
    }

    /// Load forge config from file, extending upstream config
    pub async fn load_from_file(config_path: &std::path::Path) -> Result<Self, Box<dyn std::error::Error>> {
        let content = tokio::fs::read_to_string(config_path).await
            .unwrap_or_else(|_| "{}".to_string());

        let raw_config: serde_json::Value = serde_json::from_str(&content)?;

        // Extract forge-specific fields, leave the rest as upstream config
        let mut forge_config = ForgeConfig::from_upstream(raw_config.clone());

        if let serde_json::Value::Object(map) = raw_config {
            if let Some(omni_value) = map.get("omni") {
                forge_config.omni = serde_json::from_value(omni_value.clone()).ok();
            }
            if let Some(branch_templates) = map.get("branch_templates_enabled") {
                if let Some(enabled) = branch_templates.as_bool() {
                    forge_config.branch_templates_enabled = enabled;
                }
            }
            if let Some(genie) = map.get("genie_enabled") {
                if let Some(enabled) = genie.as_bool() {
                    forge_config.genie_enabled = enabled;
                }
            }
            if let Some(version) = map.get("forge_version") {
                if let Some(ver) = version.as_str() {
                    forge_config.forge_version = ver.to_string();
                }
            }
        }

        Ok(Self::new(forge_config))
    }

    /// Save forge config to file
    pub async fn save_to_file(&self, config_path: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
        let merged_config = self.config.to_merged_config();
        let content = serde_json::to_string_pretty(&merged_config)?;
        tokio::fs::write(config_path, content).await?;
        Ok(())
    }

    /// Get current forge config
    pub fn config(&self) -> &ForgeConfig {
        &self.config
    }

    /// Get mutable reference to config
    pub fn config_mut(&mut self) -> &mut ForgeConfig {
        &mut self.config
    }

    /// Update Omni configuration
    pub fn set_omni_config(&mut self, omni_config: Option<OmniConfig>) {
        self.config.omni = omni_config;
    }

    /// Enable/disable branch templates
    pub fn set_branch_templates_enabled(&mut self, enabled: bool) {
        self.config.branch_templates_enabled = enabled;
    }

    /// Enable/disable Genie
    pub fn set_genie_enabled(&mut self, enabled: bool) {
        self.config.genie_enabled = enabled;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_forge_config_default() {
        let config = ForgeConfig::default();
        assert!(config.branch_templates_enabled);
        assert!(config.genie_enabled);
        assert_eq!(config.forge_version, "0.1.0");
        assert!(config.omni.is_none());
    }

    #[test]
    fn test_forge_config_merge() {
        let mut config = ForgeConfig::default();
        config.omni = Some(OmniConfig {
            enabled: true,
            host: Some("https://omni.example.com".to_string()),
            api_key: Some("test-key".to_string()),
            instance: Some("test-instance".to_string()),
            recipient: Some("test@example.com".to_string()),
            recipient_type: Some(RecipientType::PhoneNumber),
        });

        let merged = config.to_merged_config();

        assert!(merged.get("omni").is_some());
        assert_eq!(merged.get("branch_templates_enabled").unwrap().as_bool().unwrap(), true);
        assert_eq!(merged.get("forge_version").unwrap().as_str().unwrap(), "0.1.0");
    }
}