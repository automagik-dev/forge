mod router;
mod services;

use anyhow::Result;
use router::build_router;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    info!("starting forge composition layer");

    let app_state = services::ForgeServices::initialize().await?;
    let _app = build_router(app_state);

    Ok(())
}
