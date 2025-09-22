use std::{env, path::PathBuf, sync::Arc};

use anyhow::{Context, Result};
use forge_extensions_branch_templates::BranchTemplateStore;
use forge_extensions_config as config;
use forge_extensions_genie::{self as genie, GenieConfig};
use forge_extensions_omni::{OmniInstance, OmniService};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tracing::{info, warn};
use uuid::Uuid;

const DEFAULT_DATABASE_URL: &str = "sqlite://dev_assets_seed/forge-snapshot/forge.sqlite";
const DEFAULT_CONFIG_PATH: &str = "dev_assets/config.json";

/// Shared forge-specific services composed with upstream functionality.
pub struct ForgeServices {
    _pool: SqlitePool,
    branch_templates: BranchTemplateStore,
    omni: OmniService,
    genie_config: GenieConfig,
    _forge_config: config::ForgeConfig,
    _config_path: PathBuf,
}

impl ForgeServices {
    /// Bootstrap all forge services, running migrations and loading configuration.
    pub async fn bootstrap() -> Result<Arc<Self>> {
        let database_url =
            env::var("DATABASE_URL").unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_string());
        let config_path = env::var("FORGE_CONFIG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(DEFAULT_CONFIG_PATH));

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .with_context(|| format!("failed to connect to database at {database_url}"))?;

        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .context("running forge migrations")?;

        let forge_config = config::load_config_from_file(&config_path).await;
        config::validate(&forge_config)?;

        let omni_service = OmniService::new(forge_config.omni.clone());
        if !omni_service.is_enabled() {
            info!("omni integration disabled (no host configured)");
        }

        let genie_config = GenieConfig {
            provider: env::var("FORGE_GENIE_PROVIDER").unwrap_or_else(|_| "claude".to_string()),
        };

        match genie::connect(&genie_config) {
            Ok(msg) => info!(%msg, "genie integration ready"),
            Err(err) => warn!(%err, "genie integration placeholder failed validation"),
        }

        let branch_templates = BranchTemplateStore::new(pool.clone());

        Ok(Arc::new(Self {
            _pool: pool,
            branch_templates,
            omni: omni_service,
            genie_config,
            _forge_config: forge_config,
            _config_path: config_path,
        }))
    }

    pub async fn list_omni_instances(&self) -> Result<Vec<OmniInstance>> {
        self.omni.list_instances().await
    }

    pub async fn get_branch_template(&self, task_id: Uuid) -> Result<Option<String>, sqlx::Error> {
        self.branch_templates.fetch(task_id).await
    }

    pub async fn list_genie_wishes(&self) -> Vec<String> {
        match genie::connect(&self.genie_config) {
            Ok(msg) => vec![msg],
            Err(err) => {
                warn!(%err, "genie wish listing returned placeholder error");
                vec![]
            }
        }
    }
}
