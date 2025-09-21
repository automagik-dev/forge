use forge_extensions_omni::{OmniConfig, OmniService};
// Temporarily comment out branch_templates until we can properly initialize SQLitePool
// use forge_extensions_branch_templates::BranchTemplateStore;
use forge_extensions_genie::GenieService;

pub struct ForgeServices {
    pub omni: OmniService,
    // pub branch_templates: BranchTemplateStore,
    pub genie: GenieService,
}

impl ForgeServices {
    pub fn new() -> Self {
        // Initialize with default config for now
        // In production, these would be initialized with proper configs and DB connections
        let omni_config = OmniConfig {
            enabled: false,
            host: Some("http://localhost:8080".to_string()),
            api_key: None,
            instance: None,
            recipient: None,
            recipient_type: None,
        };

        // Placeholder DB pool - in production would be a real SQLite connection
        // For now, we'll skip the branch template store initialization
        // let pool = SqlitePool::connect("sqlite::memory:").await?;

        Self {
            omni: OmniService::new(omni_config),
            // branch_templates: BranchTemplateStore::new(pool),
            genie: GenieService::new("genie/wishes".to_string()),
        }
    }

    pub fn new_with_config(omni_config: OmniConfig, wishes_dir: String) -> Self {
        Self {
            omni: OmniService::new(omni_config),
            // branch_templates: BranchTemplateStore::new(pool),
            genie: GenieService::new(wishes_dir),
        }
    }
}