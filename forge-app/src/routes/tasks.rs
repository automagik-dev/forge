//! Task routes for Forge
//!
//! Handles task creation, listing, and WebSocket streaming with forge-specific extensions.

use axum::{
    Json, Router,
    extract::{
        Query, State,
        ws::{WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
    routing::{get, post},
};
use futures_util::{SinkExt, StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use super::state::ForgeAppState;
use crate::services::ForgeServices;
use db::models::{
    image::TaskImage,
    task::{Task, TaskWithAttemptStatus},
    task_attempt::{CreateTaskAttempt, TaskAttempt},
};
use deployment::Deployment;
use server::{DeploymentImpl, error::ApiError, routes::tasks as upstream_tasks};
use services::services::container::ContainerService;
use sqlx::{Error as SqlxError, Row};
use utils::response::ApiResponse;
use utils::text::{git_branch_id, short_uuid};
use utils::log_msg::LogMsg;

/// Forge-specific CreateTask that includes is_agent field
#[derive(Debug, Serialize, Deserialize)]
pub struct ForgeCreateTask {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub parent_task_attempt: Option<Uuid>,
    pub image_ids: Option<Vec<Uuid>>,
    pub is_agent: Option<bool>,
}

#[derive(Deserialize)]
pub struct GetTasksParams {
    project_id: Uuid,
}

#[derive(Deserialize)]
pub struct TaskQuery {
    project_id: Uuid,
}

/// Build tasks router with forge override for create-and-start endpoint
pub fn build_tasks_router_with_forge_override(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    use axum::middleware::from_fn_with_state;
    use server::middleware::load_task_middleware;

    let task_id_router = Router::new()
        .route(
            "/",
            get(upstream_tasks::get_task)
                .put(upstream_tasks::update_task)
                .delete(upstream_tasks::delete_task),
        )
        .layer(from_fn_with_state(deployment.clone(), load_task_middleware));

    let inner = Router::new()
        .route("/", get(forge_get_tasks).post(forge_create_task))
        .route("/stream/ws", get(forge_stream_tasks_ws))
        .route("/create-and-start", post(forge_create_task_and_start))
        .nest("/{task_id}", task_id_router);

    Router::new().nest("/tasks", inner)
}

/// Forge override: create task (standard behavior, no special status handling)
pub async fn forge_create_task(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<ForgeCreateTask>,
) -> Result<Json<ApiResponse<Task>>, ApiError> {
    let task_id = Uuid::new_v4();
    let task = Task::create(
        &deployment.db().pool,
        &db::models::task::CreateTask {
            project_id: payload.project_id,
            title: payload.title,
            description: payload.description,
            parent_task_attempt: payload.parent_task_attempt,
            image_ids: payload.image_ids.clone(),
        },
        task_id,
    )
    .await?;

    if let Some(image_ids) = &payload.image_ids {
        TaskImage::associate_many(&deployment.db().pool, task.id, image_ids).await?;
    }

    deployment
        .track_if_analytics_allowed(
            "task_created",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "project_id": task.project_id,
                "has_description": task.description.is_some(),
                "has_images": payload.image_ids.is_some(),
            }),
        )
        .await;

    Ok(Json(ApiResponse::success(task)))
}

/// Forge override for list tasks: Exclude agent tasks (those in forge_agents table)
pub async fn forge_get_tasks(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<GetTasksParams>,
) -> Result<Json<ApiResponse<Vec<TaskWithAttemptStatus>>>, ApiError> {
    let pool = &deployment.db().pool;

    let query_str = r#"SELECT
  t.id                            AS "id",
  t.project_id                    AS "project_id",
  t.title,
  t.description,
  t.status                        AS "status",
  t.parent_task_attempt           AS "parent_task_attempt",
  t.created_at                    AS "created_at",
  t.updated_at                    AS "updated_at",

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
WHERE t.project_id = ?
  AND t.id NOT IN (SELECT task_id FROM forge_agents)
ORDER BY t.created_at DESC"#;

    let rows = sqlx::query(query_str)
        .bind(params.project_id)
        .fetch_all(pool)
        .await?;

    let mut items: Vec<TaskWithAttemptStatus> = Vec::with_capacity(rows.len());
    for row in rows {
        let task_id: Uuid = row.try_get("id").map_err(ApiError::Database)?;
        let task = db::models::task::Task::find_by_id(pool, task_id)
            .await?
            .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

        let has_in_progress_attempt = row
            .try_get::<i64, _>("has_in_progress_attempt")
            .map(|v| v != 0)
            .unwrap_or(false);
        let last_attempt_failed = row
            .try_get::<i64, _>("last_attempt_failed")
            .map(|v| v != 0)
            .unwrap_or(false);
        let executor: String = row.try_get("executor").unwrap_or_else(|_| String::new());

        items.push(TaskWithAttemptStatus {
            task,
            has_in_progress_attempt,
            has_merged_attempt: false,
            last_attempt_failed,
            executor,
        });
    }

    Ok(Json(ApiResponse::success(items)))
}

/// Forge WebSocket stream handler with agent task filtering
pub async fn forge_stream_tasks_ws(
    ws: WebSocketUpgrade,
    State(deployment): State<DeploymentImpl>,
    Query(query): Query<TaskQuery>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        if let Err(e) = handle_forge_tasks_ws(socket, deployment, query.project_id).await {
            tracing::warn!("forge tasks WS closed: {}", e);
        }
    })
}

async fn handle_forge_tasks_ws(
    socket: WebSocket,
    deployment: DeploymentImpl,
    project_id: Uuid,
) -> anyhow::Result<()> {
    let db_pool = deployment.db().pool.clone();
    let stream = deployment
        .events()
        .stream_tasks_raw(project_id)
        .await?
        .filter_map(move |msg_result| {
            let db_pool = db_pool.clone();
            async move {
                match msg_result {
                    Ok(LogMsg::JsonPatch(patch)) => {
                        if let Some(patch_op) = patch.0.first() {
                            if patch_op.path().starts_with("/tasks/") {
                                match patch_op {
                                    json_patch::PatchOperation::Add(op) => {
                                        if let Ok(task_with_status) =
                                            serde_json::from_value::<TaskWithAttemptStatus>(op.value.clone())
                                        {
                                            let is_agent: bool = sqlx::query_scalar(
                                                "SELECT EXISTS(SELECT 1 FROM forge_agents WHERE task_id = ?)"
                                            )
                                            .bind(task_with_status.task.id)
                                            .fetch_one(&db_pool)
                                            .await
                                            .unwrap_or(false);

                                            if !is_agent {
                                                return Some(Ok(LogMsg::JsonPatch(patch)));
                                            }
                                            return None;
                                        }
                                    }
                                    json_patch::PatchOperation::Replace(op) => {
                                        if let Ok(task_with_status) =
                                            serde_json::from_value::<TaskWithAttemptStatus>(op.value.clone())
                                        {
                                            let is_agent: bool = sqlx::query_scalar(
                                                "SELECT EXISTS(SELECT 1 FROM forge_agents WHERE task_id = ?)"
                                            )
                                            .bind(task_with_status.task.id)
                                            .fetch_one(&db_pool)
                                            .await
                                            .unwrap_or(false);

                                            if !is_agent {
                                                return Some(Ok(LogMsg::JsonPatch(patch)));
                                            }
                                            return None;
                                        }
                                    }
                                    json_patch::PatchOperation::Remove(_) => {
                                        return Some(Ok(LogMsg::JsonPatch(patch)));
                                    }
                                    _ => {}
                                }
                            } else if patch_op.path() == "/tasks" {
                                if let json_patch::PatchOperation::Replace(op) = patch_op {
                                    if let Some(tasks_obj) = op.value.as_object() {
                                        let mut filtered_tasks = serde_json::Map::new();
                                        for (task_id_str, task_value) in tasks_obj {
                                            if let Ok(task_with_status) =
                                                serde_json::from_value::<TaskWithAttemptStatus>(task_value.clone())
                                            {
                                                let is_agent: bool = sqlx::query_scalar(
                                                    "SELECT EXISTS(SELECT 1 FROM forge_agents WHERE task_id = ?)"
                                                )
                                                .bind(task_with_status.task.id)
                                                .fetch_one(&db_pool)
                                                .await
                                                .unwrap_or(false);

                                                if !is_agent {
                                                    filtered_tasks.insert(task_id_str.to_string(), task_value.clone());
                                                }
                                            }
                                        }

                                        let filtered_patch = json!([{
                                            "op": "replace",
                                            "path": "/tasks",
                                            "value": filtered_tasks
                                        }]);
                                        return Some(Ok(LogMsg::JsonPatch(
                                            serde_json::from_value(filtered_patch).unwrap()
                                        )));
                                    }
                                }
                            }
                        }
                        Some(Ok(LogMsg::JsonPatch(patch)))
                    }
                    Ok(other) => Some(Ok(other)),
                    Err(e) => Some(Err(e)),
                }
            }
        })
        .map_ok(|msg| msg.to_ws_message_unchecked());

    futures_util::pin_mut!(stream);

    let (mut sender, mut receiver) = socket.split();

    tokio::spawn(async move { while let Some(Ok(_)) = receiver.next().await {} });

    while let Some(item) = stream.next().await {
        match item {
            Ok(msg) => {
                if sender.send(msg).await.is_err() {
                    break;
                }
            }
            Err(e) => {
                tracing::error!("stream error: {}", e);
                break;
            }
        }
    }
    Ok(())
}

/// Forge override: create task and start with forge/ branch prefix
pub async fn forge_create_task_and_start(
    State(deployment): State<DeploymentImpl>,
    State(forge_services): State<ForgeServices>,
    Json(payload): Json<upstream_tasks::CreateAndStartTaskRequest>,
) -> Result<Json<ApiResponse<TaskWithAttemptStatus>>, ApiError> {
    let task_id = Uuid::new_v4();
    let task = Task::create(&deployment.db().pool, &payload.task, task_id).await?;

    if let Some(image_ids) = &payload.task.image_ids {
        TaskImage::associate_many(&deployment.db().pool, task.id, image_ids).await?;
    }

    deployment
        .track_if_analytics_allowed(
            "task_created",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "project_id": task.project_id,
                "has_description": task.description.is_some(),
                "has_images": payload.task.image_ids.is_some(),
            }),
        )
        .await;

    let task_attempt_id = Uuid::new_v4();

    let task_title_id = git_branch_id(&task.title);
    let short_id = short_uuid(&task_attempt_id);
    let branch_name = format!("forge/{}-{}", short_id, task_title_id);

    let mut task_attempt = TaskAttempt::create(
        &deployment.db().pool,
        &CreateTaskAttempt {
            executor: payload.executor_profile_id.executor,
            base_branch: payload.base_branch.clone(),
            branch: branch_name,
        },
        task_attempt_id,
        task.id,
    )
    .await?;

    sqlx::query(
        "INSERT INTO forge_task_attempt_config (task_attempt_id, use_worktree) VALUES (?, ?)"
    )
    .bind(task_attempt_id)
    .bind(true)
    .execute(&deployment.db().pool)
    .await?;

    if let Some(variant) = &payload.executor_profile_id.variant {
        let executor_with_variant = format!("{}:{}", payload.executor_profile_id.executor, variant);
        sqlx::query(
            "UPDATE task_attempts SET executor = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .bind(&executor_with_variant)
        .bind(task_attempt_id)
        .execute(&deployment.db().pool)
        .await?;
        task_attempt.executor = executor_with_variant;
    }

    let project = task
        .parent_project(&deployment.db().pool)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    if let Ok(workspace_profiles) = forge_services.load_profiles_for_workspace(&project.git_repo_path).await {
        let variant_count = workspace_profiles.executors.values()
            .map(|config| config.configurations.len())
            .sum::<usize>();

        let variant_list: Vec<String> = workspace_profiles.executors.iter()
            .flat_map(|(executor, config)| {
                config.configurations.iter().map(move |(variant, coding_agent)| {
                    let prompt_preview = match coding_agent {
                        executors::executors::CodingAgent::ClaudeCode(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::Codex(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::Amp(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::Gemini(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::Opencode(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::CursorAgent(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::QwenCode(cfg) => cfg.append_prompt.get(),
                        executors::executors::CodingAgent::Copilot(cfg) => cfg.append_prompt.get(),
                    }.map(|p| {
                        let trimmed = p.trim();
                        if trimmed.len() > 60 {
                            format!("{}...", &trimmed[..60])
                        } else {
                            trimmed.to_string()
                        }
                    }).unwrap_or_else(|| "<none>".to_string());

                    format!("{}:{} ({})", executor, variant, prompt_preview)
                })
            })
            .collect();

        tracing::info!(
            "Injected {} .genie profile variant(s) for workspace: {} | Profiles: [{}]",
            variant_count,
            project.git_repo_path.display(),
            variant_list.join(", ")
        );

        executors::profile::ExecutorConfigs::set_cached(workspace_profiles);
    } else {
        tracing::warn!(
            "Failed to load .genie profiles for workspace: {}, using defaults",
            project.git_repo_path.display()
        );
    }

    let execution_process = deployment
        .container()
        .start_attempt(&task_attempt, payload.executor_profile_id.clone())
        .await?;

    deployment
        .track_if_analytics_allowed(
            "task_attempt_started",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "executor": &payload.executor_profile_id.executor,
                "variant": &payload.executor_profile_id.variant,
                "attempt_id": task_attempt.id.to_string(),
            }),
        )
        .await;

    let task = Task::find_by_id(&deployment.db().pool, task.id)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    tracing::info!(
        "Started execution process {} with forge/ branch",
        execution_process.id
    );
    Ok(Json(ApiResponse::success(TaskWithAttemptStatus {
        task,
        has_in_progress_attempt: true,
        has_merged_attempt: false,
        last_attempt_failed: false,
        executor: task_attempt.executor,
    })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_forge_branch_prefix_format() {
        let attempt_id = Uuid::new_v4();
        let task_title = "test task";

        let task_title_id = git_branch_id(task_title);
        let short_id = short_uuid(&attempt_id);
        let branch_name = format!("forge/{}-{}", short_id, task_title_id);

        assert!(branch_name.starts_with("forge/"));
        assert!(branch_name.contains(&short_id));
        assert!(branch_name.contains(&task_title_id));
    }

    #[test]
    fn test_forge_branch_prefix_uniqueness() {
        let attempt_id_1 = Uuid::new_v4();
        let attempt_id_2 = Uuid::new_v4();
        let task_title = "test";

        let task_title_id = git_branch_id(task_title);
        let short_id_1 = short_uuid(&attempt_id_1);
        let short_id_2 = short_uuid(&attempt_id_2);

        let branch_1 = format!("forge/{}-{}", short_id_1, task_title_id);
        let branch_2 = format!("forge/{}-{}", short_id_2, task_title_id);

        assert_ne!(branch_1, branch_2);
        assert!(branch_1.starts_with("forge/"));
        assert!(branch_2.starts_with("forge/"));
    }

    #[test]
    fn test_forge_branch_format_matches_upstream() {
        let attempt_id = Uuid::new_v4();
        let task_title = "my-test-task";

        let task_title_id = git_branch_id(task_title);
        let short_id = short_uuid(&attempt_id);

        let forge_branch = format!("forge/{}-{}", short_id, task_title_id);
        let upstream_branch = format!("vk/{}-{}", short_id, task_title_id);

        assert_eq!(
            forge_branch.replace("forge/", ""),
            upstream_branch.replace("vk/", "")
        );
    }
}
