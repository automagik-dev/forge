//! Forge MCP Task Server
//!
//! MCP server for Automagik Forge that defaults to port 8887 (forge-app's default port)
//! instead of reading from port files like upstream.

use rmcp::{ServiceExt, transport::stdio};
use server::mcp::task_server::TaskServer;
use tracing_subscriber::{EnvFilter, prelude::*};
use utils::sentry::{self as sentry_utils, SentrySource, sentry_layer};

fn main() -> anyhow::Result<()> {
    sentry_utils::init_once(SentrySource::Mcp);
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            tracing_subscriber::registry()
                .with(
                    tracing_subscriber::fmt::layer()
                        .with_writer(std::io::stderr)
                        .with_filter(EnvFilter::new("debug")),
                )
                .with(sentry_layer())
                .init();

            let version = env!("CARGO_PKG_VERSION");
            tracing::debug!("[MCP] Starting Forge MCP task server version {version}...");

            // Read backend port from environment variable or use forge default
            let base_url = if let Ok(url) = std::env::var("VIBE_BACKEND_URL") {
                tracing::info!("[MCP] Using backend URL from VIBE_BACKEND_URL: {}", url);
                url
            } else {
                let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

                // Get port from environment variables or fall back to forge-app default (8887)
                let port = match std::env::var("BACKEND_PORT").or_else(|_| std::env::var("PORT")) {
                    Ok(port_str) => {
                        tracing::info!("[MCP] Using port from environment: {}", port_str);
                        port_str.parse::<u16>().map_err(|e| {
                            anyhow::anyhow!("Invalid port value '{}': {}", port_str, e)
                        })?
                    }
                    Err(_) => {
                        tracing::info!("[MCP] Using default forge-app port: 8887");
                        8887
                    }
                };

                let url = format!("http://{}:{}", host, port);
                tracing::info!("[MCP] Using backend URL: {}", url);
                url
            };

            let service = TaskServer::new(&base_url)
                .serve(stdio())
                .await
                .map_err(|e| {
                    tracing::error!("serving error: {:?}", e);
                    e
                })?;

            service.waiting().await?;
            Ok(())
        })
}
