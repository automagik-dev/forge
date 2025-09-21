use anyhow::Result;

pub struct ForgeTaskService;

impl ForgeTaskService {
    pub fn new() -> Self {
        Self
    }

    pub async fn dummy(&self) -> Result<String> {
        Ok("Task service scaffold".to_string())
    }
}