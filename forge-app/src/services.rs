use std::{path::PathBuf, sync::Arc};

use anyhow::Result;
use forge_extensions_branch_templates::BranchTemplateStore;
use forge_extensions_config as config;
use forge_extensions_omni::{OmniInstance, OmniService};
use server::DeploymentImpl;
use sqlx::SqlitePool;
use tracing::info;
use uuid::Uuid;

use deployment::Deployment;
use utils::assets::config_path as upstream_config_path;

/// Shared forge-specific services composed with upstream functionality.
pub struct ForgeServices {
    deployment: DeploymentImpl,
    branch_templates: BranchTemplateStore,
    omni: OmniService,
    _forge_config: config::ForgeConfig,
    _config_path: PathBuf,
}

impl ForgeServices {
    /// Bootstrap all forge services, running migrations and loading configuration.
    pub async fn bootstrap() -> Result<Arc<Self>> {
        let deployment = DeploymentImpl::new().await?;
        let pool: SqlitePool = deployment.db().pool.clone();

        let mut migrator = sqlx::migrate!("./migrations");
        migrator.set_ignore_missing(true);
        migrator.run(&pool).await?;

        let branch_templates = BranchTemplateStore::new(pool);

        let forge_config = {
            let guard = deployment.config().read().await;
            guard.clone()
        };
        config::validate(&forge_config)?;

        let omni_service = OmniService::new(forge_config.omni.clone());
        if !omni_service.is_enabled() {
            info!("omni integration disabled (no host configured)");
        }

        Ok(Arc::new(Self {
            deployment,
            branch_templates,
            omni: omni_service,
            _forge_config: forge_config,
            _config_path: upstream_config_path(),
        }))
    }

    pub async fn list_omni_instances(&self) -> Result<Vec<OmniInstance>> {
        self.omni.list_instances().await
    }

    pub async fn get_branch_template(&self, task_id: Uuid) -> Result<Option<String>, sqlx::Error> {
        self.branch_templates.fetch(task_id).await
    }

    pub async fn set_branch_template(
        &self,
        task_id: Uuid,
        template: &str,
    ) -> Result<(), sqlx::Error> {
        self.branch_templates.upsert(task_id, template).await
    }

    pub async fn clear_branch_template(&self, task_id: Uuid) -> Result<(), sqlx::Error> {
        self.branch_templates.clear(task_id).await
    }

    pub async fn generate_branch_name(
        &self,
        task_id: Uuid,
        task_title: &str,
        attempt_id: &Uuid,
    ) -> Result<String, sqlx::Error> {
        let template = self.branch_templates.fetch(task_id).await?;
        Ok(forge_extensions_branch_templates::generate_branch_name(
            template.as_deref(),
            task_title,
            attempt_id,
        ))
    }

    pub fn deployment(&self) -> &DeploymentImpl {
        &self.deployment
    }
}
