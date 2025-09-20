mod router;
mod services;

use crate::router::create_router;
use crate::services::ForgeApp;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let app = ForgeApp::new().await?;
    let router = create_router(app);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001").await?;
    tracing::info!("Forge App listening on {}", listener.local_addr()?);

    axum::serve(listener, router).await?;

    Ok(())
}