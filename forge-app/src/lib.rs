//! Forge Application Library
//!
//! Provides reusable modules for forge binaries.

pub mod services;
pub mod router;

#[cfg(all(target_os = "android", feature = "android"))]
pub mod android;

use std::net::SocketAddr;
use tokio::signal;

/// Run the Forge server (reusable from both binary and JNI)
pub async fn run_server() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    // Parse auth flag from environment
    let auth_required = std::env::var("AUTH_REQUIRED").is_ok();
    if auth_required {
        tracing::info!("GitHub authentication required for frontend access");
    }

    // Initialize services
    tracing::info!("Initializing forge services using upstream deployment");
    let services = services::ForgeServices::new().await?;

    // Load .genie profiles
    services.load_genie_profiles_for_all_projects().await?;

    // Create router
    let app = router::create_router(services, auth_required);

    // Resolve bind address
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8887);

    let addr: SocketAddr = format!("{}:{}", host, port).parse()?;

    // Bind and serve
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let actual_addr = listener.local_addr()?;
    tracing::info!("Forge app listening on {}", actual_addr);

    // Graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Forge app shut down gracefully");
    Ok(())
}

/// Wait for shutdown signal
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
