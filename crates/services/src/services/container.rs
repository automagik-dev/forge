use std::{collections::HashMap, sync::Arc};

use anyhow::{Error as AnyhowError, anyhow};
use async_trait::async_trait;
use axum::response::sse::Event;
use db::models::{execution_process::ExecutionProcess, task_attempt::TaskAttempt};
use executors::{actions::ExecutorActions, executors::ExecutorError};
use sqlx::Error as SqlxError;
use thiserror::Error;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::services::{event_store::EventStore, git::GitServiceError};
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
    fn event_stores(&self) -> &Arc<RwLock<HashMap<Uuid, Arc<EventStore>>>>;

    async fn create(&self, task_attempt: &TaskAttempt) -> Result<ContainerRef, ContainerError>;

    async fn start_execution(
        &self,
        task_attempt: &TaskAttempt,
        executor_action: &ExecutorActions,
    ) -> Result<ExecutionProcess, ContainerError>;

    /// Fetch the EventStore for a given execution ID, panicking if missing.
    async fn get_event_store_by_id(&self, uuid: &Uuid) -> Option<Arc<EventStore>> {
        let map = self.event_stores().read().await;
        map.get(uuid).cloned()
    }

    async fn stream_raw_logs(
        &self,
        id: &Uuid,
    ) -> Option<futures::stream::BoxStream<'static, Result<Event, std::io::Error>>> {
        match self.get_event_store_by_id(id).await {
            Some(event_store) => event_store.history_plus_stream().await,
            None => None,
        }
    }

    async fn stream_normalized_logs(
        &self,
        id: &Uuid,
    ) -> Option<futures::stream::BoxStream<'static, Result<Event, std::io::Error>>> {
        todo!()
        // self.execution_tracker.history_plus_stream(id).await
    }
}
