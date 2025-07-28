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
use futures::{TryStreamExt, stream::select};
use services::services::{
    container::{ContainerError, ContainerRef, ContainerService},
    event_store::EventStore,
    git::GitService,
};
use tokio::{sync::RwLock, task::JoinHandle};
use tokio_util::io::ReaderStream;
use utils::text::{git_branch_id, short_uuid};
use uuid::Uuid;

#[derive(Clone)]
pub struct LocalContainerService {
    db: DBService,
    git: GitService,
    child_store: Arc<RwLock<HashMap<Uuid, Arc<RwLock<AsyncGroupChild>>>>>,
    event_stores: Arc<RwLock<HashMap<Uuid, Arc<EventStore>>>>,
}

impl LocalContainerService {
    pub fn new(
        db: DBService,
        git: GitService,
        event_stores: Arc<RwLock<HashMap<Uuid, Arc<EventStore>>>>,
    ) -> Self {
        let child_store = Arc::new(RwLock::new(HashMap::new()));

        LocalContainerService {
            db,
            git,
            child_store,
            event_stores,
        }
    }

    pub async fn add_child_to_store(&self, id: Uuid, exec: AsyncGroupChild) {
        let mut map = self.child_store.write().await;
        map.insert(id, Arc::new(RwLock::new(exec)));
    }

    pub async fn remove_child_from_store(&self, id: &Uuid) {
        let mut map = self.child_store.write().await;
        map.remove(id);
    }

    pub async fn track_child_events_in_store(&self, id: Uuid, child: &mut AsyncGroupChild) {
        let store = Arc::new(EventStore::new());

        let out = child.inner().stdout.take().expect("no stdout");
        let err = child.inner().stderr.take().expect("no stderr");

        let out = ReaderStream::new(out).map_ok(|chunk| {
            let text = String::from_utf8_lossy(&chunk).to_string();
            let ev = Event::default().event("stdout").data(text);
            (ev, chunk.len())
        });

        let err = ReaderStream::new(err).map_ok(|chunk| {
            let text = String::from_utf8_lossy(&chunk).to_string();
            let ev = Event::default().event("stderr").data(text);
            (ev, chunk.len())
        });

        // Merge and forward into byte‑budgeted history
        let merged = select(out, err);
        store.clone().spawn_forwarder(merged);

        let mut map = self.event_stores.write().await;
        map.insert(id, store);
    }

    // / Spawn a background task that polls the child process for completion and
    // / cleans up the execution entry when it exits.
    pub fn spawn_exit_monitor(
        &self,
        exec_id: Uuid,
        child_store: Arc<RwLock<HashMap<Uuid, Arc<RwLock<AsyncGroupChild>>>>>,
        event_stores: Arc<RwLock<HashMap<Uuid, Arc<EventStore>>>>,
    ) -> JoinHandle<()> {
        let child_store = child_store.clone();
        let event_stores = event_stores.clone();
        tokio::spawn(async move {
            loop {
                // Keep the lock only while calling try_wait (needs &mut)
                let status_opt = {
                    let map = child_store.read().await;
                    match map.get(&exec_id) {
                        Some(child) => match child.clone().write().await.try_wait() {
                            Ok(Some(status)) => Some(Ok(status)),
                            Ok(None) => None,
                            Err(e) => Some(Err(e)),
                        },
                        None => break, // already removed elsewhere
                    }
                };

                let mut map = event_stores.write().await;
                match map.get_mut(&exec_id) {
                    Some(event_store) => match status_opt {
                        Some(Ok(status)) => {
                            let code = status.code().unwrap_or_default();
                            event_store.push_exit(code);
                            // TODO: remove execution from event and child store when it's finished
                            // let _ = event_store.remove_execution(&exec_id).await;

                            // Optional: persist completion here if desired
                            // e.g. ExecutionProcess::mark_finished(...).await?;

                            break;
                        }
                        Some(Err(e)) => {
                            event_store.push_stderr(format!("wait error: {e}"));
                            // let _ = svc.remove_execution(&exec_id).await;
                            break;
                        }
                        None => tokio::time::sleep(Duration::from_millis(250)).await,
                    },
                    None => break,
                }
            }
        })
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
    fn event_stores(&self) -> &Arc<RwLock<HashMap<Uuid, Arc<EventStore>>>> {
        &self.event_stores
    }
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
        // Create new execution process record
        let create_execution_process =
            Self::create_execution_process_from_action(&task_attempt, &executor_action);
        let execution_process =
            ExecutionProcess::create(&self.db.pool, &create_execution_process, Uuid::new_v4())
                .await?;

        // Get the worktree path
        let container_ref = task_attempt
            .container_ref
            .as_ref()
            .ok_or(ContainerError::Other(anyhow!(
                "Container ref not found for task attempt"
            )))?;
        let current_dir = PathBuf::from(container_ref);

        // Create the child and stream, add to execution tracker
        let mut child = executor_action.spawn(&current_dir).await?;
        self.track_child_events_in_store(execution_process.id, &mut child)
            .await;
        self.add_child_to_store(execution_process.id, child).await;

        Ok(execution_process)
    }
}
