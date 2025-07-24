use axum::{
    routing::{get, post, IntoMakeService},
    Router,
};
use backend_common::app_state::AppState;

use crate::{
    deployment::DeploymentImpl,
    routes::{config, health},
};

pub fn router(deployment: DeploymentImpl) -> IntoMakeService<Router> {
    // Public routes (no auth required)
    let public_routes = Router::new().route("/api/health", get(health::health_check));

    // Create routers with different middleware layers
    let base_routes = Router::new()
        .merge(public_routes)
        // .merge(stream::stream_router())
        // .merge(filesystem::filesystem_router())
        .merge(config::config_router(deployment.clone()))
        .with_state(deployment)
        .into_make_service();

    // .merge(auth::auth_router())
    // .route("/sounds/:filename", get(serve_sound_file))
    // .merge(
    // Router::new()
    // .route("/execution-processes/:process_id", get(task_attempts::get_execution_process))
    // .route_layer(from_fn_with_state(app_state.clone(), load_execution_process_simple_middleware))
    // );

    base_routes
}
