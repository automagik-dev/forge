use anyhow::Result;
use forge_branch_templates::BranchTemplateService;
use forge_omni::OmniService;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

// This will wrap upstream::services::TaskService
// For now, we define our own structures to show the pattern

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    // Additional fields from upstream
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTask {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    // Forge-specific extensions
    pub branch_template: Option<String>,
    pub notify_omni: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTask {
    pub title: Option<String>,
    pub description: Option<String>,
    pub branch_template: Option<String>,
}

pub struct ForgeTaskService {
    // In real implementation: upstream: upstream::services::TaskService,
    extensions_db: Pool<Sqlite>,
    branch_templates: BranchTemplateService,
    omni: Option<OmniService>,
}

impl ForgeTaskService {
    pub fn new(
        extensions_db: Pool<Sqlite>,
        branch_templates: BranchTemplateService,
        omni: Option<OmniService>,
    ) -> Self {
        Self {
            extensions_db,
            branch_templates,
            omni,
        }
    }

    pub async fn list_tasks(&self, project_id: Uuid) -> Result<Vec<Task>> {
        // In real implementation:
        // let tasks = self.upstream.list_tasks(project_id).await?;

        // For now, return empty vec to show pattern
        Ok(vec![])
    }

    pub async fn create_task(&self, data: CreateTask) -> Result<Task> {
        // Extract forge-specific fields
        let branch_template = data.branch_template.clone();
        let notify_omni = data.notify_omni;

        // In real implementation:
        // Create via upstream
        // let upstream_data = upstream::CreateTask {
        //     project_id: data.project_id,
        //     title: data.title,
        //     description: data.description,
        // };
        // let task = self.upstream.create_task(upstream_data).await?;

        // For demo, create a dummy task
        let task = Task {
            id: Uuid::new_v4(),
            project_id: data.project_id,
            title: data.title,
            description: data.description,
        };

        // Store forge extensions in auxiliary table
        if let Some(template) = branch_template {
            self.branch_templates
                .set_branch_template(task.id, Some(template))
                .await?;
        }

        // Trigger forge features
        if notify_omni {
            if let Some(omni) = &self.omni {
                omni.send_task_notification(
                    &task.title,
                    "created",
                    Some(&format!("/tasks/{}", task.id)),
                )
                .await?;
            }
        }

        Ok(task)
    }

    pub async fn get_task(&self, id: Uuid) -> Result<Task> {
        // In real implementation:
        // let task = self.upstream.get_task(id).await?;

        // For now, return dummy task
        Ok(Task {
            id,
            project_id: Uuid::new_v4(),
            title: "Sample Task".to_string(),
            description: Some("Sample description".to_string()),
        })
    }

    pub async fn update_task(&self, id: Uuid, data: UpdateTask) -> Result<Task> {
        // In real implementation:
        // Update via upstream
        // let upstream_data = upstream::UpdateTask {
        //     title: data.title,
        //     description: data.description,
        // };
        // let task = self.upstream.update_task(id, upstream_data).await?;

        // Update forge extensions
        if let Some(template) = data.branch_template {
            self.branch_templates
                .set_branch_template(id, Some(template))
                .await?;
        }

        self.get_task(id).await
    }

    pub async fn get_task_with_extensions(&self, id: Uuid) -> Result<(Task, Option<String>)> {
        let task = self.get_task(id).await?;
        let branch_template = self.branch_templates.get_branch_template(id).await?;
        Ok((task, branch_template))
    }
}