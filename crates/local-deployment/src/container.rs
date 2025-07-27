use core::task;
use std::{collections::HashMap, path::PathBuf, process::ExitStatus, sync::Arc};

use anyhow::anyhow;
use async_trait::async_trait;
use command_group::AsyncGroupChild;
use db::{
    DBService,
    models::{
        execution_process::{CreateExecutionProcess, ExecutionProcess, ExecutionProcessType},
        task_attempt::TaskAttempt,
    },
};
use executors::actions::{ExecutorAction, ExecutorActions, script::ScriptContext};
use services::services::{
    container::{ContainerError, ContainerRef, ContainerService},
    git::GitService,
};
use tokio::sync::RwLock;
use utils::text::{git_branch_id, short_uuid};
use uuid::Uuid;

#[derive(Clone)]
pub struct LocalContainerService {
    db: DBService,
    git: GitService,
    running_executions: Arc<RwLock<HashMap<Uuid, AsyncGroupChild>>>,
}

impl LocalContainerService {
    pub fn new(db: DBService, git: GitService) -> Self {
        LocalContainerService {
            db,
            git,
            running_executions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_execution(&self, id: Uuid, exec: AsyncGroupChild) {
        let mut map = self.running_executions.write().await;
        map.insert(id, exec);
    }

    /// Returns `Some(true)` if the execution with the given `id` is still running,
    /// `Some(false)` if it’s known but already exited, or `None` if no such execution exists.
    pub async fn is_running(&self, id: &Uuid) -> Option<bool> {
        let map = self.running_executions.read().await;
        map.get(id).map(|child| child.id().is_some())
    }

    pub async fn remove_execution(&self, id: &Uuid) -> Option<AsyncGroupChild> {
        let mut map = self.running_executions.write().await;
        map.remove(id)
    }

    pub fn dir_name_from_task_attempt(attempt_id: &Uuid, task_title: &str) -> String {
        let task_title_id = git_branch_id(task_title);
        format!("vk-{}-{}", short_uuid(attempt_id), task_title_id)
    }

    /// Get the base directory for vibe-kanban worktrees
    pub fn get_worktree_base_dir() -> std::path::PathBuf {
        let dir_name = if cfg!(debug_assertions) {
            "vibe-kanban-dev"
        } else {
            "vibe-kanban"
        };

        if cfg!(target_os = "macos") {
            // macOS already uses /var/folders/... which is persistent storage
            std::env::temp_dir().join(dir_name)
        } else if cfg!(target_os = "linux") {
            // Linux: use /var/tmp instead of /tmp to avoid RAM usage
            std::path::PathBuf::from("/var/tmp").join(dir_name)
        } else {
            // Windows and other platforms: use temp dir with vibe-kanban subdirectory
            std::env::temp_dir().join(dir_name)
        }
    }

    pub fn create_execution_process_from_action(
        task_attempt: &TaskAttempt,
        executor_action: &ExecutorActions,
    ) -> CreateExecutionProcess {
        match executor_action {
            ExecutorActions::StandardCodingAgentRequest(standard_coding_agent_request) => {
                CreateExecutionProcess {
                    task_attempt_id: task_attempt.id,
                    process_type: ExecutionProcessType::CodingAgent,
                    // executor_type: Some(standard_coding_agent_request.executor.to_string()),
                    executor_type: None,
                }
            }
            ExecutorActions::StandardFollowUpCodingAgentRequest(
                standard_follow_up_coding_agent_request,
            ) => CreateExecutionProcess {
                task_attempt_id: task_attempt.id,
                process_type: ExecutionProcessType::CodingAgent,
                // executor_type: Some(standard_follow_up_coding_agent_request.executor.to_string()),
                executor_type: None,
            },
            ExecutorActions::ScriptRequest(script_request) => CreateExecutionProcess {
                task_attempt_id: task_attempt.id,
                process_type: match script_request.context {
                    ScriptContext::SetupScript => ExecutionProcessType::SetupScript,
                    ScriptContext::CleanupScript => ExecutionProcessType::CleanupScript,
                    ScriptContext::DevServer => ExecutionProcessType::DevServer,
                },
                executor_type: None,
            },
        }
    }
}

#[async_trait]
impl ContainerService for LocalContainerService {
    /// Create a container
    async fn create(&self, task_attempt: &TaskAttempt) -> Result<ContainerRef, ContainerError> {
        let task = task_attempt
            .parent_task(&self.db.pool)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let task_branch_name =
            LocalContainerService::dir_name_from_task_attempt(&task_attempt.id, &task.title);
        let worktree_path = LocalContainerService::get_worktree_base_dir().join(&task_branch_name);

        let project = task
            .parent_project(&self.db.pool)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let _ = &self.git.create_worktree(
            &project.git_repo_path,
            &task_branch_name,
            &worktree_path,
            Some(&task_attempt.base_branch),
        )?;

        TaskAttempt::update_container_ref(
            &self.db.pool,
            task_attempt.id,
            &worktree_path.to_string_lossy(),
        )
        .await?;

        Ok(worktree_path.to_string_lossy().to_string())
    }

    async fn start_execution(
        &self,
        task_attempt: &TaskAttempt,
        executor_action: &ExecutorActions,
    ) -> Result<ExecutionProcess, ContainerError> {
        // Create execution process record
        let create_execution_process =
            Self::create_execution_process_from_action(&task_attempt, &executor_action);
        let execution_process =
            ExecutionProcess::create(&self.db.pool, &create_execution_process, Uuid::new_v4())
                .await?;
        let container_ref = task_attempt
            .container_ref
            .as_ref()
            .ok_or(ContainerError::Other(anyhow!(
                "Container ref not found for task"
            )))?;

        let current_dir = PathBuf::from(container_ref);

        let mut child: AsyncGroupChild = executor_action.spawn(&current_dir).await?;

        // Add the execution to the running processes
        // self.add_execution(execution_process.id, child).await;

        let stdout = child
            .inner()
            .stdout
            .take()
            .expect("Failed to take stdout from child process");

        return Err(ContainerError::Other(anyhow!(
            "The rest needs implementing"
        )));
    }
}
