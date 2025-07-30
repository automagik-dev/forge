use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    actions::{
        script::ScriptRequest, standard::StandardCodingAgentRequest,
        standard_follow_up::StandardFollowUpCodingAgentRequest,
    },
    executors::ExecutorError,
};
pub mod script;
pub mod standard;
pub mod standard_follow_up;

#[enum_dispatch]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[serde(tag = "type")]
#[ts(export)]
pub enum ExecutorActions {
    StandardCodingAgentRequest,
    StandardFollowUpCodingAgentRequest,
    ScriptRequest,
}

#[async_trait]
#[enum_dispatch(ExecutorActions)]
pub trait ExecutorAction {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError>;
}
