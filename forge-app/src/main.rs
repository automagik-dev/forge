//! Forge Application
//!
//! Main application binary that composes upstream services with forge extensions.
//! Provides unified API access to both upstream functionality and forge-specific features.

use std::net::{IpAddr, SocketAddr};
use tokio::signal;
use utils::browser::open_browser;

mod mcp;
mod router;
mod services;

fn resolve_bind_address() -> SocketAddr {
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|raw| raw.trim().parse::<u16>().ok())
        .unwrap_or(0);

    let ip = host
        .parse::<IpAddr>()
        .unwrap_or_else(|_| IpAddr::from([127, 0, 0, 1]));

    SocketAddr::from((ip, port))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    // Initialize upstream deployment and forge services
    tracing::info!("Initializing forge services using upstream deployment");
    let services = services::ForgeServices::new().await?;

    // Create router with services
    let app = router::create_router(services);

    let requested_addr = resolve_bind_address();
    let listener = tokio::net::TcpListener::bind(requested_addr).await?;
    let actual_addr = listener.local_addr()?;
    tracing::info!("Forge app listening on {}", actual_addr);

    // Open browser automatically with localhost instead of 0.0.0.0
    let browser_url = if actual_addr.ip().is_unspecified() {
        format!("http://localhost:{}", actual_addr.port())
    } else {
        format!("http://{}", actual_addr)
    };
    if let Err(e) = open_browser(&browser_url).await {
        tracing::warn!("Failed to open browser: {}", e);
    }

    // Graceful shutdown on Ctrl+C
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Forge app shut down gracefully");

    Ok(())
}

/// Wait for Ctrl+C or SIGTERM signal
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("Received Ctrl+C, initiating graceful shutdown...");
        },
        _ = terminate => {
            tracing::info!("Received SIGTERM, initiating graceful shutdown...");
        },
    }
}
