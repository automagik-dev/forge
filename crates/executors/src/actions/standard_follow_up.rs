use async_trait::async_trait;
use command_group::AsyncGroupChild;

use crate::{
    actions::ExecutorAction,
    executors::{
        ExecutorError,
        standard::{StandardCodingAgentExecutor, StandardCodingAgentExecutors},
    },
};

pub struct StandardFollowUpCodingAgentRequest {
    pub prompt: String,
    pub session_id: String,
    pub executor: StandardCodingAgentExecutors,
}

#[async_trait]
impl ExecutorAction for StandardFollowUpCodingAgentRequest {
    async fn spawn(&self) -> Result<AsyncGroupChild, ExecutorError> {
        self.executor.spawn_follow_up().await
    }
}
