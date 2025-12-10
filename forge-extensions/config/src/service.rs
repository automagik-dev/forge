use anyhow::Result;
use forge_omni::OmniConfig;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::types::{ForgeProjectSettings, ProjectConfig};

pub struct ForgeConfigService {
    pool: SqlitePool,
}

impl ForgeConfigService {
    pub const GLOBAL_PROJECT_ID: Uuid = Uuid::nil();

    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn get_project_config(&self, project_id: Uuid) -> Result<Option<ProjectConfig>> {
        let record: Option<ProjectConfigRow> = sqlx::query_as(
            r#"SELECT
                project_id,
                custom_executors,
                forge_config
               FROM forge_project_settings
               WHERE project_id = ?"#,
        )
        .bind(project_id)
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = record {
            Ok(Some(ProjectConfig {
                project_id: row.project_id,
                custom_executors: row
                    .custom_executors
                    .and_then(|s| serde_json::from_str(&s).ok()),
                forge_config: row.forge_config.and_then(|s| serde_json::from_str(&s).ok()),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn set_project_config(&self, config: &ProjectConfig) -> Result<()> {
        let custom_executors_json = config
            .custom_executors
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        let forge_config_json = config
            .forge_config
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT OR REPLACE INTO forge_project_settings (project_id, custom_executors, forge_config) VALUES (?, ?, ?)"
        )
        .bind(config.project_id)
        .bind(custom_executors_json)
        .bind(forge_config_json)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_forge_settings(&self, project_id: Uuid) -> Result<ForgeProjectSettings> {
        if let Some(config) = self.get_project_config(project_id).await?
            && let Some(forge_config) = config.forge_config
            && let Ok(settings) = serde_json::from_value::<ForgeProjectSettings>(forge_config)
        {
            return Ok(settings);
        }

        Ok(ForgeProjectSettings::default())
    }

    pub async fn set_forge_settings(
        &self,
        project_id: Uuid,
        settings: &ForgeProjectSettings,
    ) -> Result<()> {
        let forge_config_value = serde_json::to_value(settings)?;

        // Get existing config or create new one
        let mut config = self
            .get_project_config(project_id)
            .await?
            .unwrap_or_else(|| ProjectConfig {
                project_id,
                custom_executors: None,
                forge_config: None,
            });

        config.forge_config = Some(forge_config_value);

        self.set_project_config(&config).await
    }

    pub async fn get_global_settings(&self) -> Result<ForgeProjectSettings> {
        // Read from forge_global_settings table
        let row: Option<(String,)> =
            sqlx::query_as("SELECT forge_config FROM forge_global_settings WHERE id = 1")
                .fetch_optional(&self.pool)
                .await?;

        if let Some((config_str,)) = row
            && let Ok(settings) = serde_json::from_str::<ForgeProjectSettings>(&config_str)
        {
            return Ok(settings);
        }

        Ok(ForgeProjectSettings::default())
    }

    pub async fn set_global_settings(&self, settings: &ForgeProjectSettings) -> Result<()> {
        // Write to forge_global_settings table
        let config_json = serde_json::to_string(settings)?;

        sqlx::query(
            "INSERT INTO forge_global_settings (id, forge_config) VALUES (1, ?)
             ON CONFLICT(id) DO UPDATE SET forge_config = excluded.forge_config",
        )
        .bind(config_json)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn effective_omni_config(&self, project_id: Option<Uuid>) -> Result<OmniConfig> {
        let global_settings = self.get_global_settings().await?;
        let mut config = global_settings.omni_config.clone().unwrap_or_default();
        config.enabled = global_settings.omni_enabled;

        if let Some(project_id) = project_id
            && let Some(project_config) = self.get_project_config(project_id).await?
            && let Some(value) = project_config.forge_config.clone()
            && let Ok(project_settings) = serde_json::from_value::<ForgeProjectSettings>(value)
        {
            let mut project_omni = project_settings
                .omni_config
                .unwrap_or_else(|| config.clone());
            project_omni.enabled = project_settings.omni_enabled;
            config = project_omni;
        }

        Ok(config)
    }
}

// Helper struct for database queries
#[derive(Debug, sqlx::FromRow)]
struct ProjectConfigRow {
    project_id: Uuid,
    custom_executors: Option<String>,
    forge_config: Option<String>,
}

#[cfg(test)]
mod tests {
    use forge_omni::{OmniConfig, RecipientType};

    use super::*;

    async fn setup_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("failed to create in-memory sqlite pool");

        // Create forge_global_settings table
        sqlx::query(
            r#"CREATE TABLE forge_global_settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    forge_config TEXT NOT NULL DEFAULT '{}',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )"#,
        )
        .execute(&pool)
        .await
        .expect("failed to create forge_global_settings table for tests");

        // Initialize global settings row
        sqlx::query("INSERT INTO forge_global_settings (id, forge_config) VALUES (1, '{}')")
            .execute(&pool)
            .await
            .expect("failed to initialize global settings row");

        // Create forge_project_settings table
        sqlx::query(
            r#"CREATE TABLE forge_project_settings (
                    project_id TEXT PRIMARY KEY,
                    custom_executors TEXT,
                    forge_config TEXT
                )"#,
        )
        .execute(&pool)
        .await
        .expect("failed to create forge_project_settings table for tests");

        pool
    }

    #[tokio::test]
    async fn round_trips_global_settings() {
        let pool = setup_pool().await;
        let service = ForgeConfigService::new(pool);

        // defaults
        let mut settings = service
            .get_global_settings()
            .await
            .expect("default settings should load");
        assert!(!settings.omni_enabled);
        assert!(settings.omni_config.is_none());

        settings.omni_enabled = true;
        settings.omni_config = Some(OmniConfig {
            enabled: true,
            host: Some("https://omni.test".into()),
            api_key: Some("secret".into()),
            instance: Some("forge".into()),
            recipient: Some("+14155552671".into()),
            recipient_type: Some(RecipientType::PhoneNumber),
        });

        service
            .set_global_settings(&settings)
            .await
            .expect("should persist global settings");

        let fetched = service
            .get_global_settings()
            .await
            .expect("should load stored global settings");

        assert!(fetched.omni_enabled);
        assert_eq!(
            fetched.omni_config.unwrap().instance.as_deref(),
            Some("forge")
        );
    }

    #[tokio::test]
    async fn project_overrides_effective_omni_config() {
        let pool = setup_pool().await;
        let service = ForgeConfigService::new(pool);

        let project_id = Uuid::new_v4();

        let global = ForgeProjectSettings {
            omni_enabled: true,
            omni_config: Some(OmniConfig {
                enabled: true,
                host: Some("https://global.omni".into()),
                api_key: Some("global-key".into()),
                instance: Some("global".into()),
                recipient: Some("global-recipient".into()),
                recipient_type: Some(RecipientType::PhoneNumber),
            }),
        };
        service
            .set_global_settings(&global)
            .await
            .expect("global settings should persist");

        let project = ForgeProjectSettings {
            omni_enabled: true,
            omni_config: Some(OmniConfig {
                enabled: true,
                host: Some("https://project.omni".into()),
                api_key: Some("project-key".into()),
                instance: Some("project".into()),
                recipient: Some("project-recipient".into()),
                recipient_type: Some(RecipientType::UserId),
            }),
        };
        service
            .set_forge_settings(project_id, &project)
            .await
            .expect("project settings should persist");

        let config = service
            .effective_omni_config(Some(project_id))
            .await
            .expect("effective omni config should resolve");

        assert_eq!(config.host.as_deref(), Some("https://project.omni"));
        assert_eq!(config.api_key.as_deref(), Some("project-key"));
        assert_eq!(config.instance.as_deref(), Some("project"));
        assert_eq!(config.recipient.as_deref(), Some("project-recipient"));
        assert!(matches!(config.recipient_type, Some(RecipientType::UserId)));
    }

    #[tokio::test]
    async fn forge_global_settings_singleton_constraint() {
        let pool = setup_pool().await;

        // Try to insert a second global settings row (should fail due to CHECK constraint)
        let result =
            sqlx::query("INSERT INTO forge_global_settings (id, forge_config) VALUES (2, '{}')")
                .execute(&pool)
                .await;

        assert!(
            result.is_err(),
            "Should not allow multiple global settings rows"
        );
    }

    #[tokio::test]
    async fn forge_global_settings_has_default_row() {
        let pool = setup_pool().await;

        // Verify the default row exists
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM forge_global_settings")
            .fetch_one(&pool)
            .await
            .expect("should count rows");

        assert_eq!(count, 1, "Should have exactly one global settings row");

        // Verify it's ID 1
        let id: i64 = sqlx::query_scalar("SELECT id FROM forge_global_settings")
            .fetch_one(&pool)
            .await
            .expect("should fetch id");

        assert_eq!(id, 1, "Global settings row should have ID 1");
    }
}
