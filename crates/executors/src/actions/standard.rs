use std::path::PathBuf;

use super::ActionConfig;
use crate::executors::standard::StandardCodingAgentExecutor;

pub struct StandardCodingAgentRequest {
    pub prompt: String,
    pub executor: StandardCodingAgentExecutor,
}

impl StandardCodingAgentRequest {}

impl ActionConfig for StandardCodingAgentRequest {}
