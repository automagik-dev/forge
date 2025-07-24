use async_trait::async_trait;
use axum::Router;
use backend_common::command_executor::CommandExecutor;
use ts_rs::TS;

use crate::{
    app_state::AppState,
    deployment::Deployment,
    routes::github::{self, CreateProjectFromGitHub},
};

#[derive(Clone)]
pub struct CloudDeployment {}

#[async_trait]
impl Deployment for CloudDeployment {
    fn new() -> Self {
        Self {}
    }

    fn command_executor(&self) -> impl CommandExecutor {
        CloudCommandExecutor::new()
    }

    fn routes(&self) -> Option<Router<AppState>> {
        Some(github::github_router())
    }

    fn shared_types() -> Vec<String> {
        vec![CreateProjectFromGitHub::decl()]
    }
}

// CreateProjectFromGitHub
