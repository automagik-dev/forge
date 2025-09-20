use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

/// Extension trait for adding branch template functionality to tasks
/// without modifying the upstream Task struct
pub trait BranchTemplateExt {
    /// Get the branch template for this task from auxiliary table
    async fn get_branch_template(&self, pool: &SqlitePool) -> Result<Option<String>>;

    /// Set the branch template for this task in auxiliary table
    async fn set_branch_template(&self, pool: &SqlitePool, template: Option<String>) -> Result<()>;
}

/// This would be implemented for upstream::Task in the composition layer
/// For now, we define the trait with a simple ID-based interface

/// Branch template data stored in auxiliary table
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchTemplateData {
    pub task_id: Uuid,
    pub template: String,
}

/// Service for managing branch templates through auxiliary tables
pub struct BranchTemplateService {
    pool: SqlitePool,
}

impl BranchTemplateService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Get branch template for a task
    pub async fn get_template(&self, task_id: Uuid) -> Result<Option<String>> {
        let result = sqlx::query_scalar::<_, Option<String>>(
            "SELECT branch_template FROM forge_task_extensions WHERE task_id = ?"
        )
        .bind(task_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(result.flatten())
    }

    /// Set branch template for a task
    pub async fn set_template(&self, task_id: Uuid, template: Option<String>) -> Result<()> {
        if let Some(template) = template {
            // Insert or update the template
            sqlx::query(
                r#"INSERT INTO forge_task_extensions (task_id, branch_template)
                   VALUES (?, ?)
                   ON CONFLICT(task_id) DO UPDATE SET
                   branch_template = excluded.branch_template"#
            )
            .bind(task_id)
            .bind(template)
            .execute(&self.pool)
            .await?;
        } else {
            // Remove the template by setting to NULL
            sqlx::query(
                "UPDATE forge_task_extensions SET branch_template = NULL WHERE task_id = ?"
            )
            .bind(task_id)
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }

    /// Get all tasks with branch templates
    pub async fn list_tasks_with_templates(&self) -> Result<Vec<BranchTemplateData>> {
        let results = sqlx::query_as::<_, (String, Option<String>)>(
            "SELECT task_id, branch_template FROM forge_task_extensions WHERE branch_template IS NOT NULL"
        )
        .fetch_all(&self.pool)
        .await?;

        let templates = results
            .into_iter()
            .filter_map(|(task_id_str, branch_template)| {
                let task_id = Uuid::parse_str(&task_id_str).ok()?;
                branch_template.map(|template| BranchTemplateData {
                    task_id,
                    template,
                })
            })
            .collect();

        Ok(templates)
    }

    /// Generate branch name from template for a given task
    pub fn generate_branch_name(template: &str, task_title: &str, task_id: Uuid) -> String {
        let task_slug = task_title
            .to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .trim_matches('-')
            .to_string();

        let task_id_short = task_id.to_string()[..8].to_string();

        template
            .replace("{task_title}", &task_slug)
            .replace("{task_id}", &task_id_short)
            .replace("{task_id_full}", &task_id.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_branch_name() {
        let template = "feature/{task_title}-{task_id}";
        let task_title = "Add User Authentication";
        let task_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();

        let branch_name = BranchTemplateService::generate_branch_name(template, task_title, task_id);
        assert_eq!(branch_name, "feature/add-user-authentication-550e8400");
    }

    #[test]
    fn test_generate_branch_name_special_chars() {
        let template = "fix/{task_title}";
        let task_title = "Fix bug in @component/auth.tsx";
        let task_id = Uuid::parse_str("550e8400-e29b-41d4-a716-446655440000").unwrap();

        let branch_name = BranchTemplateService::generate_branch_name(template, task_title, task_id);
        assert_eq!(branch_name, "fix/fix-bug-in-component-auth-tsx");
    }
}