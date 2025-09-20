mod router;
mod services;

use anyhow::Result;
use services::ForgeServices;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🚀 Starting Automagik Forge Server (upstream-as-library architecture)");

    // Initialize services
    let services = ForgeServices::new().await?;

    // Create router with both upstream and forge routes
    let app = router::create_router(services);

    // Start server
    let addr = "127.0.0.1:8887".parse()?;
    tracing::info!("✨ Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}