use std::{path::PathBuf, process::Stdio};

use async_trait::async_trait;
use command_group::{AsyncCommandGroup, AsyncGroupChild};
use tokio::{io::AsyncWriteExt, process::Command};
use utils::shell::get_shell_command;

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
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError> {
        let (shell_cmd, shell_arg) = get_shell_command();
        let mut command = Command::new(shell_cmd);
        command
            .kill_on_drop(true)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .arg(shell_arg)
            .arg(&self.script)
            .current_dir(current_dir);

        let child = command.group_spawn()?;

        Ok(child)
    }
}
