//! Forge Application
//!
//! Main application binary that composes upstream services with forge extensions.
//! Provides unified API access to both upstream functionality and forge-specific features.

use std::{
    env,
    net::{IpAddr, SocketAddr},
};

use forge_core_utils::browser::open_browser;

fn resolve_bind_address() -> SocketAddr {
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

    // Check for --port CLI flag first
    let cli_port = parse_port_flag();

    let port = cli_port.unwrap_or_else(|| {
        std::env::var("BACKEND_PORT")
            .or_else(|_| std::env::var("PORT"))
            .ok()
            .and_then(|raw| raw.trim().parse::<u16>().ok())
            .unwrap_or(8887)
    });

    let ip = host
        .parse::<IpAddr>()
        .unwrap_or_else(|_| IpAddr::from([127, 0, 0, 1]));

    SocketAddr::from((ip, port))
}

/// Parse --port or -p flag from CLI arguments
fn parse_port_flag() -> Option<u16> {
    let args: Vec<String> = env::args().collect();

    for i in 0..args.len() {
        let arg = &args[i];

        // Handle --port=8888 or -p=8888
        if let Some(port_str) = arg
            .strip_prefix("--port=")
            .or_else(|| arg.strip_prefix("-p="))
            && let Ok(port) = port_str.parse::<u16>()
        {
            return Some(port);
        }

        // Handle --port 8888 or -p 8888
        if (arg == "--port" || arg == "-p")
            && i + 1 < args.len()
            && let Ok(port) = args[i + 1].parse::<u16>()
        {
            return Some(port);
        }
    }

    None
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
        unsafe {
            std::env::set_var("AUTH_REQUIRED", "1");
        }
    }

    // Parse port from CLI
    if let Some(port) = parse_port_flag() {
        unsafe {
            std::env::set_var("PORT", port.to_string());
        }
    }

    // Open browser before starting server (unless disabled)
    let should_open_browser = env::var("DISABLE_BROWSER_OPEN").is_err();
    if should_open_browser {
        let requested_addr = resolve_bind_address();
        let browser_url = if requested_addr.ip().is_unspecified() {
            format!("http://localhost:{}", requested_addr.port())
        } else {
            format!("http://{requested_addr}")
        };

        tokio::spawn(async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            if let Err(e) = open_browser(&browser_url).await {
                tracing::warn!("Failed to open browser: {}", e);
            }
        });
    }

    // Run server using shared logic
    forge_app_lib::run_server().await
}
