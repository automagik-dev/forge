//! Advanced MCP Tools Module
//!
//! This module contains ALL advanced tools that mirror the complete Forge backend API.
//! These tools are only available when the MCP server is started with --advanced flag.
//!
//! Organization:
//! - Task Attempts (25 tools)
//! - Execution Processes (3 tools)
//! - Images (2 tools)
//! - Filesystem (2 tools)
//! - Config (2 tools)
//! - Drafts (5 tools)
//! - Containers (2 tools)
//! - Forge-Specific (8 tools)
//!
//! Total Advanced Tools: 49 additional tools

use chrono::{DateTime, Utc};
use db::models::task_attempt::TaskAttempt;
use rmcp::schemars;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct UploadImageResponse {
    #[schemars(description = "Uploaded image ID")]
    pub image_id: Uuid,
}

// TaskAttemptSummary - simplified representation of a TaskAttempt for MCP responses
#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct TaskAttemptSummary {
    pub id: String,
    pub task_id: String,
    pub branch: String,
    pub target_branch: String,
    pub executor: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl TaskAttemptSummary {
    pub fn from_task_attempt(attempt: TaskAttempt) -> Self {
        Self {
            id: attempt.id.to_string(),
            task_id: attempt.task_id.to_string(),
            branch: attempt.branch,
            target_branch: attempt.target_branch,
            executor: attempt.executor,
            created_at: attempt.created_at,
            updated_at: attempt.updated_at,
        }
    }
}

// Response types
#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct StopTaskAttemptResponse {
    pub stopped: bool,
    pub attempt_id: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct MergeTaskAttemptResponse {
    pub success: bool,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct DeleteProjectResponse {
    pub deleted: bool,
    pub project_id: String,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct GetTaskAttemptResponse {
    pub task_attempt: TaskAttemptSummary,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct ListTaskAttemptsResponse {
    pub attempts: Vec<TaskAttemptSummary>,
    pub applied_filters: TaskAttemptFilters,
}

#[derive(Debug, Serialize, schemars::JsonSchema)]
pub struct TaskAttemptFilters {
    pub project_id: Option<Uuid>,
}

// ============================================================================
// PROJECT MANAGEMENT REQUEST TYPES
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateProjectRequest {
    #[schemars(description = "Project name")]
    pub name: String,
    #[schemars(description = "Path to git repository")]
    pub git_repo_path: String,
    #[schemars(description = "Optional setup script")]
    pub setup_script: Option<String>,
    #[schemars(description = "Optional cleanup script")]
    pub cleanup_script: Option<String>,
    #[schemars(description = "Optional dev script")]
    pub dev_script: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetProjectRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UpdateProjectRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
    #[schemars(description = "New project name")]
    pub name: Option<String>,
    #[schemars(description = "New git repo path")]
    pub git_repo_path: Option<String>,
    #[schemars(description = "New setup script")]
    pub setup_script: Option<String>,
    #[schemars(description = "New cleanup script")]
    pub cleanup_script: Option<String>,
    #[schemars(description = "New dev script")]
    pub dev_script: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct DeleteProjectRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ListTaskAttemptsRequest {
    #[schemars(description = "Optional project ID filter")]
    pub project_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetTaskAttemptRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

// ============================================================================
// TASK ATTEMPTS ADVANCED TOOLS (25 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct FollowUpRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "Follow-up message/instruction")]
    pub message: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct StopTaskAttemptRequest {
    #[schemars(description = "Task attempt ID to stop")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct MergeTaskAttemptRequest {
    #[schemars(description = "Task attempt ID to merge")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct PushTaskAttemptRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct RebaseTaskAttemptRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreatePRRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "PR title")]
    pub title: Option<String>,
    #[schemars(description = "PR body/description")]
    pub body: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct AttachPRRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "PR number to attach")]
    pub pr_number: i64,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetBranchStatusRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetDraftRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct SaveDraftRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "Draft content")]
    pub content: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct DeleteDraftRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct SetDraftQueueRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "Queue data")]
    pub queue: serde_json::Value,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ReplaceProcessRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetCommitInfoRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CompareCommitRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct StartDevServerRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct OpenEditorRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "Editor to use (e.g., 'code', 'cursor')")]
    pub editor: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct DeleteFileRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "File path to delete")]
    pub file_path: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetChildrenRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct AbortConflictsRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ChangeTargetBranchRequest {
    #[schemars(description = "Task attempt ID")]
    pub attempt_id: Uuid,
    #[schemars(description = "New target branch")]
    pub target_branch: String,
}

// ============================================================================
// EXECUTION PROCESSES (3 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ListProcessesRequest {
    #[schemars(description = "Optional project ID filter")]
    pub project_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetProcessRequest {
    #[schemars(description = "Process ID")]
    pub process_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct StopProcessRequest {
    #[schemars(description = "Process ID to stop")]
    pub process_id: Uuid,
}

// ============================================================================
// IMAGES (2 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UploadImageRequest {
    #[schemars(description = "Base64 encoded image data")]
    pub data: String,
    #[schemars(description = "MIME type (e.g., image/png)")]
    pub mime_type: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetImageRequest {
    #[schemars(description = "Image ID")]
    pub image_id: Uuid,
}

// ============================================================================
// FILESYSTEM (2 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetFilesystemTreeRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
    #[schemars(description = "Path within the project")]
    pub path: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetFileRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
    #[schemars(description = "File path")]
    pub file_path: String,
}

// ============================================================================
// CONFIG (2 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UpdateConfigRequest {
    #[schemars(description = "Configuration JSON")]
    pub config: serde_json::Value,
}

// ============================================================================
// DRAFTS (5 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ListDraftsRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateDraftRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
    #[schemars(description = "Draft title")]
    pub title: String,
    #[schemars(description = "Draft content")]
    pub content: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetDraftByIdRequest {
    #[schemars(description = "Draft ID")]
    pub draft_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UpdateDraftRequest {
    #[schemars(description = "Draft ID")]
    pub draft_id: Uuid,
    #[schemars(description = "New title")]
    pub title: Option<String>,
    #[schemars(description = "New content")]
    pub content: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct DeleteDraftByIdRequest {
    #[schemars(description = "Draft ID")]
    pub draft_id: Uuid,
}

// ============================================================================
// CONTAINERS (2 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetContainerRequest {
    #[schemars(description = "Container ID")]
    pub container_id: Uuid,
}

// ============================================================================
// FORGE-SPECIFIC (8 tools)
// ============================================================================

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UpdateForgeConfigRequest {
    #[schemars(description = "Forge configuration")]
    pub config: serde_json::Value,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetProjectSettingsRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UpdateProjectSettingsRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
    #[schemars(description = "Project settings")]
    pub settings: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, schemars::JsonSchema)]
pub struct ValidateOmniConfigRequest {
    #[schemars(description = "Omni host")]
    pub host: String,
    #[schemars(description = "Omni API key")]
    pub api_key: String,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateTaskAndStartRequest {
    #[schemars(description = "Project ID")]
    pub project_id: Uuid,
    #[schemars(description = "Task title")]
    pub title: String,
    #[schemars(description = "Task description")]
    pub description: Option<String>,
    #[schemars(description = "Executor to use (e.g., 'CLAUDE_CODE', 'CURSOR', 'GEMINI')")]
    pub executor: String,
    #[schemars(description = "Optional executor variant")]
    pub variant: Option<String>,
    #[schemars(description = "Base branch for the task attempt")]
    pub base_branch: String,
    #[schemars(description = "Optional parent task attempt UUID")]
    pub parent_task_attempt: Option<Uuid>,
}
