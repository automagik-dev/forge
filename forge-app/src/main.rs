mod router;
mod services;

use anyhow::Result;
use std::path::PathBuf;
use tracing_subscriber::EnvFilter;

use crate::services::ForgeServices;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("forge_app=debug,info")),
        )
        .init();

    tracing::info!("🔥 Starting Automagik Forge with upstream-as-library architecture");

    // Initialize configuration
    let config_path = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("automagik-forge")
        .join("config.json");

    // Initialize forge services (composition of upstream + extensions)
    let forge_services = ForgeServices::new(config_path).await?;

    // Create the router with dual frontend support
    let app = router::create_router(forge_services).await?;

    // Start the server
    let port = std::env::var("BACKEND_PORT")
        .unwrap_or_else(|_| "8887".to_string())
        .parse::<u16>()
        .unwrap_or(8887);

    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("🚀 Forge app listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}