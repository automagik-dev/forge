use async_trait::async_trait;
use command_group::AsyncGroupChild;

use crate::{actions::ExecutorAction, executors::ExecutorError};

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

#[async_trait]
impl ExecutorAction for ScriptRequest {
    async fn spawn(&self) -> Result<AsyncGroupChild, ExecutorError> {
        todo!()
    }
}
