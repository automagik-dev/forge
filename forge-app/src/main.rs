//! Forge App - Main composition layer

mod services;

use forge_omni::{OmniService, OmniConfig};
use forge_branch_templates::BranchTemplateService;
use forge_config::ConfigService;
use forge_genie::GenieService;
use services::task_service::ForgeTaskService;
use sqlx::SqlitePool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Forge App starting...");

    // TODO: Set up database connection
    // For now, we'll create a dummy pool for demonstration
    // let db_pool = SqlitePool::connect("sqlite::memory:").await?;

    // Initialize extension services
    let omni_config = OmniConfig {
        enabled: true,
        host: Some("https://omni.example.com".to_string()),
        api_key: Some("dummy-key".to_string()),
        instance: Some("default".to_string()),
        recipient: Some("user@example.com".to_string()),
        recipient_type: Some(forge_omni::RecipientType::PhoneNumber),
    };
    let _omni_service = OmniService::new(omni_config);
    let _branch_template_service = BranchTemplateService::new();
    let _config_service = ConfigService::new();
    let _genie_service = GenieService::new();

    // TODO: Initialize ForgeTaskService with database pool
    // let forge_task_service = ForgeTaskService::new(db_pool)
    //     .with_omni_service(omni_service);

    println!("All services initialized successfully");

    // TODO: Set up HTTP server and routing
    // TODO: Integrate with upstream services
    // TODO: Wire up database connections

    Ok(())
}