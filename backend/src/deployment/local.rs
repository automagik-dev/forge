use async_trait::async_trait;

use crate::{
    command_runner::{CommandExecutor, LocalCommandExecutor},
    deployment::Deployment,
};

#[derive(Clone)]
pub struct LocalDeployment {}

#[async_trait]
impl Deployment for LocalDeployment {
    fn new() -> Self {
        Self {}
    }

    fn name(&self) -> &str {
        "local"
    }

    fn command_executor(&self) -> impl CommandExecutor {
        LocalCommandExecutor::new()
    }
}
