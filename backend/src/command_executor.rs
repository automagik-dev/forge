use axum::async_trait;
use tokio::io::AsyncRead;

use crate::command_runner::{CommandError, CommandRunner, CommandRunnerArgs};

pub mod cloud;
pub mod local;

// Core trait that defines the interface for command execution
#[async_trait]
pub trait CommandExecutor: Send + Sync {
    /// Start a process and return a handle to it
    async fn start(
        &self,
        request: &CommandRunnerArgs,
    ) -> Result<Box<dyn ProcessHandle>, CommandError>;

    async fn runner_start(
        &self,
        command_runner: &CommandRunner,
    ) -> Result<CommandProcess, CommandError> {
        let request = command_runner.to_args().ok_or(CommandError::NoCommandSet)?;
        let handle = self.start(&request).await?;

        Ok(CommandProcess { handle })
    }
}

pub struct CommandProcess {
    handle: Box<dyn ProcessHandle>,
}

impl std::fmt::Debug for CommandProcess {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("CommandProcess")
            .field("process_id", &self.handle.process_id())
            .finish()
    }
}

impl CommandProcess {
    #[allow(dead_code)]
    pub async fn status(&mut self) -> Result<Option<CommandExitStatus>, CommandError> {
        self.handle.status().await
    }

    pub async fn try_wait(&mut self) -> Result<Option<CommandExitStatus>, CommandError> {
        self.handle.try_wait().await
    }

    pub async fn kill(&mut self) -> Result<(), CommandError> {
        self.handle.kill().await
    }

    pub async fn stream(&mut self) -> Result<CommandStream, CommandError> {
        self.handle.stream().await
    }

    #[allow(dead_code)]
    pub async fn wait(&mut self) -> Result<CommandExitStatus, CommandError> {
        self.handle.wait().await
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandExitStatus {
    /// Exit code (0 for success on most platforms)
    code: Option<i32>,
    /// Whether the process exited successfully
    success: bool,
    /// Unix signal that terminated the process (Unix only)
    #[cfg(unix)]
    signal: Option<i32>,
    /// Optional remote process identifier for cloud execution
    remote_process_id: Option<String>,
    /// Optional session identifier for remote execution tracking
    remote_session_id: Option<String>,
}

impl CommandExitStatus {
    /// Returns true if the process exited successfully
    pub fn success(&self) -> bool {
        self.success
    }

    /// Returns the exit code of the process, if available
    pub fn code(&self) -> Option<i32> {
        self.code
    }
}

pub struct CommandStream {
    pub stdout: Option<Box<dyn AsyncRead + Unpin + Send>>,
    pub stderr: Option<Box<dyn AsyncRead + Unpin + Send>>,
}

// Trait for managing running processes
#[async_trait]
pub trait ProcessHandle: Send + Sync {
    /// Check if the process is still running, return exit status if finished
    async fn try_wait(&mut self) -> Result<Option<CommandExitStatus>, CommandError>;

    /// Wait for the process to complete and return exit status
    async fn wait(&mut self) -> Result<CommandExitStatus, CommandError>;

    /// Kill the process
    async fn kill(&mut self) -> Result<(), CommandError>;

    /// Get streams for stdout and stderr
    async fn stream(&mut self) -> Result<CommandStream, CommandError>;

    /// Get process identifier (for debugging/logging)
    fn process_id(&self) -> String;

    /// Check current status (alias for try_wait for backward compatibility)
    async fn status(&mut self) -> Result<Option<CommandExitStatus>, CommandError> {
        self.try_wait().await
    }
}
