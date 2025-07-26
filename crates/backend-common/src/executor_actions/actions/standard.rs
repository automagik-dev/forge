use std::path::PathBuf;

use super::ActionConfig;
use crate::executor_actions::executors::standard::StandardCodingAgentExecutor;

pub struct StandardCodingAgentRequest {
    pub prompt: String,
    pub working_dir: PathBuf,
    pub executor: StandardCodingAgentExecutor,
}

impl StandardCodingAgentRequest {}

impl ActionConfig for StandardCodingAgentRequest {}
