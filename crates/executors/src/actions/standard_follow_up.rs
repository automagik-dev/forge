use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use serde::Serialize;

use crate::{
    actions::ExecutorAction,
    executors::{
        ExecutorError,
        standard::{StandardCodingAgentExecutor, StandardCodingAgentExecutors},
    },
};

#[derive(Serialize)]
pub struct StandardFollowUpCodingAgentRequest {
    pub prompt: String,
    pub session_id: String,
    pub executor: StandardCodingAgentExecutors,
}

#[async_trait]
impl ExecutorAction for StandardFollowUpCodingAgentRequest {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError> {
        self.executor
            .spawn_follow_up(current_dir, &self.prompt, &self.session_id)
            .await
    }
}
