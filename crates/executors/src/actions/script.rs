use crate::actions::ExecutorAction;

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

// impl ExecutorAction for ScriptRequest {}
