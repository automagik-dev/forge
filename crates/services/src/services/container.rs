use anyhow::Error as AnyhowError;
use async_trait::async_trait;
use axum::response::sse::Event;
use db::models::{execution_process::ExecutionProcess, task_attempt::TaskAttempt};
use executors::{actions::ExecutorActions, executors::ExecutorError};
use sqlx::Error as SqlxError;
use thiserror::Error;
use uuid::Uuid;

use crate::services::git::GitServiceError;
pub type ContainerRef = String;

#[derive(Debug, Error)]
pub enum ContainerError {
    #[error(transparent)]
    GitServiceError(#[from] GitServiceError),
    #[error(transparent)]
    Sqlx(#[from] SqlxError),
    #[error(transparent)]
    ExecutorError(#[from] ExecutorError),
    #[error(transparent)]
    Other(#[from] AnyhowError), // Catches any unclassified errors
}

#[async_trait]
pub trait ContainerService {
    async fn create(&self, task_attempt: &TaskAttempt) -> Result<ContainerRef, ContainerError>;

    async fn start_execution(
        &self,
        task_attempt: &TaskAttempt,
        executor_action: &ExecutorActions,
    ) -> Result<ExecutionProcess, ContainerError>;

    async fn history_plus_live_stream(
        &self,
        id: &Uuid,
    ) -> Option<futures_util::stream::BoxStream<'static, Result<Event, std::io::Error>>>;
}
