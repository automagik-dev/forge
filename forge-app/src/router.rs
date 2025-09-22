use std::{env, path::PathBuf, sync::Arc};

use axum::{
    extract::{Extension, Path},
    http::StatusCode,
    routing::{get, get_service},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::services::{ServeDir, ServeFile};
use tracing::warn;
use uuid::Uuid;

use crate::services::ForgeServices;
use forge_extensions_genie::{GenieCommand, GenieWish};
use forge_extensions_omni::OmniInstance;

const DEFAULT_FORGE_FRONTEND_DIST: &str = "frontend-forge/dist";
const DEFAULT_LEGACY_FRONTEND_DIST: &str = "frontend/dist";
const ENV_FORGE_FRONTEND_DIST: &str = "FORGE_FRONTEND_DIST";
const ENV_LEGACY_FRONTEND_DIST: &str = "FORGE_LEGACY_FRONTEND_DIST";

pub fn create_router(services: Arc<ForgeServices>) -> Router {
    let forge_frontend = static_frontend_service(
        ENV_FORGE_FRONTEND_DIST,
        DEFAULT_FORGE_FRONTEND_DIST,
        "forge",
    );

    let legacy_frontend = static_frontend_service(
        ENV_LEGACY_FRONTEND_DIST,
        DEFAULT_LEGACY_FRONTEND_DIST,
        "legacy",
    );

    let mut router = Router::new()
        .route("/health", get(health))
        .nest("/api/forge", forge_api_router())
        .layer(Extension(services));

    router = match legacy_frontend {
        Some(service) => router.nest_service("/legacy", service),
        None => {
            let unavailable = get(legacy_frontend_unavailable);
            router
                .route("/legacy", unavailable.clone())
                .route("/legacy/*path", unavailable)
        }
    };

    match forge_frontend {
        Some(service) => router.fallback_service(service),
        None => router.fallback(get(forge_frontend_unavailable)),
    }
}

fn forge_api_router() -> Router {
    Router::new()
        .route("/omni/instances", get(list_omni_instances))
        .route(
            "/branch-templates/:task_id",
            get(get_branch_template)
                .put(update_branch_template)
                .delete(delete_branch_template),
        )
        .route("/genie/wishes", get(list_genie_wishes))
        .route("/genie/commands", get(list_genie_commands))
}

async fn health() -> &'static str {
    "ok"
}

async fn list_omni_instances(
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Result<Json<OmniInstancesResponse>, (StatusCode, String)> {
    let instances = services
        .list_omni_instances()
        .await
        .map_err(internal_error)?
        .into_iter()
        .map(OmniInstanceDto::from)
        .collect();

    Ok(Json(OmniInstancesResponse { instances }))
}

async fn get_branch_template(
    Path(task_id): Path<Uuid>,
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Result<Json<BranchTemplateResponse>, (StatusCode, String)> {
    let branch_template = services
        .get_branch_template(task_id)
        .await
        .map_err(internal_error)?;

    Ok(Json(BranchTemplateResponse {
        task_id,
        branch_template,
    }))
}

async fn update_branch_template(
    Path(task_id): Path<Uuid>,
    Extension(services): Extension<Arc<ForgeServices>>,
    Json(payload): Json<UpdateBranchTemplateRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let value = payload
        .branch_template
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    if let Some(template) = value {
        services
            .set_branch_template(task_id, template)
            .await
            .map_err(internal_error)?;
    } else {
        services
            .clear_branch_template(task_id)
            .await
            .map_err(internal_error)?;
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_branch_template(
    Path(task_id): Path<Uuid>,
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Result<StatusCode, (StatusCode, String)> {
    services
        .clear_branch_template(task_id)
        .await
        .map_err(internal_error)?;

    Ok(StatusCode::NO_CONTENT)
}

async fn list_genie_wishes(
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Result<Json<GenieWishesResponse>, (StatusCode, String)> {
    let wishes = services
        .list_genie_wishes()
        .map_err(internal_error)?
        .into_iter()
        .map(GenieWishDto::from)
        .collect();

    Ok(Json(GenieWishesResponse { wishes }))
}

async fn list_genie_commands(
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Result<Json<GenieCommandsResponse>, (StatusCode, String)> {
    let commands = services
        .list_genie_commands()
        .map_err(internal_error)?
        .into_iter()
        .map(GenieCommandDto::from)
        .collect();

    Ok(Json(GenieCommandsResponse { commands }))
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

fn static_frontend_service(
    env_var: &str,
    default_path: &str,
    label: &'static str,
) -> Option<axum::routing::MethodRouter> {
    let root = env::var(env_var)
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(default_path));

    if !root.exists() {
        warn!(path = %root.display(), "{label} frontend assets missing; serving fallback");
        return None;
    }

    let fallback_file = root.join("index.html");
    if !fallback_file.exists() {
        warn!(
            path = %fallback_file.display(),
            "{label} frontend index.html missing; spa fallback will return 404"
        );
    }

    let service = ServeDir::new(root).fallback(ServeFile::new(fallback_file));

    Some(get_service(service))
}

async fn legacy_frontend_unavailable() -> (StatusCode, &'static str) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        "legacy frontend not available (build missing)",
    )
}

async fn forge_frontend_unavailable() -> (StatusCode, &'static str) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        "forge frontend not available (build missing)",
    )
}

#[derive(Serialize)]
struct OmniInstancesResponse {
    instances: Vec<OmniInstanceDto>,
}

#[derive(Serialize)]
struct OmniInstanceDto {
    instance_name: String,
    channel_type: String,
    display_name: String,
    status: String,
    is_healthy: bool,
}

impl From<OmniInstance> for OmniInstanceDto {
    fn from(value: OmniInstance) -> Self {
        Self {
            instance_name: value.instance_name,
            channel_type: value.channel_type,
            display_name: value.display_name,
            status: value.status,
            is_healthy: value.is_healthy,
        }
    }
}

#[derive(Serialize)]
struct BranchTemplateResponse {
    task_id: Uuid,
    branch_template: Option<String>,
}

#[derive(Deserialize)]
struct UpdateBranchTemplateRequest {
    branch_template: Option<String>,
}

#[derive(Serialize)]
struct GenieWishesResponse {
    wishes: Vec<GenieWishDto>,
}

#[derive(Serialize)]
struct GenieWishDto {
    slug: String,
    title: String,
    status: Option<String>,
    doc_path: String,
}

impl From<GenieWish> for GenieWishDto {
    fn from(value: GenieWish) -> Self {
        Self {
            slug: value.slug,
            title: value.title,
            status: value.status,
            doc_path: value.doc_path,
        }
    }
}

#[derive(Serialize)]
struct GenieCommandsResponse {
    commands: Vec<GenieCommandDto>,
}

#[derive(Serialize)]
struct GenieCommandDto {
    id: String,
    name: String,
    description: String,
    doc_path: String,
}

impl From<GenieCommand> for GenieCommandDto {
    fn from(value: GenieCommand) -> Self {
        Self {
            id: value.id,
            name: value.name,
            description: value.description,
            doc_path: value.doc_path,
        }
    }
}
