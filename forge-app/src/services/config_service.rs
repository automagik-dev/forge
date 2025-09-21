use anyhow::Result;

pub struct ConfigService;

impl ConfigService {
    pub fn new() -> Self {
        Self
    }

    pub async fn dummy(&self) -> Result<String> {
        Ok("Config service scaffold".to_string())
    }
}