//! Task attempt routes for Forge
//!
//! Handles task attempt creation, follow-up, and related operations with forge-specific extensions.

use axum::{
    Json, Router,
    extract::State,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::state::ForgeAppState;
use crate::services::ForgeServices;
use db::models::{
    task::Task,
    task_attempt::{CreateTaskAttempt, TaskAttempt},
};
use deployment::Deployment;
use executors::profile::ExecutorProfileId;
use server::{DeploymentImpl, error::ApiError, routes::task_attempts};
use services::services::container::ContainerService;
use sqlx::Error as SqlxError;
use utils::response::ApiResponse;
use utils::text::{git_branch_id, short_uuid};

/// Forge-specific CreateTaskAttemptBody that includes use_worktree field
#[derive(Debug, Serialize, Deserialize)]
pub struct ForgeCreateTaskAttemptBody {
    pub task_id: Uuid,
    pub executor_profile_id: ExecutorProfileId,
    pub base_branch: String,
    #[serde(default = "default_use_worktree")]
    pub use_worktree: bool,
}

fn default_use_worktree() -> bool {
    true
}

impl ForgeCreateTaskAttemptBody {
    pub fn get_executor_profile_id(&self) -> ExecutorProfileId {
        self.executor_profile_id.clone()
    }
}

/// Build task_attempts router with forge override for create endpoint
pub fn build_task_attempts_router_with_forge_override(
    deployment: &DeploymentImpl,
) -> Router<ForgeAppState> {
    use axum::middleware::from_fn_with_state;
    use server::middleware::load_task_attempt_middleware;

    let task_attempt_id_router = Router::new()
        .route("/", get(task_attempts::get_task_attempt))
        .route("/follow-up", post(forge_follow_up))
        .route(
            "/draft",
            get(task_attempts::drafts::get_draft)
                .put(task_attempts::drafts::save_draft)
                .delete(task_attempts::drafts::delete_draft),
        )
        .route("/draft/queue", post(task_attempts::drafts::set_draft_queue))
        .route("/replace-process", post(task_attempts::replace_process))
        .route("/commit-info", get(task_attempts::get_commit_info))
        .route(
            "/commit-compare",
            get(task_attempts::compare_commit_to_head),
        )
        .route("/start-dev-server", post(task_attempts::start_dev_server))
        .route(
            "/branch-status",
            get(task_attempts::get_task_attempt_branch_status),
        )
        .route("/diff/ws", get(task_attempts::stream_task_attempt_diff_ws))
        .route("/merge", post(task_attempts::merge_task_attempt))
        .route("/push", post(task_attempts::push_task_attempt_branch))
        .route("/rebase", post(task_attempts::rebase_task_attempt))
        .route(
            "/conflicts/abort",
            post(task_attempts::abort_conflicts_task_attempt),
        )
        .route("/pr", post(task_attempts::create_github_pr))
        .route("/pr/attach", post(task_attempts::attach_existing_pr))
        .route(
            "/open-editor",
            post(task_attempts::open_task_attempt_in_editor),
        )
        .route(
            "/delete-file",
            post(task_attempts::delete_task_attempt_file),
        )
        .route("/children", get(task_attempts::get_task_attempt_children))
        .route("/stop", post(task_attempts::stop_task_attempt_execution))
        .route(
            "/change-target-branch",
            post(task_attempts::change_target_branch),
        )
        .layer(from_fn_with_state(
            deployment.clone(),
            load_task_attempt_middleware,
        ));

    let task_attempts_router = Router::new()
        .route(
            "/",
            get(task_attempts::get_task_attempts).post(forge_create_task_attempt),
        )
        .nest("/{id}", task_attempt_id_router);

    Router::new().nest("/task-attempts", task_attempts_router)
}

/// Forge override: create task attempt with forge/ branch prefix
pub async fn forge_create_task_attempt(
    State(deployment): State<DeploymentImpl>,
    State(forge_services): State<ForgeServices>,
    Json(payload): Json<ForgeCreateTaskAttemptBody>,
) -> Result<Json<ApiResponse<TaskAttempt>>, ApiError> {
    let executor_profile_id = payload.get_executor_profile_id();
    let task = Task::find_by_id(&deployment.db().pool, payload.task_id)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

    let attempt_id = Uuid::new_v4();

    let git_branch_name = if payload.use_worktree {
        let task_title_id = git_branch_id(&task.title);
        let short_id = short_uuid(&attempt_id);
        format!("forge/{}-{}", short_id, task_title_id)
    } else {
        payload.base_branch.clone()
    };

    let mut task_attempt = TaskAttempt::create(
        &deployment.db().pool,
        &CreateTaskAttempt {
            executor: executor_profile_id.executor,
            base_branch: payload.base_branch.clone(),
            branch: git_branch_name.clone(),
        },
        attempt_id,
        payload.task_id,
    )
    .await?;

    sqlx::query(
        "INSERT INTO forge_task_attempt_config (task_attempt_id, use_worktree) VALUES (?, ?)"
    )
    .bind(attempt_id)
    .bind(payload.use_worktree)
    .execute(&deployment.db().pool)
    .await?;

    if let Some(variant) = &executor_profile_id.variant {
        let executor_with_variant = format!("{}:{}", executor_profile_id.executor, variant);
        sqlx::query(
            "UPDATE task_attempts SET executor = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .bind(&executor_with_variant)
        .bind(attempt_id)
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

    let _execution_process = deployment
        .container()
        .start_attempt(&task_attempt, executor_profile_id.clone())
        .await?;

    deployment
        .track_if_analytics_allowed(
            "task_attempt_started",
            serde_json::json!({
                "task_id": task.id.to_string(),
                "executor": &executor_profile_id.executor,
                "attempt_id": task_attempt.id.to_string(),
            }),
        )
        .await;

    Ok(Json(ApiResponse::success(task_attempt)))
}

/// Forge override: inject workspace profiles before follow-up
pub async fn forge_follow_up(
    axum::Extension(task_attempt): axum::Extension<TaskAttempt>,
    State(deployment): State<DeploymentImpl>,
    State(forge_services): State<ForgeServices>,
    Json(payload): Json<serde_json::Value>,
) -> Result<Json<ApiResponse<db::models::execution_process::ExecutionProcess>>, ApiError> {
    let task = task_attempt
        .parent_task(&deployment.db().pool)
        .await?
        .ok_or(ApiError::Database(SqlxError::RowNotFound))?;

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
            "Injected {} .genie profile variant(s) for workspace: {} (follow-up) | Profiles: [{}]",
            variant_count,
            project.git_repo_path.display(),
            variant_list.join(", ")
        );

        executors::profile::ExecutorConfigs::set_cached(workspace_profiles);
    } else {
        tracing::warn!(
            "Failed to load .genie profiles for workspace: {} (follow-up), using defaults",
            project.git_repo_path.display()
        );
    }

    let typed_payload: task_attempts::CreateFollowUpAttempt = serde_json::from_value(payload)
        .map_err(|e| ApiError::TaskAttempt(db::models::task_attempt::TaskAttemptError::ValidationError(
            format!("Invalid follow-up payload: {}", e)
        )))?;

    task_attempts::follow_up(axum::Extension(task_attempt), State(deployment), Json(typed_payload)).await
}
