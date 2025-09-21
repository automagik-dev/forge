//! Branch templates extension crate

pub mod models;

use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub use models::template::BranchTemplate;

pub async fn get_branch_template(pool: &SqlitePool, task_id: Uuid) -> Result<Option<String>, sqlx::Error> {
    sqlx::query_scalar!(
        "SELECT branch_template FROM forge_task_extensions WHERE task_id = $1",
        task_id
    )
    .fetch_optional(pool)
    .await
}

pub async fn set_branch_template(
    pool: &SqlitePool,
    task_id: Uuid,
    template: Option<String>,
) -> Result<(), sqlx::Error> {
    let now = Utc::now();
    let existing = sqlx::query!(
        "SELECT id FROM forge_task_extensions WHERE task_id = $1",
        task_id
    )
    .fetch_optional(pool)
    .await?;

    if let Some(_) = existing {
        sqlx::query!(
            "UPDATE forge_task_extensions SET branch_template = $1, updated_at = $2 WHERE task_id = $3",
            template,
            now,
            task_id
        )
        .execute(pool)
        .await?;
    } else {
        sqlx::query!(
            "INSERT INTO forge_task_extensions (id, task_id, branch_template, created_at, updated_at) 
             VALUES (gen_random_uuid(), $1, $2, $3, $3)",
            task_id,
            template,
            now
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub fn generate_branch_name(
    template: Option<String>,
    title: &str,
    attempt_id: &Uuid,
) -> String {
    if let Some(t) = template {
        format!("{}-{}", t, &attempt_id.to_string()[..4])
    } else {
        let task_title_id = utils::text::git_branch_id(title);
        format!(
            "forge-{}-{}",
            task_title_id,
            utils::text::short_uuid(attempt_id)
        )
    }
}