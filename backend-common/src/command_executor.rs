use axum::async_trait;
use tokio::io::AsyncRead;

use crate::command_runner::{CommandError, CommandRunner, CommandRunnerArgs};

// pub mod cloud;
// pub mod local;

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

// Local-specific implementations for shared types
impl CommandExitStatus {
    /// Create a CommandExitStatus from a std::process::ExitStatus (for local processes)
    pub fn from_local(status: std::process::ExitStatus) -> Self {
        Self {
            code: status.code(),
            success: status.success(),
            #[cfg(unix)]
            signal: {
                use std::os::unix::process::ExitStatusExt;
                status.signal()
            },
            remote_process_id: None,
            remote_session_id: None,
        }
    }
}

impl CommandStream {
    /// Create a CommandStream from local process streams
    pub fn from_local(
        stdout: Option<tokio::process::ChildStdout>,
        stderr: Option<tokio::process::ChildStderr>,
    ) -> Self {
        Self {
            stdout: stdout.map(|s| Box::new(s) as Box<dyn tokio::io::AsyncRead + Unpin + Send>),
            stderr: stderr.map(|s| Box::new(s) as Box<dyn tokio::io::AsyncRead + Unpin + Send>),
        }
    }
}

// Remote-specific implementations for shared types
impl CommandExitStatus {
    /// Create a CommandExitStatus for remote processes
    pub fn from_remote(
        code: Option<i32>,
        success: bool,
        remote_process_id: Option<String>,
        remote_session_id: Option<String>,
    ) -> Self {
        Self {
            code,
            success,
            #[cfg(unix)]
            signal: None,
            remote_process_id,
            remote_session_id,
        }
    }
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
