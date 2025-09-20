use anyhow::Result;
use forge_extensions_branch_templates::BranchTemplateService;
use forge_extensions_config::ForgeConfigV7;
use forge_extensions_genie::GenieIntegration;
use forge_extensions_omni::{types::OmniConfig, OmniService};
use services::services::config::Config as UpstreamConfig;

#[allow(dead_code)]
pub struct ForgeServices {
    pub upstream_config: UpstreamConfig,
    pub forge_config: ForgeConfigV7,
    pub branch_templates: BranchTemplateService,
    pub genie: GenieIntegration,
    pub omni: OmniService,
}

impl ForgeServices {
    pub async fn initialize() -> Result<Self> {
        let forge_config = ForgeConfigV7::default();

        let mut upstream_config = UpstreamConfig::default();
        upstream_config.omni = OmniConfig::default();

        let branch_templates = BranchTemplateService::new();
        let genie = GenieIntegration::new();
        let omni = OmniService::new(OmniConfig::default());

        Ok(Self {
            upstream_config,
            forge_config,
            branch_templates,
            genie,
            omni,
        })
    }
}
