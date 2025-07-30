use std::{path::PathBuf, sync::Arc};

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utils::msg_store::MsgStore;

use crate::{
    actions::ExecutorAction,
    executors::{
        ExecutorError,
        standard::{StandardCodingAgentExecutor, StandardCodingAgentExecutors},
    },
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
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
