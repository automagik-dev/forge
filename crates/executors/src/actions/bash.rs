use std::path::PathBuf;

use crate::executors::actions::ActionConfig;

pub struct StandardCodingAgentRequest {
    prompt: String,
    working_dir: PathBuf,
}

impl ActionConfig for StandardCodingAgentRequest {}
