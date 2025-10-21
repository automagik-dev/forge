//! Forge MCP Advanced Server
//!
//! Full backend API access MCP server for Automagik Forge.
//! Exposes all task management + advanced tools (projects, attempts, processes, etc.)

use forge_app::mcp::advanced_server::ForgeAdvancedServer;
use rmcp::{ServiceExt, transport::stdio};
use tracing_subscriber::{EnvFilter, prelude::*};
use utils::{
    port_file::read_port_file,
    sentry::{self as sentry_utils, SentrySource, sentry_layer},
};

fn main() -> anyhow::Result<()> {
    sentry_utils::init_once(SentrySource::Mcp);
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async move {
            tracing_subscriber::registry()
                .with(
                    tracing_subscriber::fmt::layer()
                        .with_writer(std::io::stderr)
                        .with_filter(EnvFilter::new("debug")),
                )
                .with(sentry_layer())
                .init();

            let version = env!("CARGO_PKG_VERSION");
            tracing::info!(
                "[MCP ADVANCED] Starting Forge MCP Advanced server version {version}..."
            );
            tracing::info!("[MCP ADVANCED] ✨ Full backend API access enabled");

            // Read backend URL/port from environment, port file, or default
            let base_url = if let Ok(url) = std::env::var("FORGE_BACKEND_URL") {
                tracing::info!(
                    "[MCP ADVANCED] Using backend URL from FORGE_BACKEND_URL: {}",
                    url
                );
                url
            } else {
                let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

                // Priority: BACKEND_PORT env > PORT env > port file > default 8887
                let port = match std::env::var("BACKEND_PORT").or_else(|_| std::env::var("PORT")) {
                    Ok(port_str) => {
                        tracing::info!("[MCP ADVANCED] Using port from environment: {}", port_str);
                        port_str.parse::<u16>().map_err(|e| {
                            anyhow::anyhow!("Invalid port value '{}': {}", port_str, e)
                        })?
                    }
                    Err(_) => {
                        // Try reading from port file
                        match read_port_file("automagik-forge").await {
                            Ok(port) => {
                                tracing::info!(
                                    "[MCP ADVANCED] Using port from port file: {}",
                                    port
                                );
                                port
                            }
                            Err(_) => {
                                tracing::info!("[MCP ADVANCED] Using default forge-app port: 8887");
                                8887
                            }
                        }
                    }
                };

                let url = format!("http://{}:{}", host, port);
                tracing::info!("[MCP ADVANCED] Using backend URL: {}", url);
                url
            };

            let service = ForgeAdvancedServer::new(&base_url)
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
