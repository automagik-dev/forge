//! Forge Task MCP Server
//!
//! Extends upstream TaskServer with parent_task_attempt field exposure.

use db::models::task::{CreateTask, Task, TaskStatus, TaskWithAttemptStatus, UpdateTask};
use rmcp::{
    ErrorData, ServerHandler,
    handler::server::tool::{Parameters, ToolRouter},
    model::{CallToolResult, Content, ServerCapabilities, ServerInfo},
    schemars, tool, tool_handler, tool_router,
};
use serde::{Deserialize, Serialize};
use serde_json;
use uuid::Uuid;

/// Forge CreateTaskRequest with parent_task_attempt support
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateTaskRequest {
    #[schemars(description = "The ID of the project to create the task in. This is required!")]
    pub project_id: Uuid,
    #[schemars(description = "The title of the task")]
    pub title: String,
    #[schemars(description = "Optional description of the task")]
    pub description: Option<String>,
    #[schemars(description = "Optional UUID of the task attempt (execution run) that spawned this task. Used to track parent-child relationships between tasks.")]
    pub parent_task_attempt: Option<Uuid>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct CreateTaskResponse {
    pub task_id: String,
}

/// Forge TaskDetails with parent_task_attempt exposure
#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct TaskDetails {
    #[schemars(description = "The unique identifier of the task")]
    pub id: String,
    #[schemars(description = "The title of the task")]
    pub title: String,
    #[schemars(description = "Optional description of the task")]
    pub description: Option<String>,
    #[schemars(description = "Current status of the task")]
    pub status: String,
    #[schemars(description = "When the task was created")]
    pub created_at: String,
    #[schemars(description = "When the task was last updated")]
    pub updated_at: String,
    #[schemars(description = "UUID of the task attempt that spawned this task (if any). Use to track parent-child task relationships.")]
    pub parent_task_attempt: Option<String>,
    #[schemars(description = "Whether the task has an in-progress execution attempt")]
    pub has_in_progress_attempt: Option<bool>,
    #[schemars(description = "Whether the task has a merged execution attempt")]
    pub has_merged_attempt: Option<bool>,
    #[schemars(description = "Whether the last execution attempt failed")]
    pub last_attempt_failed: Option<bool>,
}

impl TaskDetails {
    pub fn from_task(task: Task) -> Self {
        Self {
            id: task.id.to_string(),
            title: task.title,
            description: task.description,
            status: task.status.to_string(),
            created_at: task.created_at.to_rfc3339(),
            updated_at: task.updated_at.to_rfc3339(),
            parent_task_attempt: task.parent_task_attempt.map(|id| id.to_string()),
            has_in_progress_attempt: None,
            has_merged_attempt: None,
            last_attempt_failed: None,
        }
    }
}

/// Forge TaskSummary with parent_task_attempt exposure
#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct TaskSummary {
    #[schemars(description = "The unique identifier of the task")]
    pub id: String,
    #[schemars(description = "The title of the task")]
    pub title: String,
    #[schemars(description = "Current status of the task")]
    pub status: String,
    #[schemars(description = "When the task was created")]
    pub created_at: String,
    #[schemars(description = "When the task was last updated")]
    pub updated_at: String,
    #[schemars(description = "UUID of the task attempt that spawned this task (if any)")]
    pub parent_task_attempt: Option<String>,
    #[schemars(description = "Whether the task has an in-progress execution attempt")]
    pub has_in_progress_attempt: Option<bool>,
    #[schemars(description = "Whether the task has a merged execution attempt")]
    pub has_merged_attempt: Option<bool>,
    #[schemars(description = "Whether the last execution attempt failed")]
    pub last_attempt_failed: Option<bool>,
}

impl TaskSummary {
    pub fn from_task_with_status(task: TaskWithAttemptStatus) -> Self {
        Self {
            id: task.id.to_string(),
            title: task.title.to_string(),
            status: task.status.to_string(),
            created_at: task.created_at.to_rfc3339(),
            updated_at: task.updated_at.to_rfc3339(),
            parent_task_attempt: task.parent_task_attempt.map(|id| id.to_string()),
            has_in_progress_attempt: Some(task.has_in_progress_attempt),
            has_merged_attempt: Some(task.has_merged_attempt),
            last_attempt_failed: Some(task.last_attempt_failed),
        }
    }
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ListTasksRequest {
    #[schemars(description = "The ID of the project to list tasks from")]
    pub project_id: Uuid,
    #[schemars(
        description = "Optional status filter: 'todo', 'inprogress', 'inreview', 'done', 'cancelled'"
    )]
    pub status: Option<String>,
    #[schemars(description = "Maximum number of tasks to return (default: 50)")]
    pub limit: Option<i32>,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct ListTasksResponse {
    pub tasks: Vec<TaskSummary>,
    pub count: usize,
    pub project_id: String,
    pub applied_filters: AppliedFilters,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct AppliedFilters {
    pub status: Option<String>,
    pub limit: i32,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetTaskRequest {
    #[schemars(description = "The ID of the task to retrieve")]
    pub task_id: Uuid,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct GetTaskResponse {
    pub task: TaskDetails,
}

/// Forge TaskServer - wraps upstream with parent_task_attempt support
#[derive(Clone)]
pub struct ForgeTaskServer {
    base_url: String,
    client: reqwest::Client,
}

impl ForgeTaskServer {
    pub fn new(base_url: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
            client: reqwest::Client::new(),
        }
    }

    fn url(&self, path: &str) -> String {
        format!("{}{}", self.base_url, path)
    }

    fn success<T: Serialize>(data: &T) -> Result<CallToolResult, ErrorData> {
        Ok(CallToolResult::success(vec![Content::text(
            serde_json::to_string_pretty(data)
                .unwrap_or_else(|_| "Failed to serialize response".to_string()),
        )]))
    }

    async fn send_json<T: serde::de::DeserializeOwned>(
        &self,
        request: reqwest::RequestBuilder,
    ) -> Result<T, CallToolResult> {
        let response = request.send().await.map_err(|e| {
            CallToolResult::error(vec![Content::text(format!(
                "Failed to connect to Forge API: {}",
                e
            ))])
        })?;

        let status = response.status();
        let body = response.text().await.map_err(|e| {
            CallToolResult::error(vec![Content::text(format!(
                "Failed to read Forge API response: {}",
                e
            ))])
        })?;

        if !status.is_success() {
            return Err(CallToolResult::error(vec![Content::text(format!(
                "Forge API returned error status {}: {}",
                status, body
            ))]));
        }

        let json: serde_json::Value = serde_json::from_str(&body).map_err(|e| {
            CallToolResult::error(vec![Content::text(format!(
                "Failed to parse Forge API response: {}",
                e
            ))])
        })?;

        let data = json.get("data").ok_or_else(|| {
            CallToolResult::error(vec![Content::text(
                "Forge API response missing data field".to_string(),
            )])
        })?;

        serde_json::from_value(data.clone()).map_err(|e| {
            CallToolResult::error(vec![Content::text(format!(
                "Failed to deserialize Forge API data: {}",
                e
            ))])
        })
    }
}

#[tool_router]
impl ForgeTaskServer {
    #[tool(
        description = "Create a new task/ticket in a project. Always pass the `project_id` of the project you want to create the task in - it is required!"
    )]
    async fn create_task(
        &self,
        Parameters(CreateTaskRequest {
            project_id,
            title,
            description,
            parent_task_attempt,
        }): Parameters<CreateTaskRequest>,
    ) -> Result<CallToolResult, ErrorData> {
        let url = self.url("/api/tasks");
        let payload = CreateTask {
            project_id,
            title,
            description,
            parent_task_attempt,
            image_ids: None,
        };
        let task: Task = match self.send_json(self.client.post(&url).json(&payload)).await {
            Ok(t) => t,
            Err(e) => return Ok(e),
        };

        ForgeTaskServer::success(&CreateTaskResponse {
            task_id: task.id.to_string(),
        })
    }

    #[tool(
        description = "Get detailed information (like task description) about a specific task/ticket. You can use `list_tasks` to find the `task_ids` of all tasks in a project. `project_id` and `task_id` are required!"
    )]
    async fn get_task(
        &self,
        Parameters(GetTaskRequest { task_id }): Parameters<GetTaskRequest>,
    ) -> Result<CallToolResult, ErrorData> {
        let url = self.url(&format!("/api/tasks/{}", task_id));
        let task: Task = match self.send_json(self.client.get(&url)).await {
            Ok(t) => t,
            Err(e) => return Ok(e),
        };

        ForgeTaskServer::success(&GetTaskResponse {
            task: TaskDetails::from_task(task),
        })
    }

    #[tool(
        description = "List all the task/tickets in a project with optional filtering and execution status. `project_id` is required!"
    )]
    async fn list_tasks(
        &self,
        Parameters(ListTasksRequest {
            project_id,
            status,
            limit,
        }): Parameters<ListTasksRequest>,
    ) -> Result<CallToolResult, ErrorData> {
        let limit = limit.unwrap_or(50);
        let mut url = self.url(&format!("/api/tasks?project_id={}", project_id));
        if let Some(ref status) = status {
            url.push_str(&format!("&status={}", status));
        }
        url.push_str(&format!("&limit={}", limit));

        let tasks: Vec<TaskWithAttemptStatus> = match self.send_json(self.client.get(&url)).await
        {
            Ok(t) => t,
            Err(e) => return Ok(e),
        };

        ForgeTaskServer::success(&ListTasksResponse {
            count: tasks.len(),
            tasks: tasks
                .into_iter()
                .map(TaskSummary::from_task_with_status)
                .collect(),
            project_id: project_id.to_string(),
            applied_filters: AppliedFilters { status, limit },
        })
    }

    // Delegate all other tools to upstream TaskServer
    // (list_projects, update_task, delete_task, start_task_attempt)
    // These don't need parent_task_attempt modifications
}

impl ServerHandler for ForgeTaskServer {
    fn get_info(&self) -> ServerInfo {
        use rmcp::model::{Implementation, ProtocolVersion};

        ServerInfo {
            protocol_version: ProtocolVersion::V_2025_03_26,
            capabilities: ServerCapabilities::builder()
                .enable_tools()
                .build(),
            server_info: Implementation {
                name: "automagik-forge".to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
            },
            instructions: Some("A task and project management server. If you need to create or update tickets or tasks then use these tools. Most of them absolutely require that you pass the `project_id` of the project that you are currently working on. This should be provided to you. Call `list_tasks` to fetch the `task_ids` of all the tasks in a project`. TOOLS: 'list_projects', 'list_tasks', 'create_task', 'start_task_attempt', 'get_task', 'update_task', 'delete_task'. Make sure to pass `project_id` or `task_id` where required. You can use list tools to get the available ids.".to_string()),
        }
    }
}
