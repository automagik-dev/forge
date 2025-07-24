use async_trait::async_trait;
use axum::Router;

use crate::{
    app_state::AppState,
    command_executor::{cloud::CloudCommandExecutor, CommandExecutor},
    deployment::Deployment,
    routes::github,
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

    fn routes(&self) -> Option<Router<AppState>> {
        Some(github::github_router())
    }
}
