use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use ts_rs::TS;

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct BranchTemplate {
    pub id: i64,
    pub task_id: i64,
    pub template: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, TS)]
pub struct CreateBranchTemplate {
    pub task_id: i64,
    pub template: String,
}

pub struct BranchTemplateService {
    db: SqlitePool,
}

impl BranchTemplateService {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
    }

    pub async fn create_template(&self, data: CreateBranchTemplate) -> Result<BranchTemplate> {
        // Simple implementation for now
        Ok(BranchTemplate {
            id: 0,
            task_id: data.task_id,
            template: data.template,
            created_at: Utc::now().to_rfc3339(),
        })
    }

    pub async fn get_template(&self, _task_id: i64) -> Result<Option<BranchTemplate>> {
        // Simple implementation for now
        Ok(None)
    }

    pub async fn update_template(&self, _task_id: i64, _template: String) -> Result<()> {
        // Simple implementation for now
        Ok(())
    }

    pub async fn delete_template(&self, _task_id: i64) -> Result<()> {
        // Simple implementation for now
        Ok(())
    }
}