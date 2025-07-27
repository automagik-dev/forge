use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use futures_io::Error as FuturesIoError;
use thiserror::Error;
use uuid::Uuid;

use crate::logs::NormalizedConversation;

pub mod standard;

#[derive(Debug, Error)]
pub enum ExecutorError {
    #[error("Follow-up is not supported")]
    FollowUpNotSupported,
    #[error(transparent)]
    SpawnError(#[from] FuturesIoError),
}

/// Trait for coding agents that can execute tasks, normalize logs, and support follow-up sessions
#[async_trait]
pub trait Executor: Send + Sync {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError>;
    async fn spawn_followup(
        &self,
        current_dir: &PathBuf,
    ) -> Result<AsyncGroupChild, ExecutorError> {
        Err(ExecutorError::FollowUpNotSupported)
    }
}
