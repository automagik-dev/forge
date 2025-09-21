use serde::{Deserialize, Serialize};
use ts_rs::TS;

// Genie wish/command metadata
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct GenieWish {
    pub id: String,
    pub name: String,
    pub description: String,
    pub path: String,
    pub created_at: String,
}

// Genie command integration
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct GenieCommand {
    pub name: String,
    pub description: String,
    pub arguments: Vec<String>,
}

// Genie service for managing wishes and commands
pub struct GenieService {
    wishes_dir: String,
}

impl GenieService {
    pub fn new(wishes_dir: String) -> Self {
        Self { wishes_dir }
    }

    pub fn list_wishes(&self) -> Vec<GenieWish> {
        // For now, return a placeholder list
        // In production, this would scan the genie/wishes directory
        vec![
            GenieWish {
                id: "restructure-upstream-library".to_string(),
                name: "Restructure Upstream Library".to_string(),
                description: "Migrate to upstream-as-library architecture".to_string(),
                path: format!("{}/restructure-upstream-library-wish.md", self.wishes_dir),
                created_at: "2025-09-21".to_string(),
            },
        ]
    }

    pub fn list_commands(&self) -> Vec<GenieCommand> {
        // For now, return a placeholder list
        // In production, this would scan the .claude/commands directory
        vec![
            GenieCommand {
                name: "wish".to_string(),
                description: "Execute a Genie wish".to_string(),
                arguments: vec!["wish_name".to_string()],
            },
            GenieCommand {
                name: "task".to_string(),
                description: "Create or manage tasks".to_string(),
                arguments: vec!["action".to_string(), "task_id".to_string()],
            },
        ]
    }
}