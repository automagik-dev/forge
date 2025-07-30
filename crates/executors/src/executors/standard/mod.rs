use std::{path::PathBuf, str::FromStr, sync::Arc};

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;
use serde::Serialize;
use utils::msg_store::MsgStore;

use crate::executors::{
    ExecutorError,
    standard::{amp::AmpExecutor, gemini::GeminiExecutor},
};

pub mod amp;
pub mod gemini;

#[enum_dispatch]
#[derive(Serialize)]
pub enum StandardCodingAgentExecutors {
    AmpExecutor,
    GeminiExecutor,
}

#[async_trait]
#[enum_dispatch(StandardCodingAgentExecutors)]
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

impl FromStr for StandardCodingAgentExecutors {
    type Err = ExecutorError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "amp" => Ok(StandardCodingAgentExecutors::AmpExecutor(AmpExecutor {})),
            "gemini" => Ok(StandardCodingAgentExecutors::GeminiExecutor(
                GeminiExecutor {},
            )),
            _ => Err(ExecutorError::UnknownExecutorType(s.to_string())),
        }
    }
}
