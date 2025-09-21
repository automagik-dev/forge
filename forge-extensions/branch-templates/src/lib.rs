use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct BranchTemplateExtension {
    pub task_id: Uuid,
    pub branch_template: Option<String>,
}

pub struct BranchTemplateStore {
    pool: SqlitePool,
}

impl BranchTemplateStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn fetch(&self, _task_id: Uuid) -> Result<Option<String>> {
        // TODO: Uncomment when DATABASE_URL is configured
        // let template = sqlx::query_scalar!(
        //     r#"SELECT branch_template FROM forge_task_extensions WHERE task_id = ?"#,
        //     task_id
        // )
        // .fetch_optional(&self.pool)
        // .await?
        // .flatten(); // Handle Option<Option<String>>
        // Ok(template)

        // Placeholder for now
        Ok(Some("feature-placeholder".to_string()))
    }

    pub async fn upsert(&self, _task_id: Uuid, _template: Option<String>) -> Result<()> {
        // TODO: Uncomment when DATABASE_URL is configured
        // sqlx::query!(
        //     r#"INSERT OR REPLACE INTO forge_task_extensions (task_id, branch_template) VALUES (?, ?)"#,
        //     task_id,
        //     template
        // )
        // .execute(&self.pool)
        // .await?;
        Ok(())
    }

    pub async fn delete(&self, _task_id: Uuid) -> Result<()> {
        // TODO: Uncomment when DATABASE_URL is configured
        // sqlx::query!(
        //     r#"DELETE FROM forge_task_extensions WHERE task_id = ?"#,
        //     task_id
        // )
        // .execute(&self.pool)
        // .await?;
        Ok(())
    }
}

// Utility function to generate branch name using template or fallback
pub fn generate_branch_name(
    template: Option<&str>,
    task_title: &str,
    attempt_id: &Uuid,
) -> String {
    if let Some(template) = template {
        // User-provided template with short UUID suffix for uniqueness
        format!("{}-{}", template, &attempt_id.to_string()[..4])
    } else {
        // Fallback to forge-{title}-{uuid} pattern
        let task_title_id = git_branch_id(task_title);
        format!(
            "forge-{}-{}",
            task_title_id,
            short_uuid(attempt_id)
        )
    }
}

// Helper function to sanitize text for git branch names
fn git_branch_id(text: &str) -> String {
    text.chars()
        .map(|c| if c.is_alphanumeric() { c.to_ascii_lowercase() } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .take(5) // Limit to first 5 words
        .collect::<Vec<_>>()
        .join("-")
}

// Helper function to get a short UUID representation
fn short_uuid(uuid: &Uuid) -> String {
    uuid.to_string()[..8].to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_branch_name_with_template() {
        let attempt_id = Uuid::new_v4();
        let branch = generate_branch_name(
            Some("feature-login"),
            "Login Flow",
            &attempt_id
        );
        assert!(branch.starts_with("feature-login-"));
        assert_eq!(branch.len(), "feature-login-".len() + 4);
    }

    #[test]
    fn test_generate_branch_name_without_template() {
        let attempt_id = Uuid::nil();
        let branch = generate_branch_name(
            None,
            "Add Payment Flow",
            &attempt_id
        );
        let expected_prefix = "forge-add-payment-flow-";
        assert!(branch.starts_with(expected_prefix));
        assert!(branch.ends_with("00000000"));
    }

    #[test]
    fn test_git_branch_id() {
        assert_eq!(git_branch_id("Hello World"), "hello-world");
        assert_eq!(git_branch_id("React Component_Testing"), "react-component-testing");
        assert_eq!(git_branch_id("Fix@Bug#123"), "fix-bug-123");
        assert_eq!(
            git_branch_id("This is a very long task title that should be truncated"),
            "this-is-a-very-long"
        );
    }

    #[test]
    fn test_short_uuid() {
        let uuid = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();
        assert_eq!(short_uuid(&uuid), "550e8400");
    }
}