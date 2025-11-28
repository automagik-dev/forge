//! Frontend routes for Forge
//!
//! Handles static file serving, SPA routing, and documentation endpoints.

use axum::{
    Json,
    extract::Path,
    http::{HeaderValue, StatusCode, header},
    response::{Html, IntoResponse, Response},
};
use rust_embed::{Embed, RustEmbed};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
pub struct Frontend;

// The RustEmbed derive macro implements the Embed trait

/// Health check endpoint
pub async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "ok",
        "service": "forge-app",
        "version": env!("CARGO_PKG_VERSION"),
        "message": "Forge application ready - backend extensions extracted successfully"
    }))
}

/// Serve OpenAPI specification as JSON
pub async fn serve_openapi_spec() -> Result<Json<Value>, (StatusCode, String)> {
    const OPENAPI_YAML: &str = include_str!("../../openapi.yaml");

    serde_yaml::from_str::<Value>(OPENAPI_YAML)
        .map(Json)
        .map_err(|e| {
            tracing::error!("Failed to parse openapi.yaml: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to parse OpenAPI spec: {}", e),
            )
        })
}

/// Serve Swagger UI HTML
pub async fn serve_swagger_ui() -> Html<String> {
    Html(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Automagik Forge API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {{
            SwaggerUIBundle({{
                url: "/api/openapi.json",
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                deepLinking: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
                persistAuthorization: true
            }});
        }};
    </script>
</body>
</html>"#
            .to_string(),
    )
}

/// Simple route listing
pub async fn list_routes() -> Json<Value> {
    Json(json!({
        "version": env!("CARGO_PKG_VERSION"),
        "routes": {
            "core": [
                "GET /health",
                "GET /api/health",
                "GET /api/routes (this endpoint)"
            ],
            "auth": [
                "POST /api/auth/github/device",
                "POST /api/auth/github/device/poll",
                "POST /api/auth/logout"
            ],
            "projects": [
                "GET /api/projects",
                "POST /api/projects",
                "GET /api/projects/{id}",
                "PUT /api/projects/{id}",
                "DELETE /api/projects/{id}"
            ],
            "tasks": [
                "GET /api/tasks",
                "POST /api/tasks",
                "POST /api/tasks/create-and-start",
                "GET /api/tasks/{id}",
                "PUT /api/tasks/{id}",
                "DELETE /api/tasks/{id}",
                "GET /api/tasks/stream/ws"
            ],
            "task_attempts": [
                "GET /api/task-attempts",
                "POST /api/task-attempts",
                "GET /api/task-attempts/{id}",
                "POST /api/task-attempts/{id}/follow-up",
                "POST /api/task-attempts/{id}/stop",
                "POST /api/task-attempts/{id}/merge",
                "POST /api/task-attempts/{id}/push",
                "POST /api/task-attempts/{id}/rebase",
                "POST /api/task-attempts/{id}/pr",
                "POST /api/task-attempts/{id}/pr/attach",
                "GET /api/task-attempts/{id}/branch-status",
                "GET /api/task-attempts/{id}/diff/ws",
                "GET /api/task-attempts/{id}/draft",
                "PUT /api/task-attempts/{id}/draft",
                "DELETE /api/task-attempts/{id}/draft"
            ],
            "processes": [
                "GET /api/execution-processes",
                "GET /api/execution-processes/{id}",
                "POST /api/execution-processes/{id}/stop"
            ],
            "events": [
                "GET /api/events/processes/{id}/logs",
                "GET /api/events/task-attempts/{id}/diff"
            ],
            "images": [
                "POST /api/images",
                "GET /api/images/{id}"
            ],
            "forge": [
                "GET /api/forge/config",
                "PUT /api/forge/config",
                "GET /api/forge/projects/{id}/settings",
                "PUT /api/forge/projects/{id}/settings",
                "GET /api/forge/omni/status",
                "GET /api/forge/omni/instances",
                "POST /api/forge/omni/validate",
                "GET /api/forge/omni/notifications",
                "GET /api/forge/releases",
                "GET /api/forge/master-genie/{attempt_id}/neurons",
                "GET /api/forge/neurons/{neuron_attempt_id}/subtasks"
            ],
            "filesystem": [
                "GET /api/filesystem/tree",
                "GET /api/filesystem/file"
            ],
            "config": [
                "GET /api/config",
                "PUT /api/config"
            ],
            "drafts": [
                "GET /api/drafts",
                "POST /api/drafts",
                "GET /api/drafts/{id}",
                "PUT /api/drafts/{id}",
                "DELETE /api/drafts/{id}"
            ],
            "containers": [
                "GET /api/containers",
                "GET /api/containers/{id}"
            ],
            "approvals": [
                "POST /api/approvals/create",
                "GET /api/approvals/{id}/status",
                "POST /api/approvals/{id}/respond",
                "GET /api/approvals/pending"
            ]
        },
        "note": "This is a simple route listing. Most endpoints require GitHub OAuth authentication via /api/auth/github/device"
    }))
}

/// GitHub release model
#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRelease {
    pub tag_name: String,
    pub name: String,
    pub body: Option<String>,
    pub prerelease: bool,
    pub created_at: String,
    pub published_at: Option<String>,
    pub html_url: String,
}

/// Fetch GitHub releases from the repository
pub async fn get_github_releases() -> Result<Json<utils::response::ApiResponse<Vec<GitHubRelease>>>, StatusCode> {
    let client = reqwest::Client::new();

    match client
        .get("https://api.github.com/repos/namastexlabs/automagik-forge/releases")
        .header("User-Agent", "automagik-forge")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<GitHubRelease>>().await {
                    Ok(releases) => Ok(Json(utils::response::ApiResponse::success(releases))),
                    Err(e) => {
                        tracing::error!("Failed to parse GitHub releases: {}", e);
                        Err(StatusCode::INTERNAL_SERVER_ERROR)
                    }
                }
            } else {
                tracing::error!("GitHub API returned error: {}", response.status());
                Err(StatusCode::BAD_GATEWAY)
            }
        }
        Err(e) => {
            tracing::error!("Failed to fetch GitHub releases: {}", e);
            Err(StatusCode::BAD_GATEWAY)
        }
    }
}

/// Frontend handler for SPA routing
pub async fn frontend_handler(uri: axum::http::Uri) -> Response {
    let path = uri.path().trim_start_matches('/');

    if path.is_empty() {
        serve_index().await
    } else {
        serve_assets(Path(path.to_string())).await
    }
}

pub async fn serve_index() -> Response {
    match Frontend::get("index.html") {
        Some(content) => Html(content.data.to_vec()).into_response(),
        None => (StatusCode::NOT_FOUND, "404 Not Found").into_response(),
    }
}

pub async fn serve_assets(Path(path): Path<String>) -> Response {
    serve_static_file::<Frontend>(&path).await
}

pub async fn serve_static_file<T: Embed>(path: &str) -> Response {
    match T::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();

            let mut response = Response::new(content.data.into());
            response.headers_mut().insert(
                header::CONTENT_TYPE,
                HeaderValue::from_str(mime.as_ref()).unwrap(),
            );
            response
        }
        None => {
            if let Some(index) = T::get("index.html") {
                Html(index.data.to_vec()).into_response()
            } else {
                (StatusCode::NOT_FOUND, "404 Not Found").into_response()
            }
        }
    }
}
