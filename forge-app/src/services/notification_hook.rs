//! Notification Hook for Omni
//!
//! Uses SQLite triggers to detect when tasks complete and queue Omni notifications.
//! This avoids polling and hooks directly into the execution completion event.

use anyhow::Result;
use sqlx::SqlitePool;

/// Install a SQLite trigger that fires when execution_processes complete
/// This trigger will insert a record into forge_omni_notifications
pub async fn install_notification_trigger(pool: &SqlitePool) -> Result<()> {
    // Drop existing trigger if it exists (to allow updates)
    sqlx::query("DROP TRIGGER IF EXISTS omni_execution_completed")
        .execute(pool)
        .await?;

    // Create the trigger that fires when execution_process status changes to completed/failed/killed
    sqlx::query(
        r#"
        CREATE TRIGGER IF NOT EXISTS omni_execution_completed
        AFTER UPDATE OF status ON execution_processes
        WHEN NEW.status IN ('completed', 'failed', 'killed')
          AND OLD.status NOT IN ('completed', 'failed', 'killed')
        BEGIN
            INSERT INTO forge_omni_notifications (
                id,
                task_id,
                notification_type,
                recipient,
                message,
                status,
                metadata,
                created_at
            )
            SELECT
                lower(hex(randomblob(16))),
                NULL,
                'execution_completed',
                '',
                '',
                'pending',
                json_object(
                    'task_attempt_id', lower(hex(NEW.task_attempt_id)),
                    'status', NEW.status,
                    'executor', COALESCE(ta.executor, ''),
                    'branch', COALESCE(ta.branch, ''),
                    'project_id', lower(hex(t.project_id)),
                    'exit_code', COALESCE(NEW.exit_code, 0)
                ),
                datetime('now')
            FROM task_attempts ta
            JOIN tasks t ON t.id = ta.task_id
            WHERE ta.id = NEW.task_attempt_id
              AND NOT EXISTS (
                  -- Prevent duplicate notifications for the same execution
                  SELECT 1 FROM forge_omni_notifications
                  WHERE metadata LIKE '%' || NEW.id || '%'
              );
        END;
        "#
    )
    .execute(pool)
    .await?;

    tracing::info!("Installed Omni notification trigger");
    Ok(())
}