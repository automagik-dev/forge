//! Forge Router
//!
//! Routes forge-specific APIs under `/api/forge/*` and upstream APIs under `/api/*`.
//! Serves single frontend (with overlay architecture) at `/`.
//!
//! All task/attempt functionality is now in forge-core:
//! - Profile injection from .genie folders
//! - Agent tracking for non-worktree tasks
//! - Executor:variant storage for filtering
//! - Branch prefix "forge/" (configurable)

use axum::{
    Json, Router,
    extract::{FromRef, Path, State},
    http::{HeaderValue, Method, StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use forge_core_db::models::task::TaskWithAttemptStatus;
use forge_core_server::{
    DeploymentImpl,
    routes::{
        self as upstream, approvals, auth, config as upstream_config, containers, drafts, events,
        execution_processes, filesystem, forge, images, projects, tags, task_attempts, tasks,
    },
};
use rust_embed::RustEmbed;
use serde_json::{Value, json};
use tower_http::cors::{Any, CorsLayer};

use crate::services::ForgeServices;

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct Frontend;

/// Type alias for TaskWithAttemptStatus - kept for API compatibility
pub type ForgeTaskWithAttemptStatus = TaskWithAttemptStatus;

#[derive(Clone)]
struct ForgeAppState {
    services: ForgeServices,
    deployment: DeploymentImpl,
    auth_required: bool,
}

impl ForgeAppState {
    fn new(services: ForgeServices, deployment: DeploymentImpl, auth_required: bool) -> Self {
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
        .route("/health", get(health_check))
        .route("/docs", get(serve_swagger_ui))
        .route("/api/openapi.json", get(serve_openapi_spec))
        .route("/api/routes", get(list_routes))
        // Public PWA manifest - must be accessible without authentication
        .route("/site.webmanifest", get(serve_assets_public))
        .merge(forge_api_routes())
        // Upstream API at /api
        .nest("/api", upstream_api)
        // Single frontend with overlay architecture
        .fallback(frontend_handler)
        .layer(cors)
        .with_state(state)
}

/// Forge-app specific routes that extend forge-core's routes
/// - auth-required: Check if authentication is required (forge-app only)
fn forge_api_routes() -> Router<ForgeAppState> {
    Router::new().route("/api/forge/auth-required", get(get_auth_required))
}

fn upstream_api_router(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    let mut router = Router::new().route("/health", get(upstream::health::health_check));

    let dep_clone = deployment.clone();

    // Forge override: config router with increased body limit for /profiles
    router = router.merge(forge_config_router().with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(containers::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(projects::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));
    router =
        router.merge(drafts::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));

    // Build custom tasks router with forge override (already typed as ForgeAppState)
    let tasks_router_with_override = build_tasks_router_with_forge_override(deployment);
    router = router.merge(tasks_router_with_override);

    // Build custom task_attempts router with forge override (already typed as ForgeAppState)
    let task_attempts_router_with_override =
        build_task_attempts_router_with_forge_override(deployment);
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

    // Forge-core routes: /forge/* (config, settings, omni, releases, agents)
    router = router.merge(forge::router(deployment).with_state::<ForgeAppState>(dep_clone.clone()));

    router.nest(
        "/images",
        forge_images_router().with_state::<ForgeAppState>(dep_clone),
    )
}

/// Build tasks router - uses forge-core's handlers that exclude agent tasks
/// via the forge_agents table (kanban vs agent task separation)
fn build_tasks_router_with_forge_override(deployment: &DeploymentImpl) -> Router<ForgeAppState> {
    use axum::middleware::from_fn_with_state;
    use forge_core_server::middleware::load_task_middleware;

    let task_id_router = Router::new()
        .route(
            "/",
            get(tasks::get_task)
                .put(tasks::update_task)
                .delete(tasks::delete_task),
        )
        .layer(from_fn_with_state(deployment.clone(), load_task_middleware));

    let inner = Router::new()
        // Use forge-core handlers - agent tasks filtered via forge_agents table
        .route("/", get(tasks::get_tasks).post(tasks::create_task))
        .route("/stream/ws", get(tasks::stream_tasks_ws))
        // forge-core now handles everything: profile injection + agent tracking + executor:variant
        .route("/create-and-start", post(tasks::create_task_and_start))
        .nest("/{task_id}", task_id_router);

    Router::new().nest("/tasks", inner)
}

/// Build task_attempts router with forge override for create endpoint
fn build_task_attempts_router_with_forge_override(
    deployment: &DeploymentImpl,
) -> Router<ForgeAppState> {
    use axum::middleware::from_fn_with_state;
    use forge_core_server::middleware::load_task_attempt_middleware;

    let task_attempt_id_router = Router::new()
        .route("/", get(task_attempts::get_task_attempt))
        // forge-core's follow_up now handles profile injection automatically
        .route("/follow-up", post(task_attempts::follow_up))
        .route(
            "/draft",
            get(task_attempts::drafts::get_draft)
                .put(task_attempts::drafts::save_draft)
                .delete(task_attempts::drafts::delete_draft),
        )
        .route("/draft/queue", post(task_attempts::drafts::set_draft_queue))
        .route("/replace-process", post(task_attempts::replace_process))
        .route("/commit-info", get(task_attempts::get_commit_info))
        .route(
            "/commit-compare",
            get(task_attempts::compare_commit_to_head),
        )
        .route("/start-dev-server", post(task_attempts::start_dev_server))
        // Use forge-core's branch-status - already has remote_commits_behind/ahead
        .route(
            "/branch-status",
            get(task_attempts::get_task_attempt_branch_status),
        )
        .route("/diff/ws", get(task_attempts::stream_task_attempt_diff_ws))
        .route("/merge", post(task_attempts::merge_task_attempt))
        .route("/push", post(task_attempts::push_task_attempt_branch))
        .route("/rebase", post(task_attempts::rebase_task_attempt))
        .route(
            "/conflicts/abort",
            post(task_attempts::abort_conflicts_task_attempt),
        )
        .route("/pr", post(task_attempts::create_github_pr))
        .route("/pr/attach", post(task_attempts::attach_existing_pr))
        .route(
            "/open-editor",
            post(task_attempts::open_task_attempt_in_editor),
        )
        .route(
            "/delete-file",
            post(task_attempts::delete_task_attempt_file),
        )
        .route("/children", get(task_attempts::get_task_attempt_children))
        .route("/stop", post(task_attempts::stop_task_attempt_execution))
        .route(
            "/change-target-branch",
            post(task_attempts::change_target_branch),
        )
        .layer(from_fn_with_state(
            deployment.clone(),
            load_task_attempt_middleware,
        ));

    let task_attempts_router = Router::new()
        .route(
            "/",
            // forge-core now handles everything: profile injection + executor:variant
            get(task_attempts::get_task_attempts).post(task_attempts::create_task_attempt),
        )
        .nest("/{id}", task_attempt_id_router);

    Router::new().nest("/task-attempts", task_attempts_router)
}

/// Build config router with forge override for increased body limit on /profiles
fn forge_config_router() -> Router<DeploymentImpl> {
    use axum::extract::DefaultBodyLimit;

    // Use upstream router and layer on increased body limit globally for config routes
    // This affects all config routes, but /profiles is the only one with large payloads
    upstream_config::router().layer(DefaultBodyLimit::max(20 * 1024 * 1024)) // 20MB limit for large profile payloads
}

/// Build images router with forge override for increased body limit on uploads
fn forge_images_router() -> Router<DeploymentImpl> {
    use axum::extract::DefaultBodyLimit;

    // Use upstream router and layer on increased body limit globally for image routes
    // Upstream has 20MB limits on upload routes, we increase to 100MB for large images
    images::routes().layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB limit for image uploads
}

async fn frontend_handler(uri: axum::http::Uri) -> Response {
    let path = uri.path().trim_start_matches('/');

    if path.is_empty() {
        serve_index().await
    } else {
        serve_assets(Path(path.to_string())).await
    }
}

async fn serve_index() -> Response {
    match Frontend::get("index.html") {
        Some(content) => Html(content.data.to_vec()).into_response(),
        None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
    }
}

async fn serve_assets(Path(path): Path<String>) -> Response {
    serve_static_file::<Frontend>(&path).await
}

/// Serve public assets (no auth required) - used for PWA manifest and other public files
async fn serve_assets_public() -> Response {
    serve_static_file::<Frontend>("site.webmanifest").await
}

async fn serve_static_file<T: RustEmbed>(path: &str) -> Response {
    match T::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();

            let mut response = Response::new(content.data.into());
            let content_type = HeaderValue::from_str(mime.as_ref())
                .unwrap_or_else(|_| HeaderValue::from_static("application/octet-stream"));
            response
                .headers_mut()
                .insert(header::CONTENT_TYPE, content_type);
            response
        }
        None => {
            // Fallback to index.html for SPA routing
            if let Some(index) = T::get("index.html") {
                Html(index.data.to_vec()).into_response()
            } else {
                (StatusCode::NOT_FOUND, "404 Not Found").into_response()
            }
        }
    }
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "forge-app",
        "version": crate::version::get_version(),
        "message": "Forge application ready"
    }))
}

/// Serve OpenAPI specification as JSON
async fn serve_openapi_spec() -> Result<Json<Value>, (StatusCode, String)> {
    const OPENAPI_YAML: &str = include_str!("../openapi.yaml");

    serde_yaml::from_str::<Value>(OPENAPI_YAML)
        .map(Json)
        .map_err(|e| {
            tracing::error!("Failed to parse openapi.yaml: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to parse OpenAPI spec: {e}"),
            )
        })
}

/// Serve Swagger UI HTML
async fn serve_swagger_ui() -> Html<String> {
    Html(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automagik Forge API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {{
            SwaggerUIBundle({{
                url: "/api/openapi.json",
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                deepLinking: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
                persistAuthorization: true
            }});
        }};
    </script>
</body>
</html>"#
            .to_string(),
    )
}

/// Simple route listing - practical solution instead of broken OpenAPI
async fn list_routes() -> Json<Value> {
    Json(json!({
        "version": crate::version::get_version(),
        "routes": {
            "core": [
                "GET /health",
                "GET /api/health",
                "GET /api/routes (this endpoint)"
            ],
            "auth": [
                "POST /api/auth/github/device",
                "POST /api/auth/github/device/poll",
                "POST /api/auth/logout"
            ],
            "projects": [
                "GET /api/projects",
                "POST /api/projects",
                "GET /api/projects/{id}",
                "PUT /api/projects/{id}",
                "DELETE /api/projects/{id}"
            ],
            "tasks": [
                "GET /api/tasks",
                "POST /api/tasks",
                "POST /api/tasks/create-and-start",
                "GET /api/tasks/{id}",
                "PUT /api/tasks/{id}",
                "DELETE /api/tasks/{id}",
                "GET /api/tasks/stream/ws"
            ],
            "task_attempts": [
                "GET /api/task-attempts",
                "POST /api/task-attempts",
                "GET /api/task-attempts/{id}",
                "POST /api/task-attempts/{id}/follow-up",
                "POST /api/task-attempts/{id}/stop",
                "POST /api/task-attempts/{id}/merge",
                "POST /api/task-attempts/{id}/push",
                "POST /api/task-attempts/{id}/rebase",
                "POST /api/task-attempts/{id}/pr",
                "POST /api/task-attempts/{id}/pr/attach",
                "GET /api/task-attempts/{id}/branch-status",
                "GET /api/task-attempts/{id}/diff/ws",
                "GET /api/task-attempts/{id}/draft",
                "PUT /api/task-attempts/{id}/draft",
                "DELETE /api/task-attempts/{id}/draft"
            ],
            "processes": [
                "GET /api/execution-processes",
                "GET /api/execution-processes/{id}",
                "POST /api/execution-processes/{id}/stop"
            ],
            "events": [
                "GET /api/events/processes/{id}/logs",
                "GET /api/events/task-attempts/{id}/diff"
            ],
            "images": [
                "POST /api/images",
                "GET /api/images/{id}"
            ],
            "forge": [
                "GET /api/forge/config",
                "PUT /api/forge/config",
                "GET /api/forge/projects/{id}/settings",
                "PUT /api/forge/projects/{id}/settings",
                "GET /api/forge/omni/status",
                "GET /api/forge/omni/instances",
                "POST /api/forge/omni/validate",
                "GET /api/forge/omni/notifications",
                "GET /api/forge/releases"
            ],
            "filesystem": [
                "GET /api/filesystem/tree",
                "GET /api/filesystem/file"
            ],
            "config": [
                "GET /api/config",
                "PUT /api/config"
            ],
            "drafts": [
                "GET /api/drafts",
                "POST /api/drafts",
                "GET /api/drafts/{id}",
                "PUT /api/drafts/{id}",
                "DELETE /api/drafts/{id}"
            ],
            "containers": [
                "GET /api/containers",
                "GET /api/containers/{id}"
            ],
            "approvals": [
                "POST /api/approvals/create",
                "GET /api/approvals/{id}/status",
                "POST /api/approvals/{id}/respond",
                "GET /api/approvals/pending"
            ]
        },
        "note": "This is a simple route listing. Most endpoints require GitHub OAuth authentication via /api/auth/github/device"
    }))
}

async fn get_auth_required(State(state): State<ForgeAppState>) -> Json<Value> {
    Json(json!({
        "auth_required": state.auth_required
    }))
}

#[cfg(test)]
mod tests {
    use forge_core_utils::text::{git_branch_id, short_uuid};
    use uuid::Uuid;

    #[test]
    fn test_forge_branch_prefix_format() {
        // Test that branch names use "forge" prefix instead of "vk"
        let attempt_id = Uuid::new_v4();
        let task_title = "test task";

        let task_title_id = git_branch_id(task_title);
        let short_id = short_uuid(&attempt_id);
        let branch_name = format!("forge/{short_id}-{task_title_id}");

        assert!(branch_name.starts_with("forge/"));
        assert!(branch_name.contains(&short_id));
        assert!(branch_name.contains(&task_title_id));
    }

    #[test]
    fn test_forge_branch_prefix_uniqueness() {
        // Test that different attempt IDs produce different branch names
        let attempt_id_1 = Uuid::new_v4();
        let attempt_id_2 = Uuid::new_v4();
        let task_title = "test";

        let task_title_id = git_branch_id(task_title);
        let short_id_1 = short_uuid(&attempt_id_1);
        let short_id_2 = short_uuid(&attempt_id_2);

        let branch_1 = format!("forge/{short_id_1}-{task_title_id}");
        let branch_2 = format!("forge/{short_id_2}-{task_title_id}");

        assert_ne!(branch_1, branch_2);
        assert!(branch_1.starts_with("forge/"));
        assert!(branch_2.starts_with("forge/"));
    }

    #[test]
    fn test_forge_branch_format_matches_upstream() {
        // Verify format is identical to upstream except for "forge" vs "vk" prefix
        let attempt_id = Uuid::new_v4();
        let task_title = "my-test-task";

        let task_title_id = git_branch_id(task_title);
        let short_id = short_uuid(&attempt_id);

        let forge_branch = format!("forge/{short_id}-{task_title_id}");
        let upstream_branch = format!("vk/{short_id}-{task_title_id}");

        // Only difference should be the prefix
        assert_eq!(
            forge_branch.replace("forge/", ""),
            upstream_branch.replace("vk/", "")
        );
    }
}
