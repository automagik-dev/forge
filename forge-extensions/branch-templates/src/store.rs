use sqlx::{query, query_scalar, SqlitePool};
use uuid::Uuid;

/// Data access layer for branch template metadata stored alongside upstream tasks.
#[derive(Clone)]
pub struct BranchTemplateStore {
    pool: SqlitePool,
}

impl BranchTemplateStore {
    /// Create a new store backed by the provided SQLite connection pool.
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Fetch the forge-specific branch template for a task, if present.
    pub async fn fetch(&self, task_id: Uuid) -> Result<Option<String>, sqlx::Error> {
        ensure_schema(&self.pool).await?;

        let record = query_scalar::<_, Option<String>>(
            "SELECT branch_template FROM forge_task_extensions WHERE task_id = ?",
        )
        .bind(task_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(record.flatten())
    }

    /// Insert or update the stored branch template for a task.
    pub async fn upsert(&self, task_id: Uuid, template: &str) -> Result<(), sqlx::Error> {
        ensure_schema(&self.pool).await?;

        query(
            r#"
            INSERT INTO forge_task_extensions (task_id, branch_template, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(task_id) DO UPDATE SET
                branch_template = excluded.branch_template,
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(task_id)
        .bind(template)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Remove any stored branch template metadata for a task.
    pub async fn clear(&self, task_id: Uuid) -> Result<(), sqlx::Error> {
        ensure_schema(&self.pool).await?;

        query("DELETE FROM forge_task_extensions WHERE task_id = ?")
            .bind(task_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

async fn ensure_schema(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Auxiliary tables live alongside upstream schema; ensure they are present even if migrations
    // have not been executed by forge-app yet.
    query(
        r#"
        CREATE TABLE IF NOT EXISTS forge_task_extensions (
            task_id         BLOB PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
            branch_template TEXT,
            omni_settings   TEXT,
            created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    query(
        r#"
        CREATE TABLE IF NOT EXISTS forge_project_settings (
            project_id  BLOB PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
            settings    TEXT,
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    query(
        r#"
        CREATE TABLE IF NOT EXISTS forge_omni_notifications (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id     BLOB NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            recipient   TEXT,
            status      TEXT,
            payload     TEXT,
            created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await?;

    query(
        r#"
        CREATE TRIGGER IF NOT EXISTS forge_task_extensions_touch
        AFTER UPDATE ON forge_task_extensions
        FOR EACH ROW
        BEGIN
            UPDATE forge_task_extensions
            SET updated_at = CURRENT_TIMESTAMP
            WHERE task_id = OLD.task_id;
        END
        "#,
    )
    .execute(pool)
    .await?;

    query(
        r#"
        CREATE TRIGGER IF NOT EXISTS forge_project_settings_touch
        AFTER UPDATE ON forge_project_settings
        FOR EACH ROW
        BEGIN
            UPDATE forge_project_settings
            SET updated_at = CURRENT_TIMESTAMP
            WHERE project_id = OLD.project_id;
        END
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}
