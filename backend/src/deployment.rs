use async_trait::async_trait;
use axum::Router;

use crate::{app_state::AppState, command_executor::CommandExecutor};

#[cfg(feature = "cloud")]
pub mod cloud;
#[cfg(not(feature = "cloud"))]
pub mod local;

#[async_trait]
pub trait Deployment {
    fn new() -> Self;

    fn name(&self) -> &str;

    fn command_executor(&self) -> impl CommandExecutor;

    fn routes(&self) -> Option<Router<AppState>> {
        None
    }
}
