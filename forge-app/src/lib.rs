//! Forge Application Library
//!
//! Provides reusable modules for forge binaries.

pub mod router;
pub mod services;
pub mod version;

use std::net::{IpAddr, SocketAddr};

use tokio::signal;

/// Check if a port conflict exists and provide diagnostic information.
///
/// This is a helper function that attempts to identify which process is using a port.
/// Platform-specific implementations provide varying levels of detail.
fn check_port_conflict(port: u16, host: &str) -> String {
    find_process_using_port(port, host).unwrap_or_else(|| {
        format!("Port {port} may be in use by another process (unable to identify which)")
    })
}

/// Attempt to find which process is using a given port.
///
/// Platform-specific implementation using system tools when available.
/// This is best-effort - returns None if detection isn't available or fails.
#[cfg(target_os = "linux")]
fn find_process_using_port(port: u16, _host: &str) -> Option<String> {
    use std::process::Command;

    // Try using ss command first (more modern)
    if let Ok(output) = Command::new("ss").args(["-tulpn"]).output()
        && let Ok(stdout) = String::from_utf8(output.stdout)
    {
        for line in stdout.lines() {
            if line.contains(&format!(":{port}")) {
                // Extract PID from ss output (format: users:(("process",pid=12345,fd=3)))
                if let Some(pid_start) = line.find("pid=") {
                    let pid_str = &line[pid_start + 4..];
                    if let Some(pid_end) = pid_str.find(',') {
                        let pid = &pid_str[..pid_end];
                        return Some(format!("Process with PID {pid} is using this port"));
                    }
                }
            }
        }
    }

    // Fallback to lsof if ss didn't work
    if let Ok(output) = Command::new("lsof")
        .args(["-i", &format!(":{port}"), "-t"])
        .output()
        && let Ok(pid_str) = String::from_utf8(output.stdout)
    {
        let pid = pid_str.trim();
        if !pid.is_empty() {
            return Some(format!("Process with PID {pid} is using this port"));
        }
    }

    None
}

#[cfg(target_os = "macos")]
fn find_process_using_port(port: u16, _host: &str) -> Option<String> {
    use std::process::Command;

    // macOS uses lsof
    if let Ok(output) = Command::new("lsof")
        .args(["-i", &format!(":{}", port), "-t"])
        .output()
    {
        if let Ok(pid_str) = String::from_utf8(output.stdout) {
            let pid = pid_str.trim();
            if !pid.is_empty() {
                return Some(format!("Process with PID {} is using this port", pid));
            }
        }
    }

    None
}

#[cfg(target_os = "windows")]
fn find_process_using_port(port: u16, _host: &str) -> Option<String> {
    use std::process::Command;

    // Windows uses netstat
    if let Ok(output) = Command::new("netstat").args(["-ano"]).output() {
        if let Ok(stdout) = String::from_utf8(output.stdout) {
            for line in stdout.lines() {
                if line.contains(&format!(":{}", port)) && line.contains("LISTENING") {
                    // Extract PID from last column
                    if let Some(pid) = line.split_whitespace().last() {
                        return Some(format!("Process with PID {} is using this port", pid));
                    }
                }
            }
        }
    }

    None
}

#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
fn find_process_using_port(_port: u16, _host: &str) -> Option<String> {
    // For other platforms (iOS, BSD variants, etc.), we can't reliably detect the process
    None
}

/// Run the Forge server with optional readiness notification
///
/// When `ready_tx` is provided, sends a signal after the server successfully binds
/// to the port and is ready to accept connections. This is useful for Android JNI
/// to avoid race conditions where the WebView tries to connect before the server starts.
///
/// Note: Caller is responsible for initializing tracing subscriber.
pub async fn run_server_with_readiness(
    ready_tx: Option<tokio::sync::oneshot::Sender<()>>,
) -> anyhow::Result<()> {
    // Parse auth flag from environment
    let auth_required = std::env::var("AUTH_REQUIRED").is_ok();
    if auth_required {
        tracing::info!("GitHub authentication required for frontend access");
    }

    // Ensure asset directory exists before initializing services
    // This prevents "unable to open database file" errors when the directory
    // doesn't exist and SQLite tries to create the database file
    let asset_path = forge_core_utils::assets::asset_dir();
    tracing::info!("Asset directory: {:?}", asset_path);

    // Verify directory is writable by checking if we can access it
    if !asset_path.exists() {
        tracing::error!(
            "Asset directory does not exist after creation attempt: {:?}",
            asset_path
        );
        return Err(anyhow::anyhow!(
            "Failed to create asset directory: {asset_path:?}"
        ));
    }

    // Check if DATABASE_URL is set (may override default path)
    if let Ok(db_url) = std::env::var("DATABASE_URL") {
        tracing::info!("DATABASE_URL is set: {}", db_url);
    } else {
        let default_db_path = asset_path.join("db.sqlite");
        tracing::info!("Database will be created at: {:?}", default_db_path);

        // Pre-create parent directory for database (defensive fix)
        if let Some(parent) = default_db_path.parent()
            && !parent.exists()
        {
            tracing::warn!(
                "Database parent directory doesn't exist, creating: {:?}",
                parent
            );
            std::fs::create_dir_all(parent).map_err(|e| {
                anyhow::anyhow!("Failed to create database directory {parent:?}: {e}")
            })?;
        }
    }

    // Initialize services
    tracing::info!("Initializing forge services using upstream deployment");
    let services = crate::services::ForgeServices::new().await?;

    // Load .genie profiles
    services.load_genie_profiles_for_all_projects().await?;

    // Create router
    let app = router::create_router(services, auth_required);

    // Resolve bind address
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8887);

    // Parse host as IpAddr first to support both IPv4 and IPv6
    let ip: IpAddr = host.parse().unwrap_or_else(|_| {
        tracing::warn!("Invalid HOST value '{}', falling back to 127.0.0.1", host);
        IpAddr::from([127, 0, 0, 1])
    });
    let addr = SocketAddr::from((ip, port));

    // Bind and serve
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => listener,
        Err(e) => {
            // Enhanced error message with port conflict detection
            let error_msg = format!(
                "Failed to bind to {}:{}\n  Error: {}\n  {}",
                host,
                port,
                e,
                check_port_conflict(port, &host)
            );
            tracing::error!("{}", error_msg);
            return Err(anyhow::anyhow!(error_msg));
        }
    };

    let actual_addr = listener.local_addr()?;
    tracing::info!("Forge app listening on {}", actual_addr);

    // Signal readiness after successful bind (for Android JNI synchronization)
    if let Some(tx) = ready_tx {
        let _ = tx.send(());
    }

    // Graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Forge app shut down gracefully");
    Ok(())
}

/// Run the Forge server (backwards-compatible wrapper)
///
/// Note: Caller is responsible for initializing tracing subscriber.
pub async fn run_server() -> anyhow::Result<()> {
    run_server_with_readiness(None).await
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
