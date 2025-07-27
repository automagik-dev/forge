use std::{collections::HashMap, path::PathBuf, sync::Arc, time::Duration};

use anyhow::anyhow;
use async_trait::async_trait;
use axum::response::sse::Event;
use command_group::AsyncGroupChild;
use db::{
    DBService,
    models::{
        execution_process::{CreateExecutionProcess, ExecutionProcess, ExecutionProcessType},
        task_attempt::TaskAttempt,
    },
};
use executors::actions::{ExecutorAction, ExecutorActions, script::ScriptContext};
use futures_util::StreamExt;
use services::services::{
    container::{ContainerError, ContainerRef, ContainerService},
    git::GitService,
};
use tokio::{sync::RwLock, time::sleep};
use tokio_stream::wrappers::BroadcastStream;
use utils::text::{git_branch_id, short_uuid};
use uuid::Uuid;

use crate::event_store::EventStore;

#[derive(Clone)]
pub struct LocalContainerService {
    db: DBService,
    git: GitService,
    running_executions: Arc<RwLock<HashMap<Uuid, (AsyncGroupChild, Arc<EventStore>)>>>,
}

impl LocalContainerService {
    pub fn new(db: DBService, git: GitService) -> Self {
        LocalContainerService {
            db,
            git,
            running_executions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_execution(&self, id: Uuid, exec: (AsyncGroupChild, Arc<EventStore>)) {
        let mut map = self.running_executions.write().await;
        map.insert(id, exec);
    }

    pub async fn remove_execution(&self, id: &Uuid) -> Option<(AsyncGroupChild, Arc<EventStore>)> {
        let mut map = self.running_executions.write().await;
        map.remove(id)
    }

    pub async fn get_event_store(&self, id: &Uuid) -> Option<Arc<EventStore>> {
        let map = self.running_executions.read().await;
        map.get(id).map(|(_, store)| store.clone())
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
        // 1) Record
        let create_execution_process =
            Self::create_execution_process_from_action(&task_attempt, &executor_action);
        let execution_process =
            ExecutionProcess::create(&self.db.pool, &create_execution_process, Uuid::new_v4())
                .await?;

        // 2) Workdir
        let container_ref = task_attempt
            .container_ref
            .as_ref()
            .ok_or(ContainerError::Other(anyhow!(
                "Container ref not found for task"
            )))?;
        let current_dir = PathBuf::from(container_ref);

        // 3) Spawn child + line stream
        let (child, mut stream) = executor_action.spawn_and_stream(&current_dir).await?;

        // 4) Create store & register execution
        let exec_id = execution_process.id;
        let store = Arc::new(EventStore::new());

        self.add_execution(execution_process.id, (child, store.clone()))
            .await;

        // 5) Forward stream lines -> store
        {
            let store = store.clone();
            tokio::spawn(async move {
                while let Some(next) = stream.next().await {
                    match next {
                        Ok(ev) => store.push(ev),
                        Err(e) => {
                            store.push(
                                Event::default()
                                    .event("stderr")
                                    .data(format!("stream error: {e}")),
                            );
                        }
                    }
                }
                store.push(Event::default().event("stream").data("closed"));
            });
        }

        // 6) Monitor process exit (non-blocking)
        {
            let svc = self.clone();
            let store = store.clone();
            tokio::spawn(async move {
                loop {
                    // Take a short write lock to call try_wait (needs &mut)
                    let status_opt = {
                        let mut map = svc.running_executions.write().await;
                        match map.get_mut(&exec_id) {
                            Some((child, _)) => match child.try_wait() {
                                Ok(Some(status)) => Some(Ok(status)),
                                Ok(None) => None,
                                Err(e) => Some(Err(e)),
                            },
                            None => break, // already removed
                        }
                    };

                    match status_opt {
                        Some(Ok(status)) => {
                            let code = status.code().unwrap_or_default();
                            store.push(Event::default().event("exit").data(format!("{code}")));
                            // Remove from map
                            let _ = svc.remove_execution(&exec_id).await;

                            // Optional: persist status if you have an API like:
                            // let _ = ExecutionProcess::mark_finished(&svc.db.pool, exec_id, status.success(), code).await;

                            break;
                        }
                        Some(Err(e)) => {
                            store.push(
                                Event::default()
                                    .event("stderr")
                                    .data(format!("wait error: {e}")),
                            );
                            let _ = svc.remove_execution(&exec_id).await;
                            break;
                        }
                        None => sleep(Duration::from_millis(250)).await, // still running
                    }
                }
            });
        }

        // 7) Return the record immediately; stream continues in background
        Ok(execution_process)
    }

    async fn history_plus_live_stream(
        &self,
        id: &Uuid,
    ) -> Option<futures_util::stream::BoxStream<'static, Result<Event, std::io::Error>>> {
        // grab Arc<EventStore> without holding the lock
        let store = {
            let map = self.running_executions.read().await;
            map.get(id).map(|(_, s)| s.clone())?
        };

        // history first
        let history = store.get_history();
        let history_stream =
            futures_util::stream::iter(history.into_iter().map(Ok::<_, std::io::Error>));

        // then live
        let rx = store.get_receiver(); // or store.subscribe()
        let live = BroadcastStream::new(rx).filter_map(|res| async move {
            match res {
                Ok(ev) => Some(Ok::<_, std::io::Error>(ev)),
                Err(_) => None, // drop lagged frames
            }
        });

        Some(Box::pin(history_stream.chain(live)))
    }
}
