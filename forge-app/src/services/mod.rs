use anyhow::Result;
use forge_extensions_branch_templates as branch_templates;
use forge_extensions_config as config;
use forge_extensions_genie as genie;
use forge_extensions_omni as omni;
use tracing::info;

pub fn bootstrap_extensions() -> Result<()> {
    let cfg = config::ForgeConfig { version: 7 };
    config::validate(&cfg)?;

    let omni_service = omni::OmniService::new(omni::OmniConfig {
        enabled: false,
        host: None,
        api_key: None,
        instance: None,
        recipient: None,
        recipient_type: None,
    });
    let _ = omni_service.config.enabled;

    let template = branch_templates::BranchTemplate::example();
    info!(?template, "branch template scaffold available");

    let genie_output = genie::connect(&genie::GenieConfig {
        provider: "placeholder".into(),
    })?;
    info!(%genie_output, "genie scaffold connected");

    Ok(())
}
