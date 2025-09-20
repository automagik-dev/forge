use anyhow::Result;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct GenieConfig {
    pub enabled: bool,
    pub agents_file: String,
    pub model: String,
}

impl Default for GenieConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            agents_file: "AGENTS.md".to_string(),
            model: "opus".to_string(),
        }
    }
}

pub struct GenieService {
    config: GenieConfig,
}

impl GenieService {
    pub fn new(config: GenieConfig) -> Self {
        Self { config }
    }

    pub async fn execute_with_agents(&self, prompt: &str) -> Result<String> {
        if !self.config.enabled {
            return Ok(prompt.to_string());
        }

        // This would integrate with the actual Claude API
        // For now, just return the prompt with agents context
        Ok(format!("Executing with agents context: {}", prompt))
    }

    pub fn get_agents_content(&self) -> Result<String> {
        let agents_path = std::path::Path::new(&self.config.agents_file);
        if !agents_path.exists() {
            return Err(anyhow::anyhow!("Agents file not found: {}", self.config.agents_file));
        }

        let content = std::fs::read_to_string(agents_path)?;
        Ok(content)
    }
}