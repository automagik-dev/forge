use db::models::task_attempt::TaskAttempt;
use services::services::container::{ContainerError, ContainerRef, ContainerService};
use utils::text::{git_branch_id, short_uuid};
use uuid::Uuid;

#[derive(Clone)]
pub struct LocalContainerService {}

impl LocalContainerService {
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
}

impl ContainerService for LocalContainerService {
    fn new() -> Self {
        LocalContainerService {}
    }

    /// Create a container
    /// In this case we use label to make a descriptive worktree directory
    fn create(
        &self,
        task_attempt: TaskAttempt,
        label: String,
    ) -> Result<ContainerRef, ContainerError> {
        let worktree_path = Self::get_worktree_base_dir().join(&label);
        let worktree_path_str = worktree_path.to_string_lossy().to_string();
        // let parent_task = task_attempt.parent_task(pool)

        // git_service.create_worktree(
        //     &task_attempt_branch,
        //     &worktree_path,
        //     data.base_branch.as_deref(),
        // )?;

        Ok("Ref".to_string())
    }
}
