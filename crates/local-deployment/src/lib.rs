use std::{collections::HashMap, sync::Arc};

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use db::{DBService, models::task_attempt::TaskAttempt};
use deployment::{Deployment, DeploymentError};
use services::services::{
    analytics::{AnalyticsConfig, AnalyticsService, generate_user_id},
    config::Config,
    container::{ContainerRef, ContainerService},
    git::GitService,
    process_service::ProcessService,
    sentry::SentryService,
};
use tokio::sync::RwLock;
use utils::assets::config_path;
use uuid::Uuid;

use crate::container::LocalContainerService;

pub mod container;

#[derive(Debug)]
pub enum ExecutionType {
    SetupScript,
    CleanupScript,
    CodingAgent,
    DevServer,
}

#[derive(Debug)]
pub struct RunningExecution {
    pub task_attempt_id: Uuid,
    pub _execution_type: ExecutionType,
    // TODO: fix
    pub child: AsyncGroupChild,
}

#[derive(Clone)]
pub struct LocalDeployment {
    config: Arc<RwLock<Config>>,
    sentry: SentryService,
    user_id: String,
    db: DBService,
    analytics: Option<AnalyticsService>,
    container: LocalContainerService,
    git: GitService,
    running_executions: Arc<RwLock<HashMap<Uuid, RunningExecution>>>,
    process: ProcessService,
}

#[async_trait]
impl Deployment for LocalDeployment {
    async fn new() -> Result<Self, DeploymentError> {
        let config = Arc::new(RwLock::new(Config::load(&config_path())?));
        let sentry = SentryService::new();
        let user_id = generate_user_id();
        let db = DBService::new().await?;
        let analytics = AnalyticsConfig::new().map(AnalyticsService::new);
        let git = GitService::new();
        let container = LocalContainerService::new(db.clone(), git.clone());
        let running_executions = Arc::new(RwLock::new(HashMap::new()));
        let process = ProcessService::new();

        Ok(Self {
            config,
            sentry,
            user_id,
            db,
            analytics,
            container,
            git,
            running_executions,
            process,
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
}
