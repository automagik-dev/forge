use std::sync::Arc;

use anyhow::Error as AnyhowError;
use async_trait::async_trait;
use db::DBProvider;
use services::services::{config::Config, sentry::SentryService};
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

    fn db(&self) -> &DBProvider;

    async fn update_sentry_scope(&self) -> Result<(), DeploymentError> {
        let user_id = self.user_id();
        let username = self.config().read().await.github.username.clone();
        let email = self.config().read().await.github.primary_email.clone();

        self.sentry()
            .update_scope(user_id, username.as_deref(), email.as_deref())
            .await;

        Ok(())
    }
}
