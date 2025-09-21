use anyhow::Result;
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;

mod router;
mod services;

use services::ForgeServices;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    info!("Starting forge-app with extensions...");

    // Initialize services
    let services = Arc::new(ForgeServices::new());

    // Create router with services
    let app = router::create_router(services);

    // Bind and serve
    let addr = SocketAddr::from(([127, 0, 0, 1], 8887));
    info!("Listening on {}", addr);
    info!("Available endpoints:");
    info!("  - GET  /health");
    info!("  - GET  /api/forge/omni/instances");
    info!("  - POST /api/forge/omni/test");
    info!("  - GET  /api/forge/branch-templates/{{task_id}}");
    info!("  - POST /api/forge/branch-templates/{{task_id}}");
    info!("  - GET  /api/forge/genie/wishes");
    info!("  - GET  /api/forge/genie/commands");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}