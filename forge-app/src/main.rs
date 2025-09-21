//! Forge Application
//!
//! Main application binary that will compose upstream services with forge extensions.
//! Currently scaffolded - full composition logic will be implemented in Task 2/3.

use std::net::SocketAddr;
use tracing_subscriber;

mod router;
mod services;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    // Initialize forge extensions (currently just placeholders)
    forge_omni::placeholder();
    forge_branch_templates::placeholder();
    forge_config::placeholder();
    forge_genie::placeholder();

    let app = router::create_router();

    let addr = SocketAddr::from(([127, 0, 0, 1], 8887));
    tracing::info!("Forge app listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}