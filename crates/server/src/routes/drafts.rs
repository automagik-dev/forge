use axum::{
    Router,
    extract::{
        Query, State,
        ws::{WebSocket, WebSocketUpgrade, Message},
    },
    response::IntoResponse,
    routing::get,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use uuid::Uuid;

use crate::DeploymentImpl;

#[derive(Debug, Deserialize)]
pub struct DraftsQuery {
    pub project_id: Uuid,
}

pub async fn stream_project_drafts_ws(
    ws: WebSocketUpgrade,
    State(_deployment): State<DeploymentImpl>,
    Query(_query): Query<DraftsQuery>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| async move {
        if let Err(e) = handle_project_drafts_ws(socket).await {
            tracing::warn!("drafts WS closed: {}", e);
        }
    })
}

async fn handle_project_drafts_ws(
    socket: WebSocket,
) -> anyhow::Result<()> {
    // TODO(upstream-alignment): Implement full drafts streaming from upstream
    // Minimal stub to prevent infinite retries - sends empty state and closes
    let (mut sender, _receiver) = socket.split();

    let empty_drafts = serde_json::json!({"drafts": {}});
    let msg = Message::Text(serde_json::to_string(&empty_drafts)?.into());
    let _ = sender.send(msg).await;

    let finished_msg = Message::Text(serde_json::to_string(&serde_json::json!({"finished": true}))?.into());
    let _ = sender.send(finished_msg).await;

    Ok(())
}

pub fn router(_deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    let inner = Router::new().route("/stream/ws", get(stream_project_drafts_ws));
    Router::new().nest("/drafts", inner)
}
