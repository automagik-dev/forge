use axum::{Router, routing::get};

use crate::DeploymentImpl;

pub mod auth;
pub mod config;
pub mod containers;
pub mod filesystem;
// pub mod github;
pub mod events;
pub mod execution_processes;
pub mod forge;
pub mod frontend;
pub mod health;
pub mod images;
pub mod omni;
pub mod projects;
pub mod task_attempts;
pub mod task_templates;
pub mod tasks;

pub fn router(deployment: DeploymentImpl) -> Router {
    // Create routers with different middleware layers
    let base_routes = Router::new()
        .route("/health", get(health::health_check))
        .merge(config::router())
        .merge(containers::router(&deployment))
        .merge(projects::router(&deployment))
        .merge(tasks::router(&deployment))
        .merge(task_attempts::router(&deployment))
        .merge(execution_processes::router(&deployment))
        .merge(task_templates::router(&deployment))
        .merge(auth::router(&deployment))
        .merge(filesystem::router())
        .merge(events::router(&deployment))
        .nest("/images", images::routes())
        .nest("/omni", omni::router())
        .nest("/forge", forge::router())
        .with_state(deployment);

    let forge_frontend = Router::new()
        .route("/", get(frontend::serve_frontend_root))
        .route("/{*path}", get(frontend::serve_frontend));

    let legacy_frontend = Router::new()
        .route("/", get(frontend::serve_legacy_frontend_root))
        .route("/{*path}", get(frontend::serve_legacy_frontend));

    Router::new()
        .merge(forge_frontend)
        .nest("/legacy", legacy_frontend)
        .nest("/api", base_routes)
}
