use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Row, SqlitePool, Type};
use ts_rs::TS;
use uuid::Uuid;

use super::{project::Project, task_attempt::TaskAttempt};

#[derive(Debug, Clone, Type, Serialize, Deserialize, PartialEq, TS)]
#[sqlx(type_name = "task_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    InProgress,
    InReview,
    Done,
    Cancelled,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid, // Foreign key to Project
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub branch_template: Option<String>, // User-defined branch naming pattern
    pub parent_task_attempt: Option<Uuid>, // Foreign key to parent TaskAttempt
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct TaskWithAttemptStatus {
    #[serde(flatten)]
    #[ts(flatten)]
    pub task: Task,
    pub has_in_progress_attempt: bool,
    pub has_merged_attempt: bool,
    pub last_attempt_failed: bool,
    pub executor: String,
}

impl std::ops::Deref for TaskWithAttemptStatus {
    type Target = Task;
    fn deref(&self) -> &Self::Target {
        &self.task
    }
}

impl std::ops::DerefMut for TaskWithAttemptStatus {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.task
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct TaskRelationships {
    pub parent_task: Option<Task>,    // The task that owns this attempt
    pub current_attempt: TaskAttempt, // The attempt we're viewing
    pub children: Vec<Task>,          // Tasks created by this attempt
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateTask {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub branch_template: Option<String>,
    pub parent_task_attempt: Option<Uuid>,
    pub image_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize, TS)]
pub struct UpdateTask {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub branch_template: Option<String>,
    pub parent_task_attempt: Option<Uuid>,
    pub image_ids: Option<Vec<Uuid>>,
}

impl Task {
    pub fn to_prompt(&self) -> String {
        if let Some(description) = &self.description {
            format!("Title: {}\n\nDescription:{}", &self.title, description)
        } else {
            self.title.clone()
        }
    }

    pub async fn parent_project(&self, pool: &SqlitePool) -> Result<Option<Project>, sqlx::Error> {
        Project::find_by_id(pool, self.project_id).await
    }

    pub async fn find_by_project_id_with_attempt_status(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<TaskWithAttemptStatus>, sqlx::Error> {
        let records = sqlx::query(
            r#"SELECT
  t.id,
  t.project_id,
  t.title,
  t.description,
  t.status,
  COALESCE(fx.branch_template, t.branch_template) AS branch_template,
  t.parent_task_attempt,
  t.created_at,
  t.updated_at,

  CASE WHEN EXISTS (
    SELECT 1
      FROM task_attempts ta
      JOIN execution_processes ep
        ON ep.task_attempt_id = ta.id
     WHERE ta.task_id       = t.id
       AND ep.status        = 'running'
       AND ep.run_reason IN ('setupscript','cleanupscript','codingagent')
     LIMIT 1
  ) THEN 1 ELSE 0 END            AS has_in_progress_attempt,

  CASE WHEN (
    SELECT ep.status
      FROM task_attempts ta
      JOIN execution_processes ep
        ON ep.task_attempt_id = ta.id
     WHERE ta.task_id       = t.id
     AND ep.run_reason IN ('setupscript','cleanupscript','codingagent')
     ORDER BY ep.created_at DESC
     LIMIT 1
  ) IN ('failed','killed') THEN 1 ELSE 0 END
                                 AS last_attempt_failed,

  ( SELECT ta.executor
      FROM task_attempts ta
      WHERE ta.task_id = t.id
     ORDER BY ta.created_at DESC
      LIMIT 1
    )                               AS executor

FROM tasks t
LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id
WHERE t.project_id = ?
ORDER BY t.created_at DESC"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        let tasks = records
            .into_iter()
            .map(|rec| -> Result<TaskWithAttemptStatus, sqlx::Error> {
                let task = Task {
                    id: rec.try_get("id")?,
                    project_id: rec.try_get("project_id")?,
                    title: rec.try_get("title")?,
                    description: rec.try_get("description")?,
                    status: rec.try_get("status")?,
                    branch_template: rec.try_get("branch_template")?,
                    parent_task_attempt: rec.try_get("parent_task_attempt")?,
                    created_at: rec.try_get("created_at")?,
                    updated_at: rec.try_get("updated_at")?,
                };

                let has_in_progress: i64 = rec.try_get("has_in_progress_attempt")?;
                let last_failed: i64 = rec.try_get("last_attempt_failed")?;
                let executor: String = rec.try_get("executor")?;

                Ok(TaskWithAttemptStatus {
                    task,
                    has_in_progress_attempt: has_in_progress != 0,
                    has_merged_attempt: false, // TODO use merges table
                    last_attempt_failed: last_failed != 0,
                    executor,
                })
            })
            .collect::<Result<Vec<_>, _>>()?;

        Ok(tasks)
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as::<_, Task>(
            r#"SELECT
                 t.id,
                 t.project_id,
                 t.title,
                 t.description,
                 t.status,
                 COALESCE(fx.branch_template, t.branch_template) AS branch_template,
                 t.parent_task_attempt,
                 t.created_at,
                 t.updated_at
               FROM tasks t
               LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id
               WHERE t.id = ?"#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_rowid(pool: &SqlitePool, rowid: i64) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as::<_, Task>(
            r#"SELECT
                 t.id,
                 t.project_id,
                 t.title,
                 t.description,
                 t.status,
                 COALESCE(fx.branch_template, t.branch_template) AS branch_template,
                 t.parent_task_attempt,
                 t.created_at,
                 t.updated_at
               FROM tasks t
               LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id
               WHERE t.rowid = ?"#,
        )
        .bind(rowid)
        .fetch_optional(pool)
        .await
    }

    pub async fn find_by_id_and_project_id(
        pool: &SqlitePool,
        id: Uuid,
        project_id: Uuid,
    ) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as::<_, Task>(
            r#"SELECT
                 t.id,
                 t.project_id,
                 t.title,
                 t.description,
                 t.status,
                 COALESCE(fx.branch_template, t.branch_template) AS branch_template,
                 t.parent_task_attempt,
                 t.created_at,
                 t.updated_at
               FROM tasks t
               LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id
               WHERE t.id = ? AND t.project_id = ?"#,
        )
        .bind(id)
        .bind(project_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create(
        pool: &SqlitePool,
        data: &CreateTask,
        task_id: Uuid,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"INSERT INTO tasks (id, project_id, title, description, status, branch_template, parent_task_attempt) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               RETURNING id as "id!: Uuid", project_id as "project_id!: Uuid", title, description, status as "status!: TaskStatus", branch_template, parent_task_attempt as "parent_task_attempt: Uuid", created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>""#,
            task_id,
            data.project_id,
            data.title,
            data.description,
            TaskStatus::Todo as TaskStatus,
            data.branch_template,
            data.parent_task_attempt
        )
        .fetch_one(pool)
        .await
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        project_id: Uuid,
        title: String,
        description: Option<String>,
        status: TaskStatus,
        branch_template: Option<String>,
        parent_task_attempt: Option<Uuid>,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as!(
            Task,
            r#"UPDATE tasks 
               SET title = $3, description = $4, status = $5, branch_template = $6, parent_task_attempt = $7 
               WHERE id = $1 AND project_id = $2 
               RETURNING id as "id!: Uuid", project_id as "project_id!: Uuid", title, description, status as "status!: TaskStatus", branch_template, parent_task_attempt as "parent_task_attempt: Uuid", created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>""#,
            id,
            project_id,
            title,
            description,
            status,
            branch_template,
            parent_task_attempt
        )
        .fetch_one(pool)
        .await
    }

    pub async fn update_status(
        pool: &SqlitePool,
        id: Uuid,
        status: TaskStatus,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE tasks SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            id,
            status
        )
        .execute(pool)
        .await?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!("DELETE FROM tasks WHERE id = $1", id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }

    pub async fn exists(
        pool: &SqlitePool,
        id: Uuid,
        project_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query!(
            "SELECT id as \"id!: Uuid\" FROM tasks WHERE id = $1 AND project_id = $2",
            id,
            project_id
        )
        .fetch_optional(pool)
        .await?;
        Ok(result.is_some())
    }

    pub async fn find_children_by_attempt_id(
        pool: &SqlitePool,
        attempt_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        // Find only child tasks that have this attempt as their parent
        sqlx::query_as::<_, Task>(
            r#"SELECT 
                 t.id,
                 t.project_id,
                 t.title,
                 t.description,
                 t.status,
                 COALESCE(fx.branch_template, t.branch_template) AS branch_template,
                 t.parent_task_attempt,
                 t.created_at,
                 t.updated_at
               FROM tasks t
               LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id
               WHERE t.parent_task_attempt = ?
               ORDER BY t.created_at DESC"#,
        )
        .bind(attempt_id)
        .fetch_all(pool)
        .await
    }

    pub async fn find_relationships_for_attempt(
        pool: &SqlitePool,
        task_attempt: &TaskAttempt,
    ) -> Result<TaskRelationships, sqlx::Error> {
        // 1. Get the current task (task that owns this attempt)
        let current_task = Self::find_by_id(pool, task_attempt.task_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        // 2. Get parent task (if current task was created by another task's attempt)
        let parent_task = if let Some(parent_attempt_id) = current_task.parent_task_attempt {
            // Find the attempt that created the current task
            if let Ok(Some(parent_attempt)) = TaskAttempt::find_by_id(pool, parent_attempt_id).await
            {
                // Find the task that owns that parent attempt - THAT's the real parent
                Self::find_by_id(pool, parent_attempt.task_id).await?
            } else {
                None
            }
        } else {
            None
        };

        // 3. Get children tasks (created by this attempt)
        let children = Self::find_children_by_attempt_id(pool, task_attempt.id).await?;

        Ok(TaskRelationships {
            parent_task,
            current_attempt: task_attempt.clone(),
            children,
        })
    }
}
