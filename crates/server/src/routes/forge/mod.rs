use axum::Router;

use crate::DeploymentImpl;

pub mod branch_templates;

pub fn router() -> Router<DeploymentImpl> {
    Router::new().nest("/branch-templates", branch_templates::router())
}
