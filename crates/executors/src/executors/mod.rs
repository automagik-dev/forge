use std::{path::PathBuf, str::FromStr, sync::Arc};

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;
use futures_io::Error as FuturesIoError;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use ts_rs::TS;
use utils::msg_store::MsgStore;

use crate::executors::{amp::AmpExecutor, gemini::GeminiExecutor};

pub mod amp;
pub mod gemini;

#[derive(Debug, Error)]
pub enum ExecutorError {
    #[error("Follow-up is not supported")]
    FollowUpNotSupported,
    #[error(transparent)]
    SpawnError(#[from] FuturesIoError),
    #[error("Unknown executor type: {0}")]
    UnknownExecutorType(String),
}

#[enum_dispatch]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
pub enum CodingAgentExecutors {
    AmpExecutor,
    GeminiExecutor,
}

#[async_trait]
#[enum_dispatch(CodingAgentExecutors)]
pub trait StandardCodingAgentExecutor {
    async fn spawn(
        &self,
        current_dir: &PathBuf,
        prompt: &str,
    ) -> Result<AsyncGroupChild, ExecutorError>;
    async fn spawn_follow_up(
        &self,
        current_dir: &PathBuf,
        prompt: &str,
        session_id: &str,
    ) -> Result<AsyncGroupChild, ExecutorError>;
    fn normalize_logs(&self, _raw_logs_event_store: Arc<MsgStore>, _worktree_path: &PathBuf);
}

impl FromStr for CodingAgentExecutors {
    type Err = ExecutorError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "amp" => Ok(CodingAgentExecutors::AmpExecutor(AmpExecutor {})),
            "gemini" => Ok(CodingAgentExecutors::GeminiExecutor(GeminiExecutor {})),
            _ => Err(ExecutorError::UnknownExecutorType(s.to_string())),
        }
    }
}
