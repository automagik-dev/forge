mod router;
mod services;

use std::{net::SocketAddr, sync::Arc};

use anyhow::{Context, Result};
use deployment::Deployment;
use router::create_router;
use serde_json::json;
use services::ForgeServices;
use strip_ansi_escapes::strip;
use tracing::info;
use tracing_subscriber::{prelude::*, EnvFilter};
use utils::{
    assets::asset_dir, browser::open_browser, port_file::write_port_file, sentry::sentry_layer,
};

const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_PORT: u16 = 8887;

#[tokio::main]
async fn main() -> Result<()> {
    init_tracing();

    if !asset_dir().exists() {
        std::fs::create_dir_all(asset_dir())?;
    }

    let services = ForgeServices::bootstrap().await?;
    initialise_deployment(&services).await?;

    let router = create_router(Arc::clone(&services));

    let (host, port) = resolve_host_and_port()?;
    let listener = tokio::net::TcpListener::bind((host.as_str(), port))
        .await
        .with_context(|| format!("failed to bind forge-app listener on {host}:{port}"))?;

    let actual_port = listener.local_addr()?.port();
    if let Err(e) = write_port_file(actual_port).await {
        tracing::warn!("Failed to write port file: {}", e);
    }

    info!(address = %format!("{host}:{actual_port}"), "forge-app listening");

    if !cfg!(debug_assertions) {
        let port = actual_port;
        tokio::spawn(async move {
            if let Err(e) = open_browser(&format!("http://127.0.0.1:{port}")).await {
                tracing::warn!(
                    "Failed to open browser automatically: {}. Please open http://127.0.0.1:{} manually.",
                    e,
                    port
                );
            }
        });
    }

    axum::serve(listener, router).await?;
    Ok(())
}

fn init_tracing() {
    let log_level = std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string());
    let filter_string = format!(
        "warn,forge_app={level},server={level},services={level},db={level},executors={level},deployment={level},local_deployment={level},utils={level}",
        level = log_level
    );
    let env_filter = EnvFilter::try_new(filter_string).expect("Failed to create tracing filter");

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().with_filter(env_filter))
        .with(sentry_layer())
        .init();
}

async fn initialise_deployment(services: &ForgeServices) -> Result<()> {
    let deployment = services.deployment();

    deployment.update_sentry_scope().await?;
    deployment.cleanup_orphan_executions().await?;
    deployment.backfill_before_head_commits().await?;
    deployment.spawn_pr_monitor_service().await;
    deployment
        .track_if_analytics_allowed("session_start", json!({}))
        .await;

    let deployment_for_cache = deployment.clone();
    tokio::spawn(async move {
        if let Err(e) = deployment_for_cache
            .file_search_cache()
            .warm_most_active(&deployment_for_cache.db().pool, 3)
            .await
        {
            tracing::warn!("Failed to warm file search cache: {}", e);
        }
    });

    Ok(())
}

fn resolve_host_and_port() -> Result<(String, u16)> {
    if let Ok(addr) = std::env::var("FORGE_APP_ADDR") {
        let socket: SocketAddr = addr
            .parse()
            .with_context(|| format!("invalid FORGE_APP_ADDR value: {addr}"))?;
        return Ok((socket.ip().to_string(), socket.port()));
    }

    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|value| {
            let cleaned =
                String::from_utf8(strip(value.as_bytes())).expect("UTF-8 after stripping ANSI");
            cleaned.trim().parse::<u16>().ok()
        })
        .unwrap_or(DEFAULT_PORT);

    let host = std::env::var("HOST").unwrap_or_else(|_| DEFAULT_HOST.to_string());

    Ok((host, port))
}
