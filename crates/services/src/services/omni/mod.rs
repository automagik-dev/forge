pub mod client;
pub mod types;

use anyhow::{Context, Result};
use db::models::execution_process::{ExecutionContext, ExecutionProcessStatus};

pub use types::*;
use client::OmniClient;

/// Service for handling Omni notifications across WhatsApp, Discord, and Telegram
#[derive(Debug, Clone)]
pub struct OmniService {
    config: OmniConfig,
    client: OmniClient,
}

impl OmniService {
    /// Create a new OmniService instance
    pub fn new(config: OmniConfig) -> Result<Self> {
        let client = OmniClient::new(
            config.host.clone(),
            Some(config.api_key.clone()),
        )?;
        
        Ok(Self { config, client })
    }

    /// Send a task notification through Omni
    pub async fn send_task_notification(&self, ctx: &ExecutionContext) -> Result<()> {
        // Check if Omni is enabled
        if !self.config.enabled {
            tracing::debug!("Omni notifications are disabled");
            return Ok(());
        }

        // Check if instance and recipient are configured
        let instance = self.config.instance.as_ref()
            .context("No Omni instance configured")?;
        
        let recipient = self.config.recipient.as_ref()
            .context("No Omni recipient configured")?;

        // Format the notification message
        let message = self.format_task_message(ctx);

        // Send the message through the configured instance
        let response = self.client
            .send_text(&instance.id, recipient.clone(), message)
            .await
            .context("Failed to send Omni notification")?;

        if response.success {
            tracing::info!(
                "Sent Omni notification for task {} via {} to {}",
                ctx.task.id,
                instance.name,
                recipient.value
            );
        } else {
            let error_msg = response.error.unwrap_or_else(|| "Unknown error".to_string());
            tracing::error!(
                "Failed to send Omni notification for task {}: {}",
                ctx.task.id,
                error_msg
            );
            anyhow::bail!("Omni notification failed: {}", error_msg);
        }

        Ok(())
    }

    /// Format a task completion message
    fn format_task_message(&self, ctx: &ExecutionContext) -> String {
        let status_emoji = match ctx.execution_process.status {
            ExecutionProcessStatus::Completed => "✅",
            ExecutionProcessStatus::Failed => "❌",
            ExecutionProcessStatus::Killed => "🛑",
            _ => "🔄",
        };

        let status_text = match ctx.execution_process.status {
            ExecutionProcessStatus::Completed => "completed successfully",
            ExecutionProcessStatus::Failed => "failed",
            ExecutionProcessStatus::Killed => "was cancelled",
            _ => "is processing",
        };

        let branch_info = ctx.task_attempt.branch
            .as_ref()
            .map(|b| format!("\n📌 Branch: {}", b))
            .unwrap_or_default();

        let executor_info = format!("\n🤖 Executor: {}", ctx.task_attempt.executor);

        // For now, we'll construct URL without project ID since it's not in the context
        let url_info = format!("\n🔗 Task ID: {}", ctx.task.id);

        format!(
            "{} Task: {}\n\n🎯 Status: Task {}{}{}{}",
            status_emoji,
            ctx.task.title,
            status_text,
            branch_info,
            executor_info,
            url_info
        )
    }

    /// Test the Omni connection
    pub async fn test_connection(&self) -> Result<bool> {
        self.client.test_connection().await
    }

    /// List available Omni instances
    pub async fn list_instances(&self) -> Result<Vec<OmniInstance>> {
        self.client.list_instances().await
    }

    /// Send a custom message through Omni
    pub async fn send_custom_message(&self, message: String) -> Result<()> {
        // Check if Omni is enabled
        if !self.config.enabled {
            tracing::debug!("Omni notifications are disabled");
            return Ok(());
        }

        // Check if instance and recipient are configured
        let instance = self.config.instance.as_ref()
            .context("No Omni instance configured")?;
        
        let recipient = self.config.recipient.as_ref()
            .context("No Omni recipient configured")?;

        // Send the message
        let response = self.client
            .send_text(&instance.id, recipient.clone(), message)
            .await
            .context("Failed to send custom Omni message")?;

        if !response.success {
            let error_msg = response.error.unwrap_or_else(|| "Unknown error".to_string());
            anyhow::bail!("Failed to send custom message: {}", error_msg);
        }

        Ok(())
    }

    /// Check if the service is enabled
    pub fn is_enabled(&self) -> bool {
        self.config.enabled
    }

    /// Get the current configuration
    pub fn config(&self) -> &OmniConfig {
        &self.config
    }

    /// Update the configuration
    pub fn update_config(&mut self, config: OmniConfig) -> Result<()> {
        // Re-create the client with new configuration
        self.client = OmniClient::new(
            config.host.clone(),
            Some(config.api_key.clone()),
        )?;
        self.config = config;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> OmniConfig {
        OmniConfig {
            enabled: true,
            host: "https://omni.example.com".to_string(),
            api_key: "test-key".to_string(),
            instance: Some(OmniInstance {
                id: "test-instance".to_string(),
                name: "Test WhatsApp".to_string(),
                channel: ChannelType::WhatsApp,
                active: true,
                description: Some("Test instance".to_string()),
            }),
            recipient: Some(Recipient {
                recipient_type: RecipientType::PhoneNumber,
                value: "+1234567890".to_string(),
            }),
        }
    }

    #[test]
    fn test_service_creation() {
        let config = create_test_config();
        let service = OmniService::new(config);
        assert!(service.is_ok());
    }

    #[test]
    fn test_service_enabled_check() {
        let mut config = create_test_config();
        config.enabled = false;
        
        let service = OmniService::new(config).unwrap();
        assert!(!service.is_enabled());
    }

    #[test]
    fn test_config_update() {
        let config = create_test_config();
        let mut service = OmniService::new(config).unwrap();
        
        let mut new_config = create_test_config();
        new_config.host = "https://new-omni.example.com".to_string();
        
        let result = service.update_config(new_config);
        assert!(result.is_ok());
        assert_eq!(service.config().host, "https://new-omni.example.com");
    }
}