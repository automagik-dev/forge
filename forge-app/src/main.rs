use anyhow::Result;
use std::net::SocketAddr;
use tracing::info;

mod router;
mod services;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    info!("Starting forge-app scaffold...");

    // Create router
    let app = router::create_router();

    // Bind and serve
    let addr = SocketAddr::from(([127, 0, 0, 1], 8887));
    info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}