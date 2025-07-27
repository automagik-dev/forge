use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;

use crate::executors::{ExecutorError, standard::amp::AmpExecutor};

pub mod amp;

#[enum_dispatch]
pub enum StandardCodingAgentExecutors {
    AmpExecutor,
}

#[async_trait]
#[enum_dispatch(StandardCodingAgentExecutors)]
pub trait StandardCodingAgentExecutor {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError>;
    async fn spawn_follow_up(
        &self,
        current_dir: &PathBuf,
    ) -> Result<AsyncGroupChild, ExecutorError>;
}
