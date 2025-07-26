use std::sync::Arc;

use async_trait::async_trait;
use db::DBProvider;
use deployment::{Deployment, DeploymentError};
use services::services::{
    analytics::{AnalyticsConfig, AnalyticsService, generate_user_id},
    config::Config,
    sentry::SentryService,
};
use tokio::sync::RwLock;
use utils::assets::config_path;

#[derive(Clone)]
pub struct LocalDeployment {
    config: Arc<RwLock<Config>>,
    sentry: SentryService,
    user_id: String,
    db: DBProvider,
    analytics: Option<AnalyticsService>,
}

#[async_trait]
impl Deployment for LocalDeployment {
    async fn new() -> Result<Self, DeploymentError> {
        let config = Arc::new(RwLock::new(Config::load(&config_path())?));
        let sentry = SentryService::new();
        let user_id = generate_user_id();
        let db = DBProvider::new().await?;
        let analytics = AnalyticsConfig::new().map(AnalyticsService::new);

        Ok(Self {
            config,
            sentry,
            user_id,
            db,
            analytics,
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

    fn db(&self) -> &DBProvider {
        &self.db
    }

    fn analytics(&self) -> &Option<AnalyticsService> {
        &self.analytics
    }
}
