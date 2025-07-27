use async_trait::async_trait;
use command_group::AsyncGroupChild;
use thiserror::Error;
use uuid::Uuid;

use crate::logs::NormalizedConversation;

pub mod standard;

#[derive(Debug, Error)]
pub enum ExecutorError {
    #[error("Follow-up is not supported")]
    FollowUpNotSupported,
}

/// Trait for coding agents that can execute tasks, normalize logs, and support follow-up sessions
#[async_trait]
pub trait Executor: Send + Sync {
    /// Spawn the command for a given task attempt
    async fn spawn() -> Result<AsyncGroupChild, ExecutorError>;

    /// Spawn a follow-up session for executors that support it
    ///
    /// This method is used to continue an existing session with a new prompt.
    /// Not all executors support follow-up sessions, so the default implementation
    /// returns an error.
    async fn spawn_followup() -> Result<AsyncGroupChild, ExecutorError> {
        Err(ExecutorError::FollowUpNotSupported)
    }
}
