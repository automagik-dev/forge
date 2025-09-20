pub mod task_service;

use anyhow::Result;
use forge_branch_templates::BranchTemplateService;
use forge_omni::{OmniConfig, OmniService};
use sqlx::{Pool, Sqlite};

pub struct ForgeServices {
    pub task_service: task_service::ForgeTaskService,
    pub branch_templates: BranchTemplateService,
    pub omni: Option<OmniService>,
    pub extensions_db: Pool<Sqlite>,
}

impl ForgeServices {
    pub async fn new() -> Result<Self> {
        // Initialize database pool for auxiliary tables
        let extensions_db = sqlx::SqlitePool::connect("sqlite:forge_extensions.db").await?;

        // Run migrations for auxiliary tables
        sqlx::migrate!("./migrations")
            .run(&extensions_db)
            .await?;

        // Initialize upstream services
        // Note: In a real implementation, these would come from the upstream crate
        // For now, we're setting up the structure

        // Initialize branch templates service
        let branch_templates = BranchTemplateService::new(extensions_db.clone());

        // Initialize Omni service if configured
        let omni = if let Ok(config_str) = std::env::var("FORGE_OMNI_CONFIG") {
            let config: OmniConfig = serde_json::from_str(&config_str)?;
            if config.enabled {
                Some(OmniService::new(config))
            } else {
                None
            }
        } else {
            None
        };

        // Initialize task service with composition
        let task_service = task_service::ForgeTaskService::new(
            extensions_db.clone(),
            branch_templates.clone(),
            omni.clone(),
        );

        Ok(Self {
            task_service,
            branch_templates,
            omni,
            extensions_db,
        })
    }
}