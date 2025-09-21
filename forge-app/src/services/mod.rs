use anyhow::Result;
use forge_extensions_branch_templates as branch_templates;
use forge_extensions_config as config;
use forge_extensions_genie as genie;
use forge_extensions_omni as omni;
use tracing::info;

pub fn bootstrap_extensions() -> Result<()> {
    let cfg = config::ForgeConfig { version: 7 };
    config::validate(&cfg)?;

    let omni_settings = omni::OmniSettings { enabled: false };
    omni::init(&omni_settings);

    let template = branch_templates::BranchTemplate::example();
    info!(?template, "branch template scaffold available");

    let genie_output = genie::connect(&genie::GenieConfig {
        provider: "placeholder".into(),
    })?;
    info!(%genie_output, "genie scaffold connected");

    Ok(())
}
