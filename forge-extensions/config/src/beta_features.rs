//! Beta Features Service
//!
//! Provides feature flag functionality with:
//! - Config file (TOML) for feature definitions (name, description, maturity)
//! - Database for enabled/disabled state per feature
//!
//! Usage:
//! ```rust
//! if services.beta_features.is_enabled("my_feature").await? {
//!     // Feature-specific logic
//! }
//! ```

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::path::PathBuf;
use ts_rs::TS;

/// A beta feature with merged config + state
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct BetaFeature {
    pub id: String,
    pub name: String,
    pub description: String,
    pub maturity: FeatureMaturity,
    pub enabled: bool,
}

/// Feature maturity level
#[derive(Debug, Clone, Serialize, Deserialize, TS, Default, PartialEq)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum FeatureMaturity {
    #[default]
    Experimental,
    Beta,
    Stable,
}

impl From<&str> for FeatureMaturity {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "beta" => FeatureMaturity::Beta,
            "stable" => FeatureMaturity::Stable,
            _ => FeatureMaturity::Experimental,
        }
    }
}

/// Parsed from TOML config file
#[derive(Debug, Deserialize)]
struct BetaFeaturesConfig {
    #[serde(default)]
    features: HashMap<String, FeatureDefinition>,
}

/// Feature definition from config file
#[derive(Debug, Deserialize)]
struct FeatureDefinition {
    name: String,
    description: String,
    #[serde(default)]
    maturity: String,
}

/// Service for managing beta features
pub struct BetaFeaturesService {
    pool: SqlitePool,
    config_path: PathBuf,
}

impl BetaFeaturesService {
    /// Create a new BetaFeaturesService
    pub fn new(pool: SqlitePool, config_path: PathBuf) -> Self {
        Self { pool, config_path }
    }

    /// Ensure the database table exists
    pub async fn ensure_table(&self) -> Result<()> {
        sqlx::query(
            r#"CREATE TABLE IF NOT EXISTS forge_beta_feature_state (
                feature_id TEXT PRIMARY KEY,
                enabled INTEGER NOT NULL DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"#,
        )
        .execute(&self.pool)
        .await
        .context("Failed to create forge_beta_feature_state table")?;

        Ok(())
    }

    /// Load feature definitions from config file
    fn load_config(&self) -> Result<BetaFeaturesConfig> {
        if !self.config_path.exists() {
            tracing::debug!(
                "Beta features config not found at {:?}, returning empty config",
                self.config_path
            );
            return Ok(BetaFeaturesConfig {
                features: HashMap::new(),
            });
        }

        let content = std::fs::read_to_string(&self.config_path)
            .with_context(|| format!("Failed to read beta features config: {:?}", self.config_path))?;

        let config: BetaFeaturesConfig = toml::from_str(&content)
            .with_context(|| format!("Failed to parse beta features config: {:?}", self.config_path))?;

        Ok(config)
    }

    /// Load enabled states from database
    async fn load_states(&self) -> Result<HashMap<String, bool>> {
        let rows: Vec<(String, i32)> =
            sqlx::query_as("SELECT feature_id, enabled FROM forge_beta_feature_state")
                .fetch_all(&self.pool)
                .await?;

        Ok(rows.into_iter().map(|(id, enabled)| (id, enabled != 0)).collect())
    }

    /// List all beta features with their enabled states
    pub async fn list(&self) -> Result<Vec<BetaFeature>> {
        let config = self.load_config()?;
        let states = self.load_states().await?;

        let features: Vec<BetaFeature> = config
            .features
            .into_iter()
            .map(|(id, def)| BetaFeature {
                enabled: states.get(&id).copied().unwrap_or(false),
                id,
                name: def.name,
                description: def.description,
                maturity: FeatureMaturity::from(def.maturity.as_str()),
            })
            .collect();

        Ok(features)
    }

    /// Check if a feature is enabled
    pub async fn is_enabled(&self, feature_id: &str) -> Result<bool> {
        // First check if feature exists in config
        let config = self.load_config()?;
        if !config.features.contains_key(feature_id) {
            tracing::warn!(
                "Beta feature '{}' not found in config, returning false",
                feature_id
            );
            return Ok(false);
        }

        // Check database state
        let row: Option<(i32,)> =
            sqlx::query_as("SELECT enabled FROM forge_beta_feature_state WHERE feature_id = ?")
                .bind(feature_id)
                .fetch_optional(&self.pool)
                .await?;

        Ok(row.map(|(enabled,)| enabled != 0).unwrap_or(false))
    }

    /// Set a feature's enabled state
    pub async fn set_enabled(&self, feature_id: &str, enabled: bool) -> Result<()> {
        // Verify feature exists in config
        let config = self.load_config()?;
        if !config.features.contains_key(feature_id) {
            anyhow::bail!("Beta feature '{}' not found in config", feature_id);
        }

        sqlx::query(
            r#"INSERT INTO forge_beta_feature_state (feature_id, enabled, updated_at)
               VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(feature_id) DO UPDATE SET
                   enabled = excluded.enabled,
                   updated_at = CURRENT_TIMESTAMP"#,
        )
        .bind(feature_id)
        .bind(if enabled { 1 } else { 0 })
        .execute(&self.pool)
        .await?;

        tracing::info!(
            "Beta feature '{}' {} by user",
            feature_id,
            if enabled { "enabled" } else { "disabled" }
        );

        Ok(())
    }

    /// Toggle a feature's enabled state and return the updated feature
    pub async fn toggle(&self, feature_id: &str) -> Result<BetaFeature> {
        let config = self.load_config()?;
        let def = config
            .features
            .get(feature_id)
            .ok_or_else(|| anyhow::anyhow!("Beta feature '{}' not found in config", feature_id))?;

        let current_state = self.is_enabled(feature_id).await?;
        let new_state = !current_state;

        self.set_enabled(feature_id, new_state).await?;

        Ok(BetaFeature {
            id: feature_id.to_string(),
            name: def.name.clone(),
            description: def.description.clone(),
            maturity: FeatureMaturity::from(def.maturity.as_str()),
            enabled: new_state,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    async fn setup_pool() -> SqlitePool {
        SqlitePool::connect("sqlite::memory:")
            .await
            .expect("failed to create in-memory sqlite pool")
    }

    fn create_test_config() -> NamedTempFile {
        let mut file = NamedTempFile::new().expect("failed to create temp file");
        writeln!(
            file,
            r#"
[features.test_feature]
name = "Test Feature"
description = "A test feature"
maturity = "experimental"

[features.beta_feature]
name = "Beta Feature"
description = "A beta feature"
maturity = "beta"
"#
        )
        .expect("failed to write config");
        file
    }

    #[tokio::test]
    async fn test_list_features() {
        let pool = setup_pool().await;
        let config_file = create_test_config();
        let service = BetaFeaturesService::new(pool, config_file.path().to_path_buf());

        service.ensure_table().await.expect("should create table");

        let features = service.list().await.expect("should list features");
        assert_eq!(features.len(), 2);

        let test_feature = features.iter().find(|f| f.id == "test_feature").unwrap();
        assert_eq!(test_feature.name, "Test Feature");
        assert_eq!(test_feature.maturity, FeatureMaturity::Experimental);
        assert!(!test_feature.enabled);
    }

    #[tokio::test]
    async fn test_toggle_feature() {
        let pool = setup_pool().await;
        let config_file = create_test_config();
        let service = BetaFeaturesService::new(pool, config_file.path().to_path_buf());

        service.ensure_table().await.expect("should create table");

        // Initially disabled
        assert!(!service.is_enabled("test_feature").await.unwrap());

        // Toggle on
        let feature = service.toggle("test_feature").await.expect("should toggle");
        assert!(feature.enabled);
        assert!(service.is_enabled("test_feature").await.unwrap());

        // Toggle off
        let feature = service.toggle("test_feature").await.expect("should toggle");
        assert!(!feature.enabled);
        assert!(!service.is_enabled("test_feature").await.unwrap());
    }

    #[tokio::test]
    async fn test_unknown_feature_returns_false() {
        let pool = setup_pool().await;
        let config_file = create_test_config();
        let service = BetaFeaturesService::new(pool, config_file.path().to_path_buf());

        service.ensure_table().await.expect("should create table");

        assert!(!service.is_enabled("nonexistent_feature").await.unwrap());
    }

    #[tokio::test]
    async fn test_missing_config_file() {
        let pool = setup_pool().await;
        let service = BetaFeaturesService::new(pool, PathBuf::from("/nonexistent/path.toml"));

        service.ensure_table().await.expect("should create table");

        let features = service.list().await.expect("should return empty list");
        assert!(features.is_empty());
    }
}
