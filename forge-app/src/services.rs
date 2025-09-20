use sqlx::SqlitePool;
use std::sync::Arc;

// Placeholder for upstream services that would be imported
// In actual implementation, these would come from the upstream crate
mod upstream {
    pub mod services {
        pub struct TaskService;
        pub struct ProjectService;
    }
}

// Forge-specific services
pub struct ForgeTaskExtensionsService {
    db: SqlitePool,
}

impl ForgeTaskExtensionsService {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
    }

    pub async fn get_branch_template(&self, task_id: i64) -> Result<Option<String>, sqlx::Error> {
        sqlx::query_scalar!(
            "SELECT branch_template FROM forge_task_extensions WHERE task_id = ?",
            task_id
        )
        .fetch_optional(&self.db)
        .await
    }

    pub async fn set_branch_template(&self, task_id: i64, template: &str) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "INSERT INTO forge_task_extensions (task_id, branch_template) VALUES (?, ?)
             ON CONFLICT(task_id) DO UPDATE SET branch_template = excluded.branch_template",
            task_id,
            template
        )
        .execute(&self.db)
        .await?;
        Ok(())
    }
}

pub struct ForgeProjectSettingsService {
    db: SqlitePool,
}

impl ForgeProjectSettingsService {
    pub fn new(db: SqlitePool) -> Self {
        Self { db }
    }

    pub async fn get_forge_config(&self, project_id: i64) -> Result<Option<serde_json::Value>, sqlx::Error> {
        sqlx::query_scalar!(
            "SELECT forge_config FROM forge_project_settings WHERE project_id = ?",
            project_id
        )
        .fetch_optional(&self.db)
        .await
    }
}

// Composed service that wraps upstream with forge extensions
pub struct ForgeTaskService {
    upstream: upstream::services::TaskService,
    extensions: ForgeTaskExtensionsService,
    omni_service: Option<forge_omni::OmniService>,
}

impl ForgeTaskService {
    pub fn new(
        upstream: upstream::services::TaskService,
        extensions: ForgeTaskExtensionsService,
        omni_service: Option<forge_omni::OmniService>,
    ) -> Self {
        Self {
            upstream,
            extensions,
            omni_service,
        }
    }

    // Example of how forge features are composed with upstream
    pub async fn create_task_with_forge_features(
        &self,
        task_data: serde_json::Value, // Simplified for example
        branch_template: Option<String>,
    ) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        // First create the upstream task
        // let upstream_task = self.upstream.create_task(task_data).await?;

        // Then add forge extensions
        if let Some(template) = branch_template {
            // In real implementation, extract task_id from upstream_task
            let task_id = 1i64; // Placeholder
            self.extensions.set_branch_template(task_id, &template).await?;
        }

        // Return enhanced task data
        Ok(serde_json::json!({
            "task": "placeholder",
            "forge_extensions": {
                "branch_template": branch_template
            }
        }))
    }

    pub async fn send_task_completion_notification(
        &self,
        task_title: &str,
        task_status: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(omni) = &self.omni_service {
            omni.send_task_notification(
                task_title,
                task_status,
                None, // task_url
            ).await?;
        }
        Ok(())
    }
}

pub struct ForgeApp {
    pub db: SqlitePool,
    pub task_service: Arc<ForgeTaskService>,
    pub project_settings: Arc<ForgeProjectSettingsService>,
}

impl ForgeApp {
    pub async fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // Initialize database with migrations
        let db = SqlitePool::connect("sqlite::memory:").await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&db).await?;

        // Initialize upstream services (placeholder)
        let upstream_task_service = upstream::services::TaskService;

        // Initialize forge extensions
        let task_extensions = ForgeTaskExtensionsService::new(db.clone());
        let project_settings = ForgeProjectSettingsService::new(db.clone());

        // Initialize Omni service if configured
        let omni_service = None; // Would be initialized from config

        // Compose services
        let task_service = Arc::new(ForgeTaskService::new(
            upstream_task_service,
            task_extensions,
            omni_service,
        ));

        let project_settings = Arc::new(project_settings);

        Ok(Self {
            db,
            task_service,
            project_settings,
        })
    }
}