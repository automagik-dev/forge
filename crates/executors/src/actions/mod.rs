use async_trait::async_trait;
use command_group::AsyncGroupChild;

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

#[async_trait]
pub trait ExecutorAction {
    async fn spawn(&self) -> Result<AsyncGroupChild, ExecutorError>;
}

pub enum ExecutorActions {
    StandardCodingAgentRequest(StandardCodingAgentRequest),
    StandardFollowUpCodingAgentRequest(StandardFollowUpCodingAgentRequest),
    ScriptRequest(ScriptRequest),
}
