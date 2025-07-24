use async_trait::async_trait;
use axum::Router;

use crate::{app_state::AppState, command_executor::CommandExecutor};

#[cfg(feature = "cloud")]
pub mod cloud;
#[cfg(not(feature = "cloud"))]
pub mod local;

#[async_trait]
#[allow(dead_code)]
pub trait Deployment {
    fn new() -> Self;

    fn command_executor(&self) -> impl CommandExecutor;

    fn routes(&self) -> Option<Router<AppState>> {
        None
    }

    fn shared_types() -> Vec<String>;
}
