use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use thiserror::Error;
use tracing::instrument;
use utils::text::{git_branch_id, short_uuid};
use uuid::Uuid;

pub type Result<T> = std::result::Result<T, BranchTemplateError>;

#[derive(Debug, Error)]
pub enum BranchTemplateError {
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

#[derive(Clone)]
pub struct BranchTemplateService {
    pool: Arc<SqlitePool>,
}

impl BranchTemplateService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            pool: Arc::new(pool),
        }
    }

    pub fn with_shared_pool(pool: Arc<SqlitePool>) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> Arc<SqlitePool> {
        Arc::clone(&self.pool)
    }

    pub fn generate_branch_name_from_template(
        template: Option<&str>,
        task_title: &str,
        attempt_id: &Uuid,
    ) -> String {
        let sanitized_template = template
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| value.replace(char::is_whitespace, "-"));

        if let Some(template) = sanitized_template {
            let suffix = &attempt_id.to_string()[..4];
            return format!("{}-{}", template, suffix);
        }

        let task_title_id = git_branch_id(task_title);
        format!("forge-{}-{}", task_title_id, short_uuid(attempt_id))
    }

    pub async fn generate_branch_name_for_task(
        &self,
        task_id: Uuid,
        task_title: &str,
        attempt_id: &Uuid,
    ) -> Result<String> {
        let record = self.get_template(task_id).await?;
        let template = record.and_then(|rec| rec.branch_template);
        Ok(Self::generate_branch_name_from_template(
            template.as_deref(),
            task_title,
            attempt_id,
        ))
    }

    #[instrument(skip(self, template), fields(task_id = %task_id))]
    pub async fn upsert_template(&self, task_id: Uuid, template: Option<String>) -> Result<()> {
        match template {
            Some(template) => {
                sqlx::query(
                    r#"INSERT INTO forge_task_extensions (task_id, branch_template, updated_at)
                       VALUES (?, ?, datetime('now', 'subsec'))
                       ON CONFLICT(task_id)
                       DO UPDATE SET branch_template = excluded.branch_template,
                                     updated_at = datetime('now', 'subsec')"#,
                )
                .bind(task_id)
                .bind(template)
                .execute(&*self.pool)
                .await?;
            }
            None => {
                sqlx::query("DELETE FROM forge_task_extensions WHERE task_id = ?")
                    .bind(task_id)
                    .execute(&*self.pool)
                    .await?;
            }
        }

        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn get_template(&self, task_id: Uuid) -> Result<Option<BranchTemplateRecord>> {
        let record = sqlx::query_as::<_, BranchTemplateRecord>(
            r#"SELECT task_id,
                       branch_template,
                       omni_settings,
                       created_at,
                       updated_at
                  FROM forge_task_extensions
                 WHERE task_id = ?"#,
        )
        .bind(task_id)
        .fetch_optional(&*self.pool)
        .await?;

        Ok(record)
    }

    #[instrument(skip(self))]
    pub async fn delete_template(&self, task_id: Uuid) -> Result<()> {
        sqlx::query("DELETE FROM forge_task_extensions WHERE task_id = ?")
            .bind(task_id)
            .execute(&*self.pool)
            .await?;
        Ok(())
    }
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct BranchTemplateRecord {
    pub task_id: Uuid,
    pub branch_template: Option<String>,
    pub omni_settings: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_pool() -> SqlitePool {
        SqlitePool::connect("sqlite::memory:").await.unwrap()
    }

    #[tokio::test]
    async fn upsert_and_get_round_trip() {
        let pool = setup_pool().await;
        sqlx::query(
            r#"CREATE TABLE forge_task_extensions (
                task_id BLOB PRIMARY KEY,
                branch_template TEXT,
                omni_settings TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
            )"#,
        )
        .execute(&pool)
        .await
        .unwrap();

        let service = BranchTemplateService::new(pool.clone());
        let task_id = Uuid::new_v4();
        service
            .upsert_template(task_id, Some("feature/{task}".into()))
            .await
            .unwrap();

        let record = service.get_template(task_id).await.unwrap().unwrap();
        assert_eq!(record.branch_template.as_deref(), Some("feature/{task}"));

        service.upsert_template(task_id, None).await.unwrap();
        let record = service.get_template(task_id).await.unwrap();
        assert!(record.is_none());
    }

    #[test]
    fn generate_branch_name_uses_template_when_present() {
        let attempt_id = Uuid::new_v4();
        let name = BranchTemplateService::generate_branch_name_from_template(
            Some("feature-login"),
            "Login Flow",
            &attempt_id,
        );

        assert!(name.starts_with("feature-login-"));
        assert_eq!(name.len(), "feature-login-".len() + 4);
    }

    #[test]
    fn generate_branch_name_falls_back_to_default_pattern() {
        let attempt_id = Uuid::nil();
        let name = BranchTemplateService::generate_branch_name_from_template(
            None,
            "Add Payment Flow",
            &attempt_id,
        );

        let expected_prefix = format!("forge-{}-", git_branch_id("Add Payment Flow"));
        assert!(name.starts_with(&expected_prefix));
        assert!(name.ends_with(&short_uuid(&attempt_id)));
    }
}
