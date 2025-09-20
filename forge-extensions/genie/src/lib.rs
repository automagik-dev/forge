//! Forge Genie/Claude integrations extension

/// Genie integration service for Claude/Forge commands and agents
pub struct GenieService {
    project_id: String,
}

impl GenieService {
    pub fn new() -> Self {
        Self {
            project_id: "9ac59f5a-2d01-4800-83cd-491f638d2f38".to_string(), // Automagik forge project
        }
    }

    /// Get the forge project ID for task creation
    pub fn get_project_id(&self) -> &str {
        &self.project_id
    }

    /// Generate a git signature for commits
    pub fn generate_git_signature(&self) -> (String, String) {
        ("Automagik Genie".to_string(), "genie@namastex.ai".to_string())
    }

    /// Create a branch name following forge conventions
    pub fn generate_branch_name(&self, task_type: &str, feature: &str, group: &str) -> String {
        format!("{}/{}-{}", task_type, feature, group)
    }
}