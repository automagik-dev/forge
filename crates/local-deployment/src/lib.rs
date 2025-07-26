use std::sync::Arc;

use async_trait::async_trait;
use deployment::{Deployment, DeploymentError};
use services::services::{analytics::generate_user_id, config::Config, sentry::SentryService};
use tokio::sync::RwLock;
use utils::assets::config_path;

#[derive(Clone)]
pub struct LocalDeployment {
    config: Arc<RwLock<Config>>,
    sentry: SentryService,
    user_id: String,
}

#[async_trait]
impl Deployment for LocalDeployment {
    fn new() -> Result<Self, DeploymentError> {
        let config = Arc::new(RwLock::new(Config::load(&config_path())?));
        let sentry = SentryService::new();
        let user_id = generate_user_id();
        Ok(Self {
            config,
            sentry,
            user_id,
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
}
