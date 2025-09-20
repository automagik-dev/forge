//! Forge Task Service - Composition layer that wraps upstream task functionality

use anyhow::Result;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use forge_branch_templates::BranchTemplateService;
use forge_omni::{OmniService, OmniConfig};

/// Simplified task status enum for composition layer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Todo,
    InProgress,
    Done,
    Cancelled,
}

/// Simplified task model for composition layer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub parent_task_attempt: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create task data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTask {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub parent_task_attempt: Option<Uuid>,
}

/// Update task data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTask {
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub parent_task_attempt: Option<Uuid>,
}

/// Enhanced CreateTask that includes forge-specific fields
#[derive(Debug, Clone)]
pub struct ForgeCreateTask {
    pub upstream_data: CreateTask,
    pub branch_template: Option<String>,
    pub omni_config: Option<OmniConfig>,
}

/// Enhanced UpdateTask that includes forge-specific fields
#[derive(Debug, Clone)]
pub struct ForgeUpdateTask {
    pub upstream_data: UpdateTask,
    pub branch_template: Option<String>,
    pub omni_config: Option<OmniConfig>,
}

/// Forge Task Service that wraps upstream functionality with forge extensions
pub struct ForgeTaskService {
    branch_template_service: BranchTemplateService,
    omni_service: Option<OmniService>,
}

impl ForgeTaskService {
    pub fn new() -> Self {
        Self {
            branch_template_service: BranchTemplateService::new(),
            omni_service: None, // Will be set later with configuration
        }
    }

    pub fn with_omni_service(mut self, omni_service: OmniService) -> Self {
        self.omni_service = Some(omni_service);
        self
    }

    /// Create a task with forge extensions
    pub async fn create_task(&self, data: ForgeCreateTask) -> Result<Task> {
        // First create the upstream task (simplified - in real implementation this would call upstream)
        let task_id = Uuid::new_v4();
        let now = Utc::now();

        // TODO: Call upstream task creation
        let task = Task {
            id: task_id,
            project_id: data.upstream_data.project_id,
            title: data.upstream_data.title.clone(),
            description: data.upstream_data.description.clone(),
            status: TaskStatus::Todo,
            parent_task_attempt: data.upstream_data.parent_task_attempt,
            created_at: now,
            updated_at: now,
        };

        // TODO: Store forge-specific extensions in database
        // For now, just log the extensions
        if let Some(branch_template) = &data.branch_template {
            println!("Storing branch template: {} for task {}", branch_template, task.id);
        }

        if let Some(omni_config) = &data.omni_config {
            println!("Storing omni config for task {}", task.id);
        }

        Ok(task)
    }

    /// Update a task with forge extensions
    pub async fn update_task(
        &self,
        task_id: Uuid,
        project_id: Uuid,
        data: ForgeUpdateTask,
    ) -> Result<Task> {
        // Update upstream task (simplified)
        let now = Utc::now();

        // TODO: Call upstream task update
        let task = Task {
            id: task_id,
            project_id,
            title: data.upstream_data.title.clone(),
            description: data.upstream_data.description.clone(),
            status: data.upstream_data.status.clone(),
            parent_task_attempt: data.upstream_data.parent_task_attempt,
            created_at: now, // This should come from upstream
            updated_at: now,
        };

        // TODO: Update forge-specific extensions in database
        if let Some(branch_template) = &data.branch_template {
            println!("Updating branch template: {} for task {}", branch_template, task.id);
        }

        if let Some(omni_config) = &data.omni_config {
            println!("Updating omni config for task {}", task.id);
        }

        Ok(task)
    }

    /// Get a task with forge extensions
    pub async fn get_task(&self, task_id: Uuid, project_id: Uuid) -> Result<Task> {
        // TODO: Call upstream task retrieval
        // For now, return a dummy task
        let now = Utc::now();
        Ok(Task {
            id: task_id,
            project_id,
            title: "Dummy Task".to_string(),
            description: None,
            status: TaskStatus::Todo,
            parent_task_attempt: None,
            created_at: now,
            updated_at: now,
        })
    }

    /// Generate branch name for a task attempt
    pub fn generate_branch_name(&self, task_title: &str, branch_template: Option<&str>, attempt_id: &Uuid) -> String {
        self.branch_template_service.generate_branch_name(task_title, branch_template, attempt_id)
    }

    /// Send task completion notification via Omni
    pub async fn send_task_notification(
        &self,
        task_title: &str,
        task_status: &str,
        task_url: Option<&str>,
    ) -> Result<()> {
        if let Some(omni_service) = &self.omni_service {
            omni_service.send_task_notification(task_title, task_status, task_url).await?;
        }
        Ok(())
    }
}