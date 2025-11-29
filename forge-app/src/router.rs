//! Forge Router
//!
//! Routes forge-specific APIs under `/api/forge/*` and upstream APIs under `/api/*`.
//! Serves single frontend (with overlay architecture) at `/`.
//!
//! This module acts as a thin composition layer that imports domain-specific
//! route handlers from the `routes/` module.

use axum::{
    Router,
    http::Method,
    routing::{get, post},
};
use tower_http::cors::{Any, CorsLayer};

use crate::routes::{
    ForgeAppState,
    agents, attempts, config, frontend, omni, projects, tasks,
};
use crate::services::ForgeServices;
use server::{
    DeploymentImpl,
    routes::{
        self as upstream, approvals, auth, containers, drafts, events,
        execution_processes, filesystem, images, projects as upstream_projects, tags,
    },
};

/// Create the main application router
pub fn create_router(services: ForgeServices, auth_required: bool) -> Router {
    let deployment = services.deployment.as_ref().clone();
    let state = ForgeAppState::new(services, deployment.clone(), auth_required);

    let upstream_api = upstream_api_router(&deployment);

    // Configure CORS for Swagger UI and external API access
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    Router::new()
        .route("/health", get(frontend::health_check))
        .route("/docs", get(frontend::serve_swagger_ui))
        .route("/api/openapi.json", get(frontend::serve_openapi_spec))
        .route("/api/routes", get(frontend::list_routes))
        .merge(forge_api_routes())
        // Upstream API at /api
        .nest("/api", upstream_api)
        // Single frontend with overlay architecture
        .fallback(frontend::frontend_handler)
        .layer(cors)
        .with_state(state)
}

/// Forge-specific API routes under /api/forge/*
fn forge_api_routes() -> Router<ForgeAppState> {
    Router::new()
        .route("/api/forge/auth-required", get(config::get_auth_required))
        .route(
            "/api/forge/config",
            get(config::get_forge_config).put(config::update_forge_config),
        )
        .route(
            "/api/forge/projects/{project_id}/settings",
            get(projects::get_project_settings).put(projects::update_project_settings),
        )
        .route(
            "/api/forge/projects/{project_id}/profiles",
            get(projects::get_project_profiles),
        )
        .route("/api/forge/omni/status", get(omni::get_omni_status))
        .route("/api/forge/omni/instances", get(omni::list_omni_instances))
        .route("/api/forge/omni/validate", post(omni::validate_omni_config))
        .route(
            "/api/forge/omni/notifications",
            get(omni::list_omni_notifications),
        )
        .route("/api/forge/releases", get(frontend::get_github_releases))
        .route(
            "/api/forge/master-genie/{attempt_id}/neurons",
            get(agents::get_master_genie_neurons),
        )
        .route(
            "/api/forge/neurons/{neuron_attempt_id}/subtasks",
            get(agents::get_neuron_subtasks),
        )
        .route(
            "/api/forge/agents",
            get(agents::get_forge_agents).post(agents::create_forge_agent),
        )
}

/// Upstream API router - merges VK server routes with forge overrides
fn upstream_api_router(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    let mut router = Router::new().route("/health", get(upstream::health::health_check));

    let dep_clone = deployment.clone();

    // Forge override: config router with increased body limit for /profiles
    router = router.merge(config::forge_config_router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(containers::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(upstream_projects::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(drafts::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));

    // Build custom tasks router with forge override
    let tasks_router_with_override = tasks::build_tasks_router_with_forge_override(deployment);
    router = router.merge(tasks_router_with_override);

    // Build custom task_attempts router with forge override
    let task_attempts_router_with_override =
        attempts::build_task_attempts_router_with_forge_override(deployment);
    router = router.merge(task_attempts_router_with_override);
    router = router.merge(
        execution_processes::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()),
    );
    router = router.merge(auth::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(tags::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(filesystem::router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(events::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router = router.merge(approvals::router().with_state::<ForgeAppState>(dep_clone.clone()));

    router.nest(
        "/images",
        forge_images_router().with_state::<ForgeAppState>(dep_clone),
    )
}

/// Build images router with forge override for increased body limit on uploads
fn forge_images_router() -> Router<DeploymentImpl> {
    use axum::extract::DefaultBodyLimit;

    images::routes().layer(DefaultBodyLimit::max(100 * 1024 * 1024))
}
