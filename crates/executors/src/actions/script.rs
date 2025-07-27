use std::path::PathBuf;

use crate::actions::ActionConfig;

pub enum ScriptRequestLanguage {
    Bash,
}

pub enum ScriptContext {
    SetupScript,
    CleanupScript,
    DevServer,
}

pub struct ScriptRequest {
    pub script: String,
    pub language: ScriptRequestLanguage,
    pub context: ScriptContext,
}

impl ActionConfig for ScriptRequest {}
