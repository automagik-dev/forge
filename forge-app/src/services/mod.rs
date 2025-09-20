use std::path::PathBuf;
use anyhow::Result;
use sqlx::SqlitePool;

use forge_omni::{OmniService, OmniConfig};
use forge_branch_templates::BranchTemplateService;
use forge_config::ForgeConfigService;
use forge_genie::GenieService;

/// Main services container that composes upstream and forge services
#[derive(Clone)]
pub struct ForgeServices {
    // Forge extensions
    omni: OmniService,
    branch_templates: BranchTemplateService,
    config: ForgeConfigService,
    genie: GenieService,

    // Database connection for auxiliary tables
    extensions_db: SqlitePool,

    // Project root path
    project_root: PathBuf,
}

impl ForgeServices {
    /// Initialize all forge services
    pub async fn new(config_path: PathBuf) -> Result<Self> {
        // Load forge configuration
        let config_service = ForgeConfigService::load_from_file(&config_path).await?;
        let forge_config = config_service.config();

        // Initialize database connection for auxiliary tables
        // For now, we'll use the same database as upstream but with auxiliary tables
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "sqlite:forge_extensions.db".to_string());

        let extensions_db = SqlitePool::connect(&database_url).await?;

        // Run migrations for auxiliary tables
        sqlx::migrate!("./migrations").run(&extensions_db).await?;

        // Initialize Omni service
        let omni_config = forge_config.omni_config().cloned()
            .unwrap_or_else(|| OmniConfig::default());
        let omni = OmniService::new(omni_config);

        // Initialize branch templates service
        let branch_templates = BranchTemplateService::new(extensions_db.clone());

        // Initialize Genie service
        let project_root = std::env::current_dir()?;
        let genie_config = forge_genie::GenieConfig::default();
        let genie = GenieService::new(genie_config, project_root.clone());

        Ok(Self {
            omni,
            branch_templates,
            config: config_service,
            genie,
            extensions_db,
            project_root,
        })
    }

    /// Get Omni service
    pub fn omni(&self) -> &OmniService {
        &self.omni
    }

    /// Get branch templates service
    pub fn branch_templates(&self) -> &BranchTemplateService {
        &self.branch_templates
    }

    /// Get config service
    pub fn config(&self) -> &ForgeConfigService {
        &self.config
    }

    /// Get Genie service
    pub fn genie(&self) -> &GenieService {
        &self.genie
    }

    /// Get extensions database pool
    pub fn extensions_db(&self) -> &SqlitePool {
        &self.extensions_db
    }

    /// Get project root path
    pub fn project_root(&self) -> &PathBuf {
        &self.project_root
    }

    /// Check if all forge services are properly configured and enabled
    pub async fn validate_configuration(&self) -> Result<bool> {
        // Validate Genie setup
        if !self.genie.validate_setup().await? {
            tracing::warn!("Genie integration is not properly set up");
        }

        // Check if Omni is configured
        if self.config.config().is_omni_enabled() {
            tracing::info!("Omni notifications are enabled");
        } else {
            tracing::info!("Omni notifications are disabled");
        }

        // Validate database connection
        sqlx::query("SELECT 1").fetch_optional(&self.extensions_db).await?;

        Ok(true)
    }
}

// Future service composition patterns will be added here:
// - ForgeTaskService (wrapping upstream TaskService with forge extensions)
// - ForgeProjectService (wrapping upstream ProjectService with forge settings)
// - ForgeConfigService (extending upstream config with forge features)

/* Example of how service composition will work:

pub struct ForgeTaskService {
    upstream: upstream::services::TaskService,
    branch_templates: BranchTemplateService,
    omni: OmniService,
    extensions_db: SqlitePool,
}

impl ForgeTaskService {
    pub async fn create_task(&self, data: CreateTaskRequest) -> Result<Task> {
        // Create task via upstream
        let task = self.upstream.create_task(data.core).await?;

        // Store forge extensions in auxiliary table
        if let Some(template) = data.branch_template {
            self.branch_templates.set_template(task.id, Some(template)).await?;
        }

        // Trigger Omni notification if enabled
        if data.notify_omni {
            self.omni.send_task_notification(
                &task.title,
                "created",
                Some(&format!("/tasks/{}", task.id))
            ).await?;
        }

        Ok(task)
    }

    pub async fn get_task_with_extensions(&self, task_id: Uuid) -> Result<EnhancedTask> {
        // Get base task from upstream
        let task = self.upstream.get_task(task_id).await?;

        // Get forge extensions
        let branch_template = self.branch_templates.get_template(task_id).await?;

        Ok(EnhancedTask {
            task,
            branch_template,
        })
    }
}

*/