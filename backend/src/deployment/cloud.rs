use async_trait::async_trait;

use crate::{
    command_executor::{cloud::CloudCommandExecutor, CommandExecutor},
    deployment::Deployment,
};

#[derive(Clone)]
pub struct CloudDeployment {}

#[async_trait]
impl Deployment for CloudDeployment {
    fn new() -> Self {
        Self {}
    }

    fn name(&self) -> &str {
        "cloud"
    }

    fn command_executor(&self) -> impl CommandExecutor {
        CloudCommandExecutor::new()
    }
}
