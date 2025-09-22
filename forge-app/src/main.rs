mod router;
mod services;

use std::sync::Arc;

use anyhow::{Context, Result};
use services::ForgeServices;
use tracing::info;

const DEFAULT_APP_ADDR: &str = "127.0.0.1:8887";

#[tokio::main]
async fn main() -> Result<()> {
    let _ = tracing_subscriber::fmt::try_init();

    let services = ForgeServices::bootstrap().await?;
    let router = router::create_router(Arc::clone(&services));

    let addr = std::env::var("FORGE_APP_ADDR").unwrap_or_else(|_| DEFAULT_APP_ADDR.to_string());
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("failed to bind forge-app listener on {addr}"))?;

    info!(%addr, "forge-app listening");
    axum::serve(listener, router.into_make_service()).await?;

    Ok(())
}
