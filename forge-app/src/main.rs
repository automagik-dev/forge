use anyhow::Result;
use forge_extensions_branch_templates::BranchTemplateService;
use forge_extensions_config::ForgeConfig;
use forge_extensions_genie::GenieIntegration;
use forge_extensions_omni::{types::OmniConfig, OmniService};

mod router;
mod services;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let omni = OmniService::new(OmniConfig::default());
    let branch_templates = BranchTemplateService::new();
    let _config = ForgeConfig::new();
    let _genie = GenieIntegration::new();

    let app = router::build_router(omni, branch_templates);

    axum::Server::bind(&"0.0.0.0:3000".parse()?)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
