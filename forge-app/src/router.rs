use std::sync::Arc;

use axum::{
    extract::{Extension, Path},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

use crate::services::ForgeServices;
use forge_extensions_omni::OmniInstance;

pub fn create_router(services: Arc<ForgeServices>) -> Router {
    Router::new()
        .route("/health", get(health))
        .nest("/api/forge", forge_api_router())
        .layer(Extension(services))
}

fn forge_api_router() -> Router {
    Router::new()
        .route("/omni/instances", get(list_omni_instances))
        .route("/branch-templates/:task_id", get(get_branch_template))
        .route("/genie/wishes", get(list_genie_wishes))
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

async fn list_genie_wishes(
    Extension(services): Extension<Arc<ForgeServices>>,
) -> Json<GenieWishesResponse> {
    let wishes = services.list_genie_wishes().await;
    Json(GenieWishesResponse { wishes })
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
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

#[derive(Serialize)]
struct GenieWishesResponse {
    wishes: Vec<String>,
}
