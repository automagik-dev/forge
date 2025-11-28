//! Agent routes for Forge
//!
//! Handles forge agents, neurons, and related endpoints.

use axum::{
    Json,
    extract::{Path, Query, State},
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use db::models::{
    task::Task,
    task_attempt::TaskAttempt,
};
use deployment::Deployment;
use server::{DeploymentImpl, error::ApiError};
use utils::response::ApiResponse;

/// Forge Agent model
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ForgeAgent {
    pub id: Uuid,
    pub project_id: Uuid,
    pub agent_type: String,
    pub task_id: Uuid,
    pub created_at: String,
    pub updated_at: String,
}

/// Neuron type definitions
#[derive(Debug, Serialize)]
pub struct Neuron {
    #[serde(rename = "type")]
    pub neuron_type: String,
    pub task: Task,
    pub attempt: TaskAttempt,
}

#[derive(Debug, Deserialize)]
pub struct GetForgeAgentsParams {
    pub project_id: Uuid,
    pub agent_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateForgeAgentBody {
    pub project_id: Uuid,
    pub agent_type: String,
}

/// Get forge agents for a project
pub async fn get_forge_agents(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<GetForgeAgentsParams>,
) -> Result<Json<ApiResponse<Vec<ForgeAgent>>>, ApiError> {
    let pool = &deployment.db().pool;

    let agents = if let Some(agent_type) = params.agent_type {
        sqlx::query_as::<_, ForgeAgent>(
            "SELECT * FROM forge_agents WHERE project_id = ? AND agent_type = ?",
        )
        .bind(params.project_id)
        .bind(agent_type)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, ForgeAgent>("SELECT * FROM forge_agents WHERE project_id = ?")
            .bind(params.project_id)
            .fetch_all(pool)
            .await?
    };

    Ok(Json(ApiResponse::success(agents)))
}

/// Create a forge agent (and its fixed task)
pub async fn create_forge_agent(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<CreateForgeAgentBody>,
) -> Result<Json<ApiResponse<ForgeAgent>>, ApiError> {
    let pool = &deployment.db().pool;
    let agent_id = Uuid::new_v4();
    let task_id = Uuid::new_v4();

    let title = "Genie".to_string();

    sqlx::query(
        r#"INSERT INTO tasks (id, project_id, title, description, status, created_at, updated_at)
           VALUES (?, ?, ?, NULL, 'agent', datetime('now'), datetime('now'))"#,
    )
    .bind(task_id)
    .bind(payload.project_id)
    .bind(&title)
    .execute(pool)
    .await?;

    sqlx::query(
        r#"INSERT INTO forge_agents (id, project_id, agent_type, task_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"#,
    )
    .bind(agent_id)
    .bind(payload.project_id)
    .bind(&payload.agent_type)
    .bind(task_id)
    .execute(pool)
    .await?;

    let agent: ForgeAgent = sqlx::query_as("SELECT * FROM forge_agents WHERE id = ?")
        .bind(agent_id)
        .fetch_one(pool)
        .await?;

    Ok(Json(ApiResponse::success(agent)))
}

/// Get neurons for a Master Genie task attempt
pub async fn get_master_genie_neurons(
    State(deployment): State<DeploymentImpl>,
    Path(attempt_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<Neuron>>>, ApiError> {
    let pool = &deployment.db().pool;

    let neuron_tasks: Vec<Task> = sqlx::query_as::<_, Task>(
        r#"SELECT * FROM tasks
           WHERE parent_task_attempt = ? AND status = 'agent'
           ORDER BY created_at ASC"#,
    )
    .bind(attempt_id)
    .fetch_all(pool)
    .await?;

    let mut neurons = Vec::new();

    for task in neuron_tasks {
        if let Ok(attempts) = TaskAttempt::fetch_all(pool, Some(task.id)).await {
            if let Some(attempt) = attempts.into_iter().next() {
                let neuron_type = if let Some((_base, variant)) = attempt.executor.split_once(':') {
                    variant.to_string()
                } else {
                    "unknown".to_string()
                };

                neurons.push(Neuron {
                    neuron_type,
                    task,
                    attempt,
                });
            }
        }
    }

    Ok(Json(ApiResponse::success(neurons)))
}

/// Get subtasks for a neuron
pub async fn get_neuron_subtasks(
    State(deployment): State<DeploymentImpl>,
    Path(neuron_attempt_id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<Task>>>, ApiError> {
    let pool = &deployment.db().pool;

    let subtasks: Vec<Task> = sqlx::query_as::<_, Task>(
        r#"SELECT * FROM tasks
           WHERE parent_task_attempt = ? AND status = 'agent'
           ORDER BY created_at DESC"#,
    )
    .bind(neuron_attempt_id)
    .fetch_all(pool)
    .await?;

    Ok(Json(ApiResponse::success(subtasks)))
}
