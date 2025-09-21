use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct BranchTemplate {
    pub task_id: Uuid,
    pub template: Option<String>,
}