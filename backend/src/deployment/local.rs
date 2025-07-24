use async_trait::async_trait;
use backend_common::command_executor::CommandExecutor;

use crate::{command_executor::local::LocalCommandExecutor, deployment::Deployment};

#[derive(Clone)]
pub struct LocalDeployment {}

#[async_trait]
impl Deployment for LocalDeployment {
    fn new() -> Self {
        Self {}
    }

    fn command_executor(&self) -> impl CommandExecutor {
        LocalCommandExecutor::new()
    }

    fn shared_types() -> Vec<String> {
        vec![]
    }
}
