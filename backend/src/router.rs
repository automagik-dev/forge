use axum::{
    routing::{get, IntoMakeService},
    Router,
};

use crate::{
    deployment::DeploymentImpl,
    routes::{config, health, projects},
};

pub fn router(deployment: DeploymentImpl) -> IntoMakeService<Router> {
    // Create routers with different middleware layers
    let base_routes = Router::new()
        .route("/health", get(health::health_check))
        // .merge(stream::stream_router())
        // .merge(filesystem::filesystem_router())
        .merge(config::router(deployment.clone()))
        .merge(projects::router())
        .with_state(deployment);

    // .merge(auth::auth_router())
    // .route("/sounds/:filename", get(serve_sound_file))
    // .merge(
    // Router::new()
    // .route("/execution-processes/:process_id", get(task_attempts::get_execution_process))
    // .route_layer(from_fn_with_state(app_state.clone(), load_execution_process_simple_middleware))
    // );
    Router::new().nest("/api", base_routes).into_make_service()
}
