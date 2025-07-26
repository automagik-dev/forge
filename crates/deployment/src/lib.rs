use std::sync::Arc;

use anyhow::Error as AnyhowError;
use async_trait::async_trait;
use services::services::{config::Config, sentry::SentryService};
use thiserror::Error;
use tokio::sync::RwLock;

#[derive(Debug, Error)]
pub enum DeploymentError {
    #[error(transparent)]
    Other(#[from] AnyhowError), // Catches any unclassified errors
}

#[async_trait]
pub trait Deployment: Clone + Send + Sync + 'static {
    fn new() -> Result<Self, DeploymentError>;

    fn user_id(&self) -> &str;

    fn shared_types() -> Vec<String>;

    fn config(&self) -> &Arc<RwLock<Config>>;

    fn sentry(&self) -> &SentryService;
}
