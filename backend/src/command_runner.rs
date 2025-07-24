use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRunnerArgs {
    pub command: String,
    pub args: Vec<String>,
    pub working_dir: Option<String>,
    pub env_vars: Vec<(String, String)>,
    pub stdin: Option<String>,
}

#[derive(Debug)]
pub enum CommandError {
    SpawnFailed {
        command: String,
        error: std::io::Error,
    },
    StatusCheckFailed {
        error: std::io::Error,
    },
    KillFailed {
        error: std::io::Error,
    },
    ProcessNotStarted,
    NoCommandSet,
    IoError {
        error: std::io::Error,
    },
}
impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        CommandError::IoError { error }
    }
}
impl std::fmt::Display for CommandError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CommandError::SpawnFailed { command, error } => {
                write!(f, "Failed to spawn command '{}': {}", command, error)
            }
            CommandError::StatusCheckFailed { error } => {
                write!(f, "Failed to check command status: {}", error)
            }
            CommandError::KillFailed { error } => {
                write!(f, "Failed to kill command: {}", error)
            }
            CommandError::ProcessNotStarted => {
                write!(f, "Process has not been started yet")
            }
            CommandError::NoCommandSet => {
                write!(f, "No command has been set")
            }
            CommandError::IoError { error } => {
                write!(f, "Failed to spawn command: {}", error)
            }
        }
    }
}

impl std::error::Error for CommandError {}

pub struct CommandRunner {
    command: Option<String>,
    args: Vec<String>,
    working_dir: Option<String>,
    env_vars: Vec<(String, String)>,
    stdin: Option<String>,
}

impl Default for CommandRunner {
    fn default() -> Self {
        Self::new()
    }
}

impl CommandRunner {
    pub fn new() -> Self {
        CommandRunner {
            command: None,
            args: Vec::new(),
            working_dir: None,
            env_vars: Vec::new(),
            stdin: None,
        }
    }

    pub fn command(&mut self, cmd: &str) -> &mut Self {
        self.command = Some(cmd.to_string());
        self
    }

    pub fn get_program(&self) -> &str {
        self.command.as_deref().unwrap_or("")
    }

    pub fn get_args(&self) -> &[String] {
        &self.args
    }

    pub fn get_current_dir(&self) -> Option<&str> {
        self.working_dir.as_deref()
    }

    pub fn arg(&mut self, arg: &str) -> &mut Self {
        self.args.push(arg.to_string());
        self
    }

    pub fn stdin(&mut self, prompt: &str) -> &mut Self {
        self.stdin = Some(prompt.to_string());
        self
    }

    pub fn working_dir(&mut self, dir: &str) -> &mut Self {
        self.working_dir = Some(dir.to_string());
        self
    }

    pub fn env(&mut self, key: &str, val: &str) -> &mut Self {
        self.env_vars.push((key.to_string(), val.to_string()));
        self
    }

    /// Convert the current CommandRunner state to a CreateCommandRequest
    pub fn to_args(&self) -> Option<CommandRunnerArgs> {
        Some(CommandRunnerArgs {
            command: self.command.clone()?,
            args: self.args.clone(),
            working_dir: self.working_dir.clone(),
            env_vars: self.env_vars.clone(),
            stdin: self.stdin.clone(),
        })
    }

    #[allow(dead_code)]
    pub fn from_args(request: CommandRunnerArgs) -> Self {
        let mut runner = Self::new();
        runner.command(&request.command);

        for arg in &request.args {
            runner.arg(arg);
        }

        if let Some(dir) = &request.working_dir {
            runner.working_dir(dir);
        }

        for (key, value) in &request.env_vars {
            runner.env(key, value);
        }

        if let Some(stdin) = &request.stdin {
            runner.stdin(stdin);
        }

        runner
    }
}
