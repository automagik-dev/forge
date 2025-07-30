use std::path::PathBuf;

use async_trait::async_trait;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumDiscriminants};
use ts_rs::TS;

use crate::{
    actions::{
        coding_agent_follow_up::CodingAgentFollowUpRequest,
        coding_agent_initial::CodingAgentInitialRequest, script::ScriptRequest,
    },
    executors::ExecutorError,
};
pub mod coding_agent_follow_up;
pub mod coding_agent_initial;
pub mod script;

#[enum_dispatch]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS, EnumDiscriminants, Display)]
#[serde(tag = "type")]
#[ts(export)]
#[strum_discriminants(name(ExecutorActionKind), derive(Display))]
pub enum ExecutorActions {
    CodingAgentInitialRequest,
    CodingAgentFollowUpRequest,
    ScriptRequest,
}

impl ExecutorActions {
    /// Get the action type as a string (matches the JSON "type" field)
    pub fn action_type(&self) -> &'static str {
        match self {
            ExecutorActions::CodingAgentInitialRequest(_) => "CodingAgentInitialRequest",
            ExecutorActions::CodingAgentFollowUpRequest(_) => "CodingAgentFollowUpRequest",
            ExecutorActions::ScriptRequest(_) => "ScriptRequest",
        }
    }
}

#[async_trait]
#[enum_dispatch(ExecutorActions)]
pub trait ExecutorAction {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError>;
}
