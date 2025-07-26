use std::path::PathBuf;

use super::ActionConfig;
use crate::executors::standard::StandardCodingAgentExecutor;

pub struct StandardFollowUpCodingAgentRequest {
    pub prompt: String,
    pub working_dir: PathBuf,
    pub session_id: String,
    pub executor: StandardCodingAgentExecutor,
}

impl ActionConfig for StandardFollowUpCodingAgentRequest {}
