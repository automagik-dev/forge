use axum::{
    routing::{get, IntoMakeService},
    Router,
};

use crate::{
    deployment::DeploymentImpl,
    routes::{config, health, projects, tasks},
};

pub fn router(deployment: DeploymentImpl) -> IntoMakeService<Router> {
    // Create routers with different middleware layers
    let base_routes = Router::new()
        .route("/health", get(health::health_check))
        .merge(config::router())
        .merge(projects::router())
        .merge(tasks::router(&deployment))
        .with_state(deployment);

    Router::new().nest("/api", base_routes).into_make_service()
}
