//! Forge Application
//!
//! Main application binary that composes upstream services with forge extensions.
//! Provides unified API access to both upstream functionality and forge-specific features.

use std::env;
use std::net::{IpAddr, SocketAddr};
use tokio::signal;
use utils::browser::open_browser;
mod router;
mod services;

/// Find which process is using a given port
#[cfg(target_os = "linux")]
fn find_process_using_port(port: u16) -> Option<String> {
    use std::process::Command;

    // Try using ss command first (more modern)
    if let Ok(output) = Command::new("ss")
        .args(["-tulpn"])
        .output()
    {
        if let Ok(stdout) = String::from_utf8(output.stdout) {
            for line in stdout.lines() {
                if line.contains(&format!(":{}", port)) {
                    // Extract PID from ss output (format: users:(("process",pid=12345,fd=3)))
                    if let Some(pid_start) = line.find("pid=") {
                        let pid_str = &line[pid_start + 4..];
                        if let Some(pid_end) = pid_str.find(',') {
                            let pid = &pid_str[..pid_end];
                            return Some(format!("Process with PID {} is using port {}", pid, port));
                        }
                    }
                }
            }
        }
    }

    // Fallback to lsof if ss didn't work
    if let Ok(output) = Command::new("lsof")
        .args(["-i", &format!(":{}", port), "-t"])
        .output()
    {
        if let Ok(pid_str) = String::from_utf8(output.stdout) {
            let pid = pid_str.trim();
            if !pid.is_empty() {
                return Some(format!("Process with PID {} is using port {}", pid, port));
            }
        }
    }

    None
}

#[cfg(not(target_os = "linux"))]
fn find_process_using_port(port: u16) -> Option<String> {
    use std::process::Command;

    // Try lsof on macOS and other Unix-like systems
    if let Ok(output) = Command::new("lsof")
        .args(["-i", &format!(":{}", port), "-t"])
        .output()
    {
        if let Ok(pid_str) = String::from_utf8(output.stdout) {
            let pid = pid_str.trim();
            if !pid.is_empty() {
                return Some(format!("Process with PID {} is using port {}", pid, port));
            }
        }
    }

    None
}

fn resolve_bind_address() -> SocketAddr {
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|raw| raw.trim().parse::<u16>().ok())
        .unwrap_or(8887);

    let ip = host
        .parse::<IpAddr>()
        .unwrap_or_else(|_| IpAddr::from([127, 0, 0, 1]));

    SocketAddr::from((ip, port))
}

/// Parse CLI flags from arguments
fn parse_auth_required() -> bool {
    env::args().any(|arg| arg == "--auth" || arg == "-a")
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    // Parse CLI flags
    let auth_required = parse_auth_required();
    if auth_required {
        tracing::info!("GitHub authentication required for frontend access");
    }

    // Initialize upstream deployment and forge services
    tracing::info!("Initializing forge services using upstream deployment");
    let services = services::ForgeServices::new().await?;

    // Load .genie profiles for all existing projects on startup
    services.load_genie_profiles_for_all_projects().await?;

    // Create router with services and auth flag
    let app = router::create_router(services, auth_required);

    let requested_addr = resolve_bind_address();
    let listener = match tokio::net::TcpListener::bind(requested_addr).await {
        Ok(listener) => listener,
        Err(e) => {
            if e.kind() == std::io::ErrorKind::AddrInUse {
                let port = requested_addr.port();
                let error_msg = if let Some(process_info) = find_process_using_port(port) {
                    format!(
                        "Failed to bind to {}:{}\n{}\n\nPlease stop the process or use a different port by setting the PORT or BACKEND_PORT environment variable.",
                        requested_addr.ip(),
                        port,
                        process_info
                    )
                } else {
                    format!(
                        "Failed to bind to {}:{}\nPort {} is already in use by another process.\n\nPlease stop the process or use a different port by setting the PORT or BACKEND_PORT environment variable.",
                        requested_addr.ip(),
                        port,
                        port
                    )
                };
                tracing::error!("{}", error_msg);
                return Err(anyhow::anyhow!("{}", error_msg));
            }
            return Err(e.into());
        }
    };
    let actual_addr = listener.local_addr()?;
    tracing::info!("Forge app listening on {}", actual_addr);

    // Open browser automatically (unless disabled via env var for development)
    let should_open_browser = env::var("DISABLE_BROWSER_OPEN").is_err();
    if should_open_browser {
        let browser_url = if actual_addr.ip().is_unspecified() {
            format!("http://localhost:{}", actual_addr.port())
        } else {
            format!("http://{}", actual_addr)
        };
        if let Err(e) = open_browser(&browser_url).await {
            tracing::warn!("Failed to open browser: {}", e);
        }
    } else {
        tracing::info!("Browser auto-open disabled (development mode)");
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
