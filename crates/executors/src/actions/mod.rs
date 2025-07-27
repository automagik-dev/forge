use crate::actions::{
    script::ScriptRequest, standard::StandardCodingAgentRequest,
    standard_follow_up::StandardFollowUpCodingAgentRequest,
};

pub mod script;
pub mod standard;
pub mod standard_follow_up;

pub trait ActionConfig {}

pub enum ExecutorActions {
    StandardCodingAgentRequest(StandardCodingAgentRequest),
    StandardFollowUpCodingAgentRequest(StandardFollowUpCodingAgentRequest),
    ScriptRequest(ScriptRequest),
}
