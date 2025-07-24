use async_trait::async_trait;

use crate::command_runner::CommandExecutor;
pub mod local;

#[async_trait]
trait Deployment {
    fn name(&self) -> &str;

    fn command_executor(&self) -> impl CommandExecutor;
}
