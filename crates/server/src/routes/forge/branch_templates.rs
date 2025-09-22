use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::get,
};
use forge_extensions_branch_templates::{BranchTemplateRecord, BranchTemplateService};
use serde::{Deserialize, Serialize};
use utils::response::ApiResponse;
use uuid::Uuid;

use crate::{DeploymentImpl, error::ApiError};
use deployment::Deployment;

pub fn router() -> Router<DeploymentImpl> {
    Router::new().route(
        "/{task_id}",
        get(get_template)
            .put(update_template)
            .delete(remove_template),
    )
}

#[derive(Debug, Serialize)]
pub struct BranchTemplateResponse {
    pub task_id: Uuid,
    pub branch_template: Option<String>,
    pub omni_settings: Option<String>,
    pub genie_metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBranchTemplateRequest {
    pub branch_template: Option<String>,
}

async fn get_template(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<ApiResponse<BranchTemplateResponse>>, ApiError> {
    let service = BranchTemplateService::new(deployment.db().pool.clone());
    let record = service.get_template(task_id).await?;
    Ok(Json(ApiResponse::success(into_response(task_id, record))))
}

async fn update_template(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
    Json(payload): Json<UpdateBranchTemplateRequest>,
) -> Result<Json<ApiResponse<BranchTemplateResponse>>, ApiError> {
    let service = BranchTemplateService::new(deployment.db().pool.clone());
    service
        .upsert_template(task_id, payload.branch_template.clone())
        .await?;

    let record = service.get_template(task_id).await?;

    Ok(Json(ApiResponse::success(into_response(task_id, record))))
}

async fn remove_template(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
) -> Result<(StatusCode, Json<ApiResponse<()>>), ApiError> {
    let service = BranchTemplateService::new(deployment.db().pool.clone());
    service.delete_template(task_id).await?;
    Ok((StatusCode::NO_CONTENT, Json(ApiResponse::success(()))))
}

fn into_response(task_id: Uuid, record: Option<BranchTemplateRecord>) -> BranchTemplateResponse {
    if let Some(record) = record {
        BranchTemplateResponse {
            task_id,
            branch_template: record.branch_template,
            omni_settings: record.omni_settings,
            genie_metadata: record.genie_metadata,
        }
    } else {
        BranchTemplateResponse {
            task_id,
            branch_template: None,
            omni_settings: None,
            genie_metadata: None,
        }
    }
}
