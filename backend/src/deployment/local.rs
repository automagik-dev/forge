use async_trait::async_trait;

use crate::{
    command_executor::{local::LocalCommandExecutor, CommandExecutor},
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
