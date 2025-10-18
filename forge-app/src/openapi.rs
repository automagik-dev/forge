//! OpenAPI Documentation
//!
//! Provides Swagger UI and OpenAPI specification for the Forge API.

use utoipa::OpenApi;
use utoipa::openapi::security::{Http, HttpAuthScheme, SecurityScheme};

/// Main OpenAPI specification for Automagik Forge API
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Automagik Forge API",
        version = "0.3.13",
        description = "API for managing AI-powered coding tasks with multiple agent executors.\n\n\
            ## Overview\n\
            Automagik Forge is a task orchestration platform that enables AI coding agents \
            (Claude Code, Gemini, Codex, etc.) to work on isolated Git worktrees.\n\n\
            ## Key Features\n\
            - **Task Management**: Create and track coding tasks\n\n\
            - **Multi-Agent Support**: 8 different AI coding agent executors\n\n\
            - **Git Isolation**: Each task runs in its own worktree\n\n\
            - **Real-time Updates**: Server-Sent Events for live progress\n\n\
            - **MCP Integration**: Model Context Protocol for agent communication\n\n\
            ## Authentication\n\
            This API uses GitHub OAuth (Device Flow) for authentication. The authentication \
            flow works as follows:\n\n\
            1. **Device Flow Initiation**: Call `/api/auth/github/device` to get a device code\n\n\
            2. **User Authorization**: User visits the provided URL and enters the device code\n\n\
            3. **Token Polling**: Frontend polls `/api/auth/github/device/poll` to check auth status\n\n\
            4. **Session Token**: Upon success, receive a session token for subsequent requests\n\n\
            Most endpoints require authentication via the session token in the Authorization header.",
        contact(
            name = "Automagik Forge",
            url = "https://github.com/namastexlabs/automagik-forge"
        ),
        license(
            name = "MIT",
            url = "https://github.com/namastexlabs/automagik-forge/blob/main/LICENSE"
        )
    ),
    servers(
        (url = "http://localhost:{port}", description = "Local development server",
            variables(
                ("port" = (default = "3001", description = "Backend port (auto-assigned)"))
            )
        )
    ),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "auth", description = "GitHub OAuth authentication endpoints"),
        (name = "projects", description = "Project management"),
        (name = "tasks", description = "Task creation and management"),
        (name = "task-attempts", description = "Task execution attempts"),
        (name = "events", description = "Server-Sent Events for real-time updates"),
        (name = "forge", description = "Forge-specific configuration and features"),
        (name = "omni", description = "Omni notification system integration")
    ),
    components(
        schemas(
            // Core types
            ForgeHealthResponse,
            ForgeConfigResponse,
            OmniStatusResponse,
        )
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

/// Security scheme modifier to add authentication requirements
struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "github_oauth",
                SecurityScheme::Http(Http::new(HttpAuthScheme::Bearer)),
            );
        }
    }
}

// Response schemas for OpenAPI documentation

/// Health check response
#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct ForgeHealthResponse {
    /// Service status
    pub status: String,
    /// Service name
    pub service: String,
    /// Additional message
    pub message: String,
}

/// Forge configuration response
#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct ForgeConfigResponse {
    /// Whether the feature is enabled
    pub enabled: bool,
    /// Additional configuration data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<serde_json::Value>,
}

/// Omni status response
#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct OmniStatusResponse {
    /// Whether Omni integration is enabled
    pub enabled: bool,
    /// Forge version
    pub version: String,
    /// Omni configuration if enabled
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<serde_json::Value>,
}
