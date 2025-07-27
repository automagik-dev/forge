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
    async fn spawn(&self) -> Result<AsyncGroupChild, ExecutorError> {
        self.executor.spawn().await
    }
}
