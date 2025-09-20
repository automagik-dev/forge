use anyhow::{self, Error as AnyhowError};
use sqlx::Error as SqlxError;
use std::path::Path;
use thiserror::Error;
use tracing_subscriber::{EnvFilter, prelude::*};

mod services;
mod routes;

use services::deployment::ForgeDeployment;

#[derive(Debug, Error)]
pub enum ForgeError {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Sqlx(#[from] SqlxError),
    #[error(transparent)]
    Other(#[from] AnyhowError),
}

#[tokio::main]
async fn main() -> Result<(), ForgeError> {
    let log_level = std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string());
    let filter_string = format!(
        "warn,forge_app={level},forge_omni={level},forge_branch_templates={level},forge_config={level},forge_genie={level}",
        level = log_level
    );
    let env_filter = EnvFilter::try_new(filter_string).expect("Failed to create tracing filter");
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().with_filter(env_filter))
        .init();

    // Initialize database with migrations
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:forge.db".to_string());
    let db_pool = sqlx::SqlitePool::connect(&database_url).await?;

    // Run migrations
    let migrations_path = Path::new("migrations");
    if migrations_path.exists() {
        match sqlx::migrate!("./migrations").run(&db_pool).await {
            Ok(_) => {},
            Err(e) => {
                tracing::warn!("Migration failed: {}", e);
            }
        }
    }

    // Create deployment service
    let deployment = ForgeDeployment::new(db_pool).await?;

    // Set up routes
    let app_router = routes::create_router(deployment);

    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(3000);

    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let listener = tokio::net::TcpListener::bind(format!("{host}:{port}")).await?;
    let actual_port = listener.local_addr()?.port();

    tracing::info!("Forge app running on http://{host}:{actual_port}");

    axum::serve(listener, app_router).await?;
    Ok(())
}