use std::sync::Arc;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use thiserror::Error;
use tracing::instrument;
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
                       genie_metadata,
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
    pub genie_metadata: Option<String>,
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
                genie_metadata TEXT,
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
}
