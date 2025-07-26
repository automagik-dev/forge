use std::sync::Arc;

use async_trait::async_trait;
use db::{
    DBService,
    models::{task::Task, task_attempt::TaskAttempt},
};
use deployment::{Deployment, DeploymentError};
use services::services::{
    analytics::{AnalyticsConfig, AnalyticsService, generate_user_id},
    config::Config,
    container::{ContainerRef, ContainerService},
    git::GitService,
    sentry::SentryService,
};
use tokio::sync::RwLock;
use utils::assets::config_path;

use crate::container::LocalContainerService;

pub mod container;

#[derive(Clone)]
pub struct LocalDeployment {
    config: Arc<RwLock<Config>>,
    sentry: SentryService,
    user_id: String,
    db: DBService,
    analytics: Option<AnalyticsService>,
    container: LocalContainerService,
    git: GitService,
}

#[async_trait]
impl Deployment for LocalDeployment {
    async fn new() -> Result<Self, DeploymentError> {
        let config = Arc::new(RwLock::new(Config::load(&config_path())?));
        let sentry = SentryService::new();
        let user_id = generate_user_id();
        let db = DBService::new().await?;
        let analytics = AnalyticsConfig::new().map(AnalyticsService::new);
        let container = LocalContainerService::new();
        let git = GitService::new();

        Ok(Self {
            config,
            sentry,
            user_id,
            db,
            analytics,
            container,
            git,
        })
    }

    fn user_id(&self) -> &str {
        &self.user_id
    }

    fn shared_types() -> Vec<String> {
        vec![]
    }

    fn config(&self) -> &Arc<RwLock<Config>> {
        &self.config
    }

    fn sentry(&self) -> &SentryService {
        &self.sentry
    }

    fn db(&self) -> &DBService {
        &self.db
    }

    fn analytics(&self) -> &Option<AnalyticsService> {
        &self.analytics
    }

    fn container(&self) -> &impl ContainerService {
        &self.container
    }

    fn git(&self) -> &GitService {
        &self.git
    }

    async fn launch_attempt(
        &self,
        task_attempt: &TaskAttempt,
    ) -> Result<ContainerRef, DeploymentError> {
        let task = task_attempt
            .parent_task(&self.db().pool)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let task_branch_name =
            LocalContainerService::dir_name_from_task_attempt(&task_attempt.id, &task.title);
        let worktree_path = LocalContainerService::get_worktree_base_dir().join(&task_branch_name);

        let project = task
            .parent_project(&self.db().pool)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let _ = &self.git.create_worktree(
            &project.git_repo_path,
            &task_branch_name,
            &worktree_path,
            Some(&task_attempt.base_branch),
        )?;

        TaskAttempt::update_container_ref(
            &self.db().pool,
            task_attempt.id,
            &worktree_path.to_string_lossy(),
        )
        .await?;

        Ok("Ref".to_string())
    }
}
