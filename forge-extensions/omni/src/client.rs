use anyhow::Result;

use super::types::{InstancesResponse, OmniInstance, SendTextRequest, SendTextResponse};

pub struct OmniClient {
    base_url: String,
    api_key: Option<String>,
    client: reqwest::Client,
}

impl OmniClient {
    pub fn new(base_url: String, api_key: Option<String>) -> Self {
        Self {
            base_url,
            api_key,
            client: reqwest::Client::new(),
        }
    }

    pub async fn list_instances(&self) -> Result<Vec<OmniInstance>> {
        let mut request = self
            .client
            .get(format!("{}/api/v1/instances/", self.base_url));

        if let Some(key) = &self.api_key {
            request = request.header("X-API-Key", key);
        }

        let response: InstancesResponse = request.send().await?.json().await?;

        let instances = response
            .channels
            .into_iter()
            .map(OmniInstance::from)
            .collect();

        Ok(instances)
    }

    pub async fn send_text(
        &self,
        instance: &str,
        req: SendTextRequest,
    ) -> Result<SendTextResponse> {
        let url = format!("{}/api/v1/instance/{}/send-text", self.base_url, instance);

        tracing::info!("Sending Omni request to: {} with payload: {:?}", url, req);

        let mut request = self.client.post(&url).json(&req);

        if let Some(key) = &self.api_key {
            request = request.header("X-API-Key", key);
            tracing::debug!("Using API key for authentication");
        }

        let response = match request.send().await {
            Ok(resp) => {
                let status = resp.status();
                tracing::info!("Omni API response status: {}", status);
                if !status.is_success() {
                    let text = resp
                        .text()
                        .await
                        .unwrap_or_else(|_| "Unknown error".to_string());
                    tracing::error!("Omni API error response: {}", text);
                    return Err(anyhow::anyhow!("Omni API returned {status}: {text}"));
                }
                resp.json().await?
            }
            Err(e) => {
                tracing::error!("Failed to connect to Omni API: {}", e);
                return Err(e.into());
            }
        };

        Ok(response)
    }
}
