use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;

use crate::{
    actions::ExecutorAction,
    executors::{
        ExecutorError,
        standard::{StandardCodingAgentExecutor, StandardCodingAgentExecutors},
    },
};

pub struct StandardCodingAgentRequest {
    pub prompt: String,
    pub executor: StandardCodingAgentExecutors,
}

#[async_trait]
impl ExecutorAction for StandardCodingAgentRequest {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError> {
        self.executor.spawn(current_dir, &self.prompt).await
    }
}
