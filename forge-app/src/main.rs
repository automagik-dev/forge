mod router;
pub mod services;

use anyhow::Result;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    let _ = tracing_subscriber::fmt::try_init();

    services::bootstrap_extensions()?;

    let router = router::create_router();
    info!("forge-app scaffold initialised; /health route ready");

    // Router serving will be wired in Task 2 once the composition layer is ready.
    let _ = router;

    Ok(())
}
