use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;
use serde::Serialize;

use crate::executors::{ExecutorError, standard::amp::AmpExecutor};

pub mod amp;
pub mod gemini;

#[enum_dispatch]
#[derive(Serialize)]
pub enum StandardCodingAgentExecutors {
    AmpExecutor,
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
}
