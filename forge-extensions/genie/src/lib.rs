use std::path::PathBuf;
use serde::{Deserialize, Serialize};

/// Genie configuration and metadata management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenieConfig {
    pub enabled: bool,
    pub claude_directory: Option<PathBuf>,
    pub wishes_directory: Option<PathBuf>,
    pub commands_directory: Option<PathBuf>,
    pub agents_directory: Option<PathBuf>,
}

impl Default for GenieConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            claude_directory: Some(PathBuf::from(".claude")),
            wishes_directory: Some(PathBuf::from("genie/wishes")),
            commands_directory: Some(PathBuf::from(".claude/commands")),
            agents_directory: Some(PathBuf::from(".claude/agents")),
        }
    }
}

/// Genie service for managing Claude integrations and automation
pub struct GenieService {
    config: GenieConfig,
    project_root: PathBuf,
}

impl GenieService {
    pub fn new(config: GenieConfig, project_root: PathBuf) -> Self {
        Self {
            config,
            project_root,
        }
    }

    /// Check if Genie is enabled
    pub fn is_enabled(&self) -> bool {
        self.config.enabled
    }

    /// Get the path to the .claude directory
    pub fn claude_directory(&self) -> Option<PathBuf> {
        self.config.claude_directory.as_ref()
            .map(|p| self.project_root.join(p))
    }

    /// Get the path to the wishes directory
    pub fn wishes_directory(&self) -> Option<PathBuf> {
        self.config.wishes_directory.as_ref()
            .map(|p| self.project_root.join(p))
    }

    /// Get the path to the commands directory
    pub fn commands_directory(&self) -> Option<PathBuf> {
        self.config.commands_directory.as_ref()
            .map(|p| self.project_root.join(p))
    }

    /// Get the path to the agents directory
    pub fn agents_directory(&self) -> Option<PathBuf> {
        self.config.agents_directory.as_ref()
            .map(|p| self.project_root.join(p))
    }

    /// List all available wishes
    pub async fn list_wishes(&self) -> Result<Vec<String>, std::io::Error> {
        let wishes_dir = match self.wishes_directory() {
            Some(dir) => dir,
            None => return Ok(vec![]),
        };

        if !wishes_dir.exists() {
            return Ok(vec![]);
        }

        let mut wishes = vec![];
        let mut entries = tokio::fs::read_dir(wishes_dir).await?;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    wishes.push(name.to_string());
                }
            }
        }

        wishes.sort();
        Ok(wishes)
    }

    /// List all available commands
    pub async fn list_commands(&self) -> Result<Vec<String>, std::io::Error> {
        let commands_dir = match self.commands_directory() {
            Some(dir) => dir,
            None => return Ok(vec![]),
        };

        if !commands_dir.exists() {
            return Ok(vec![]);
        }

        let mut commands = vec![];
        let mut entries = tokio::fs::read_dir(commands_dir).await?;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    commands.push(name.to_string());
                }
            }
        }

        commands.sort();
        Ok(commands)
    }

    /// List all available agents
    pub async fn list_agents(&self) -> Result<Vec<String>, std::io::Error> {
        let agents_dir = match self.agents_directory() {
            Some(dir) => dir,
            None => return Ok(vec![]),
        };

        if !agents_dir.exists() {
            return Ok(vec![]);
        }

        let mut agents = vec![];
        let mut entries = tokio::fs::read_dir(agents_dir).await?;

        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    agents.push(name.to_string());
                }
            }
        }

        agents.sort();
        Ok(agents)
    }

    /// Read a wish file content
    pub async fn read_wish(&self, wish_name: &str) -> Result<String, std::io::Error> {
        let wishes_dir = self.wishes_directory().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::NotFound, "Wishes directory not configured")
        })?;

        let wish_path = wishes_dir.join(format!("{}.md", wish_name));
        tokio::fs::read_to_string(wish_path).await
    }

    /// Read a command file content
    pub async fn read_command(&self, command_name: &str) -> Result<String, std::io::Error> {
        let commands_dir = self.commands_directory().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::NotFound, "Commands directory not configured")
        })?;

        let command_path = commands_dir.join(format!("{}.md", command_name));
        tokio::fs::read_to_string(command_path).await
    }

    /// Read an agent file content
    pub async fn read_agent(&self, agent_name: &str) -> Result<String, std::io::Error> {
        let agents_dir = self.agents_directory().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::NotFound, "Agents directory not configured")
        })?;

        let agent_path = agents_dir.join(format!("{}.md", agent_name));
        tokio::fs::read_to_string(agent_path).await
    }

    /// Check if the genie integration is properly set up
    pub async fn validate_setup(&self) -> Result<bool, std::io::Error> {
        if !self.is_enabled() {
            return Ok(false);
        }

        // Check if required directories exist
        let claude_dir = self.claude_directory();
        let wishes_dir = self.wishes_directory();

        if let Some(dir) = claude_dir {
            if !dir.exists() {
                return Ok(false);
            }
        }

        if let Some(dir) = wishes_dir {
            if !dir.exists() {
                return Ok(false);
            }
        }

        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_genie_service_default() {
        let temp_dir = TempDir::new().unwrap();
        let config = GenieConfig::default();
        let service = GenieService::new(config, temp_dir.path().to_path_buf());

        assert!(service.is_enabled());
        assert!(service.claude_directory().is_some());
        assert!(service.wishes_directory().is_some());
    }

    #[tokio::test]
    async fn test_list_empty_directories() {
        let temp_dir = TempDir::new().unwrap();
        let config = GenieConfig::default();
        let service = GenieService::new(config, temp_dir.path().to_path_buf());

        let wishes = service.list_wishes().await.unwrap();
        assert!(wishes.is_empty());

        let commands = service.list_commands().await.unwrap();
        assert!(commands.is_empty());

        let agents = service.list_agents().await.unwrap();
        assert!(agents.is_empty());
    }
}