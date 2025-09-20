use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Claude command integration types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ClaudeCommand {
    pub name: String,
    pub description: String,
    pub prompt: String,
    pub parameters: HashMap<String, String>,
}

/// Genie wish specification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GenieWish {
    pub title: String,
    pub description: String,
    pub tasks: Vec<String>,
    pub success_criteria: Vec<String>,
    pub technical_details: Option<String>,
}

/// MCP integration configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct McpConfig {
    pub server_endpoint: String,
    pub tools: Vec<String>,
    pub authentication: Option<String>,
}

pub struct GenieIntegration {
    commands: HashMap<String, ClaudeCommand>,
    wishes: Vec<GenieWish>,
    mcp_config: Option<McpConfig>,
}

impl GenieIntegration {
    pub fn new() -> Self {
        Self {
            commands: HashMap::new(),
            wishes: Vec::new(),
            mcp_config: None,
        }
    }

    pub fn add_command(&mut self, command: ClaudeCommand) -> Result<()> {
        self.commands.insert(command.name.clone(), command);
        Ok(())
    }

    pub fn get_command(&self, name: &str) -> Option<&ClaudeCommand> {
        self.commands.get(name)
    }

    pub fn add_wish(&mut self, wish: GenieWish) -> Result<()> {
        self.wishes.push(wish);
        Ok(())
    }

    pub fn list_wishes(&self) -> &[GenieWish] {
        &self.wishes
    }

    pub fn set_mcp_config(&mut self, config: McpConfig) {
        self.mcp_config = Some(config);
    }

    pub fn get_mcp_config(&self) -> Option<&McpConfig> {
        self.mcp_config.as_ref()
    }
}

impl Default for GenieIntegration {
    fn default() -> Self {
        Self::new()
    }
}