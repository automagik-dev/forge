use axum::{
    extract::{Path, State},
    response::{
        sse::{Event, KeepAlive},
        Sse,
    },
    routing::get,
    BoxError, Router,
};
use deployment::Deployment;
use futures_util::TryStreamExt;
use services::services::container::ContainerService;
use uuid::Uuid;

use crate::DeploymentImpl;

pub async fn stream_execution_logs(
    State(deployment): State<DeploymentImpl>,
    Path(exec_id): Path<Uuid>,
) -> Result<Sse<impl futures_util::Stream<Item = Result<Event, BoxError>>>, axum::http::StatusCode>
{
    // Ask the container service for a combined "history + live" stream
    let stream = deployment
        .container()
        .history_plus_live_stream(&exec_id)
        .await
        .ok_or(axum::http::StatusCode::NOT_FOUND)?;

    Ok(Sse::new(stream.map_err(|e| -> BoxError { e.into() })).keep_alive(KeepAlive::default()))
}

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    let task_attempt_id_router = Router::new().route("/logs", get(stream_execution_logs));

    let task_attempts_router = Router::new().nest("/{id}", task_attempt_id_router);

    Router::new().nest("/execution-processes", task_attempts_router)
}
