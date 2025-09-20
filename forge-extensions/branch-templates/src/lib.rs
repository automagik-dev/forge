use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct BranchTemplate {
    pub task_id: Uuid,
    pub template: String,
}

pub struct BranchTemplateService {
    db: Pool<Sqlite>,
}

impl BranchTemplateService {
    pub fn new(db: Pool<Sqlite>) -> Self {
        Self { db }
    }

    pub async fn get_branch_template(&self, task_id: Uuid) -> Result<Option<String>> {
        let result = sqlx::query_scalar!(
            r#"
            SELECT branch_template
            FROM forge_task_extensions
            WHERE task_id = ?
            "#,
            task_id
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(result.flatten())
    }

    pub async fn set_branch_template(
        &self,
        task_id: Uuid,
        template: Option<String>,
    ) -> Result<()> {
        if let Some(template) = template {
            sqlx::query!(
                r#"
                INSERT INTO forge_task_extensions (task_id, branch_template)
                VALUES (?, ?)
                ON CONFLICT(task_id) DO UPDATE SET
                    branch_template = excluded.branch_template
                "#,
                task_id,
                template
            )
            .execute(&self.db)
            .await?;
        } else {
            // Clear the template if None
            sqlx::query!(
                r#"
                UPDATE forge_task_extensions
                SET branch_template = NULL
                WHERE task_id = ?
                "#,
                task_id
            )
            .execute(&self.db)
            .await?;
        }

        Ok(())
    }

    pub async fn copy_branch_template(
        &self,
        from_task_id: Uuid,
        to_task_id: Uuid,
    ) -> Result<()> {
        let template = self.get_branch_template(from_task_id).await?;
        if let Some(template) = template {
            self.set_branch_template(to_task_id, Some(template))
                .await?;
        }
        Ok(())
    }
}

// Extension trait for upstream Task type integration
pub trait BranchTemplateExt {
    fn task_id(&self) -> Uuid;
}

// This will be implemented for the upstream Task type in forge-app
// impl BranchTemplateExt for upstream::db::models::Task {
//     fn task_id(&self) -> Uuid {
//         self.id
//     }
// }