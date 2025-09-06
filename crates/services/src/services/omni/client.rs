use anyhow::{Context, Result};
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde_json::json;

use super::types::{
    ListInstancesResponse, OmniInstance, Recipient, SendTextResponse,
};

/// HTTP client for communicating with Omni API
#[derive(Debug, Clone)]
pub struct OmniClient {
    client: reqwest::Client,
    base_url: String,
    api_key: Option<String>,
}

impl OmniClient {
    /// Create a new OmniClient
    pub fn new(base_url: impl Into<String>, api_key: Option<String>) -> Result<Self> {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let client = reqwest::Client::builder()
            .default_headers(headers)
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .context("Failed to build HTTP client")?;

        Ok(Self {
            client,
            base_url: base_url.into(),
            api_key,
        })
    }

    /// List available Omni instances
    pub async fn list_instances(&self) -> Result<Vec<OmniInstance>> {
        let url = format!("{}/api/v1/instances/", self.base_url);
        
        let mut request = self.client.get(&url);
        
        // Add API key header if configured
        if let Some(api_key) = &self.api_key {
            request = request.header("X-API-Key", api_key);
        }

        let response = request
            .send()
            .await
            .context("Failed to send list instances request")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            anyhow::bail!("Failed to list instances: {} - {}", status, error_text);
        }

        let instances_response: ListInstancesResponse = response
            .json()
            .await
            .context("Failed to parse list instances response")?;

        Ok(instances_response.instances)
    }

    /// Send a text message through Omni
    pub async fn send_text(
        &self,
        instance_id: &str,
        recipient: Recipient,
        message: String,
    ) -> Result<SendTextResponse> {
        let url = format!("{}/api/v1/instance/{}/send-text", self.base_url, instance_id);

        // Build the request body
        let body = json!({
            "recipient": {
                "type": match recipient.recipient_type {
                    super::types::RecipientType::PhoneNumber => "phone_number",
                    super::types::RecipientType::UserId => "user_id",
                },
                "value": recipient.value
            },
            "message": message
        });

        let mut request = self.client.post(&url).json(&body);

        // Add API key header if configured
        if let Some(api_key) = &self.api_key {
            request = request.header("X-API-Key", api_key);
        }

        let response = request
            .send()
            .await
            .context("Failed to send text message request")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            anyhow::bail!("Failed to send text message: {} - {}", status, error_text);
        }

        let send_response: SendTextResponse = response
            .json()
            .await
            .context("Failed to parse send text response")?;

        Ok(send_response)
    }

    /// Test connection to Omni service
    pub async fn test_connection(&self) -> Result<bool> {
        let url = format!("{}/api/v1/health", self.base_url);
        
        let mut request = self.client.get(&url);
        
        // Add API key header if configured
        if let Some(api_key) = &self.api_key {
            request = request.header("X-API-Key", api_key);
        }

        let response = request
            .send()
            .await
            .context("Failed to send health check request")?;

        Ok(response.status().is_success())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = OmniClient::new("https://omni.example.com", Some("test-key".to_string()));
        assert!(client.is_ok());
        
        let client = client.unwrap();
        assert_eq!(client.base_url, "https://omni.example.com");
        assert_eq!(client.api_key, Some("test-key".to_string()));
    }

    #[test]
    fn test_client_without_api_key() {
        let client = OmniClient::new("https://omni.example.com", None);
        assert!(client.is_ok());
        
        let client = client.unwrap();
        assert_eq!(client.api_key, None);
    }
}