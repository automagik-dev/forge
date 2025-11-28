//! Shared state types for Forge routes
//!
//! Contains ForgeAppState and related implementations used across all route modules.

use axum::extract::FromRef;

use crate::services::ForgeServices;
use server::DeploymentImpl;

/// Main application state for Forge routes
#[derive(Clone)]
pub struct ForgeAppState {
    pub(crate) services: ForgeServices,
    pub(crate) deployment: DeploymentImpl,
    pub(crate) auth_required: bool,
}

impl ForgeAppState {
    pub fn new(services: ForgeServices, deployment: DeploymentImpl, auth_required: bool) -> Self {
        Self {
            services,
            deployment,
            auth_required,
        }
    }
}

impl FromRef<ForgeAppState> for ForgeServices {
    fn from_ref(state: &ForgeAppState) -> ForgeServices {
        state.services.clone()
    }
}

impl FromRef<ForgeAppState> for DeploymentImpl {
    fn from_ref(state: &ForgeAppState) -> DeploymentImpl {
        state.deployment.clone()
    }
}
