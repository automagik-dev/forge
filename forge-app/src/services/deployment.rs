use sqlx::SqlitePool;
use anyhow::Result;

#[derive(Clone)]
pub struct ForgeDeployment {
    db: SqlitePool,
}

impl ForgeDeployment {
    pub async fn new(db: SqlitePool) -> Result<Self> {
        Ok(Self { db })
    }

    pub fn db(&self) -> &SqlitePool {
        &self.db
    }
}