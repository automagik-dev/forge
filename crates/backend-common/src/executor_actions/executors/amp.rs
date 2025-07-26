// use std::{
//     path::{Path, PathBuf},
//     process::Stdio,
// };

// use async_trait::async_trait;
// use command_group::{AsyncCommandGroup, AsyncGroupChild};
// use serde::{Deserialize, Serialize};
// use tokio::{io::AsyncWriteExt, process::Command};

// use crate::utils::shell::get_shell_command;

use crate::executor_actions::executors::standard::StandardCodingAgentExecutor;

/// An executor that uses Amp to process tasks
pub struct AmpExecutor;

// impl StandardCodingAgentExecutor for AmpExecutor {}

// #[async_trait]
// impl Executor for AmpExecutor {
//     async fn spawn(
//         &self,
//         executor_config: impl ExecutorConfig,
//     ) -> Result<AsyncGroupChild, ExecutorError> {
//         // Use shell command for cross-platform compatibility
//         let (shell_cmd, shell_arg) = get_shell_command();
//         // --format=jsonl is deprecated in latest versions of Amp CLI
//         let amp_command = "npx @sourcegraph/amp@0.0.1752148945-gd8844f --format=jsonl";

//         let mut command = Command::new(shell_cmd);
//         command
//             .kill_on_drop(true)
//             .stdin(Stdio::piped()) // <-- open a pipe
//             .stdout(Stdio::piped())
//             .stderr(Stdio::piped())
//             .current_dir(executor_config.get_working_dir())
//             .arg(shell_arg)
//             .arg(amp_command);

//         let mut child = command.group_spawn()?;

//         // feed the prompt in, then close the pipe so `amp` sees EOF
//         if let Some(mut stdin) = child.inner().stdin.take() {
//             stdin
//                 .write_all(executor_config.get_prompt().as_bytes())
//                 .await
//                 .unwrap();
//             stdin.shutdown().await.unwrap(); // or `drop(stdin);`
//         }

//         Ok(child)
//     }

//     async fn spawn_followup(
//         &self,
//         executor_config: StandardExecutorConfig,
//     ) -> Result<AsyncGroupChild, ExecutorError> {
//         let session_id = executor_config
//             .get_session_id()
//             .ok_or(ExecutorError::SessionIdNotFound)?
//             .clone();

//         // Use shell command for cross-platform compatibility
//         let (shell_cmd, shell_arg) = get_shell_command();
//         let amp_command = format!(
//             "npx @sourcegraph/amp@0.0.1752148945-gd8844f threads continue {} --format=jsonl",
//             session_id
//         );

//         let mut command = Command::new(shell_cmd);
//         command
//             .kill_on_drop(true)
//             .stdin(Stdio::piped())
//             .stdout(Stdio::piped())
//             .stderr(Stdio::piped())
//             .current_dir(executor_config.get_working_dir())
//             .arg(shell_arg)
//             .arg(&amp_command);

//         let mut child = command.group_spawn()?;

//         // Feed the prompt in, then close the pipe so amp sees EOF
//         if let Some(mut stdin) = child.inner().stdin.take() {
//             stdin
//                 .write_all(executor_config.get_prompt().as_bytes())
//                 .await?;
//             stdin.shutdown().await?;
//         }

//         Ok(child)
//     }
// }
