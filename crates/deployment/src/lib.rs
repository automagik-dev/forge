use std::sync::Arc;

use ::services::services::{analytics::AnalyticsService, config::Config, sentry::SentryService};
use anyhow::Error as AnyhowError;
use async_trait::async_trait;
use db::DBService;
use serde_json::Value;
use services::services::container::ContainerService;
use sqlx::Error as SqlxError;
use thiserror::Error;
use tokio::sync::RwLock;

#[derive(Debug, Error)]
pub enum DeploymentError {
    #[error(transparent)]
    Sqlx(#[from] SqlxError),
    #[error(transparent)]
    Other(#[from] AnyhowError), // Catches any unclassified errors
}

#[async_trait]
pub trait Deployment: Clone + Send + Sync + 'static {
    async fn new() -> Result<Self, DeploymentError>;

    fn user_id(&self) -> &str;

    fn shared_types() -> Vec<String>;

    fn config(&self) -> &Arc<RwLock<Config>>;

    fn sentry(&self) -> &SentryService;

    fn db(&self) -> &DBService;

    fn analytics(&self) -> &Option<AnalyticsService>;

    fn container(&self) -> &impl ContainerService;

    async fn update_sentry_scope(&self) -> Result<(), DeploymentError> {
        let user_id = self.user_id();
        let config = self.config().read().await;
        let username = config.github.username.as_deref();
        let email = config.github.primary_email.as_deref();

        self.sentry()
            .update_scope(user_id, username.as_deref(), email.as_deref())
            .await;

        Ok(())
    }

    async fn track_if_analytics_allowed(&self, event_name: &str, properties: Value) {
        if let Some(true) = self.config().read().await.analytics_enabled {
            // Does the user allow analytics?
            if let Some(analytics) = self.analytics() {
                // Is analytics setup?
                analytics.track_event(self.user_id(), event_name, Some(properties.clone()));
            }
        }
    }
}
