# Swagger/OpenAPI Implementation for Automagik Forge

## Summary

This document describes the implementation of Swagger UI and OpenAPI 3.0 specification for the Automagik Forge API.

## What Was Added

### 1. Dependencies

**File:** `forge-app/Cargo.toml`

Added the `utoipa` crate for OpenAPI specification generation:

```toml
# OpenAPI/Swagger dependencies
utoipa = { version = "5.3", features = ["axum_extras", "chrono", "uuid"] }
```

**Note:** We did NOT use `utoipa-swagger-ui` because it depends on Axum 0.7, while Forge uses Axum 0.8. Instead, we serve Swagger UI using a standalone HTML page with CDN-hosted assets.

### 2. OpenAPI Module

**File:** `forge-app/src/openapi.rs` (new file)

This module defines the OpenAPI specification using the `utoipa` crate:

- **`ApiDoc` struct**: Main OpenAPI specification with metadata
  - Title, version, description
  - Server configuration
  - Tag definitions
  - Security schemes (GitHub OAuth)

- **Response schemas**: Type definitions for API responses
  - `ForgeHealthResponse`
  - `ForgeConfigResponse`
  - `OmniStatusResponse`

- **SecurityAddon**: Adds Bearer token authentication to the spec

Key features:
- Comprehensive API description with authentication flow documentation
- Properly structured tags for endpoint organization
- Security scheme definition for GitHub OAuth Bearer tokens

### 3. Router Updates

**File:** `forge-app/src/router.rs`

Added two new endpoints:

#### `/api/openapi.json` (GET)
Returns the complete OpenAPI 3.0 specification in JSON format.

```rust
async fn openapi_spec() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}
```

#### `/docs` (GET)
Serves an interactive Swagger UI HTML page.

```rust
async fn swagger_ui_handler() -> Html<&'static str> {
    // Returns HTML with Swagger UI from CDN
}
```

The Swagger UI page:
- Loads Swagger UI 5.x from CDN (jsDelivr)
- Automatically fetches the OpenAPI spec from `/api/openapi.json`
- Provides full interactive API documentation
- Supports "Try it out" functionality for testing endpoints

### 4. Module Registration

**File:** `forge-app/src/main.rs`

Added the `openapi` module to the main application:

```rust
mod openapi;
mod router;
mod services;
```

### 5. Documentation

**File:** `AUTHENTICATION.md` (new file)

Comprehensive documentation of the GitHub OAuth Device Flow authentication system, including:

- Authentication architecture and flow diagrams
- Detailed endpoint documentation
- Request/response examples
- Configuration instructions
- Security considerations
- Testing procedures
- Troubleshooting guide

## Accessing the Documentation

Once the backend server is running:

### Swagger UI (Interactive)
Visit: **http://localhost:{port}/docs**

Features:
- Browse all API endpoints
- View request/response schemas
- Test endpoints directly in the browser
- Automatic authentication support

### OpenAPI Specification (JSON)
Access: **http://localhost:{port}/api/openapi.json**

Use cases:
- Import into Postman, Insomnia, or other API clients
- Generate client SDKs with OpenAPI Generator
- Validate API contracts
- Documentation generation

## How Authentication Works

Automagik Forge uses **GitHub OAuth with Device Flow**. This is ideal for CLI/desktop applications.

### Flow Overview:

1. **Initiate**: Client calls `/api/auth/github/device`
   - Returns: `device_code`, `user_code`, `verification_uri`

2. **User Authorization**: User visits GitHub URL and enters the code
   - Example: `https://github.com/login/device`
   - User code: `WDJB-MJHT`

3. **Poll for Token**: Client polls `/api/auth/github/device/poll` with `device_code`
   - Returns: `authorization_pending` while waiting
   - Returns: `access_token` when authorized

4. **Use Token**: Include token in `Authorization` header
   ```
   Authorization: Bearer <session_token>
   ```

### Why Device Flow?

- No need for redirect URLs or web browser integration
- Perfect for CLI applications and desktop tools
- User-friendly: simple code entry instead of complex OAuth flow
- Secure: tokens never exposed in URLs

### Required Scopes:

- **`user:email`**: Read user email addresses
- **`repo`**: Full repository access (needed for worktree management and PRs)

## Testing the Implementation

### 1. Start the Server

```bash
cargo run -p forge-app --bin forge-app
```

Or with custom port:

```bash
BACKEND_PORT=8888 cargo run -p forge-app --bin forge-app
```

### 2. Test OpenAPI Spec

```bash
curl http://localhost:8888/api/openapi.json | jq '.info'
```

Expected output:
```json
{
  "title": "Automagik Forge API",
  "version": "0.3.13",
  "description": "API for managing AI-powered coding tasks...",
  ...
}
```

### 3. Test Swagger UI

Open in browser: `http://localhost:8888/docs`

You should see:
- Interactive API documentation
- List of available endpoints
- Authentication section
- Try-it-out functionality

### 4. Test Authentication Flow

```bash
# 1. Initiate device flow
curl -X POST http://localhost:8888/api/auth/github/device

# Response:
# {
#   "device_code": "...",
#   "user_code": "WDJB-MJHT",
#   "verification_uri": "https://github.com/login/device",
#   "expires_in": 900,
#   "interval": 5
# }

# 2. Visit the verification_uri and enter the user_code

# 3. Poll for authorization
curl -X POST http://localhost:8888/api/auth/github/device/poll \
     -H "Content-Type: application/json" \
     -d '{"device_code":"YOUR_DEVICE_CODE"}'

# 4. Use the returned token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8888/api/projects
```

## Next Steps for Enhanced Documentation

The current implementation provides the foundation for OpenAPI documentation. To add comprehensive endpoint documentation:

### 1. Add Path Annotations

Add `#[utoipa::path(...)]` attributes to route handlers:

```rust
#[utoipa::path(
    get,
    path = "/api/projects",
    tag = "projects",
    responses(
        (status = 200, description = "List of projects", body = Vec<Project>),
        (status = 401, description = "Unauthorized")
    ),
    security(
        ("github_oauth" = [])
    )
)]
async fn get_projects(...) -> Result<...> {
    // handler code
}
```

### 2. Register Schemas

Add types to the `components(schemas(...))` section in `openapi.rs`:

```rust
#[derive(OpenApi)]
#[openapi(
    // ...
    components(
        schemas(
            // Core types
            ForgeHealthResponse,
            ForgeConfigResponse,
            // Add more schemas here
            Project,
            Task,
            TaskAttempt,
        )
    ),
)]
pub struct ApiDoc;
```

### 3. Document Upstream Endpoints

Since most endpoints come from the upstream `server` crate, you have two options:

**Option A**: Add utoipa annotations directly in upstream
- Modify `upstream/crates/server/src/routes/*.rs`
- Add `#[utoipa::path(...)]` to handlers
- Include schemas in upstream

**Option B**: Document in OpenAPI spec manually
- Keep upstream clean
- Manually add paths to the OpenAPI JSON
- Trade-off: less automatic, more control

## Architecture Notes

### Why Standalone Swagger UI?

The standard `utoipa-swagger-ui` crate depends on Axum 0.7, but Automagik Forge uses Axum 0.8. Rather than downgrading Axum or waiting for utoipa-swagger-ui to update, we:

1. Serve a simple HTML page with Swagger UI loaded from CDN
2. Keep dependencies minimal
3. Get full Swagger UI functionality without version conflicts

This approach is:
- ✅ Simpler: just an HTML string
- ✅ Faster: CDN caching
- ✅ Compatible: works with any Axum version
- ✅ Maintainable: Swagger UI auto-updates from CDN

### OpenAPI Generation

The OpenAPI spec is generated at runtime using utoipa's derive macros:

1. `#[derive(OpenApi)]` on `ApiDoc` struct
2. Compile-time code generation for the spec
3. Runtime JSON serialization via `ApiDoc::openapi()`

This ensures the spec is always in sync with the code.

## Files Modified/Created

### Created:
- `forge-app/src/openapi.rs` - OpenAPI specification module
- `AUTHENTICATION.md` - Authentication system documentation
- `SWAGGER_IMPLEMENTATION.md` - This file

### Modified:
- `forge-app/Cargo.toml` - Added utoipa dependency
- `forge-app/src/main.rs` - Registered openapi module
- `forge-app/src/router.rs` - Added /api/openapi.json and /docs endpoints

## Troubleshooting

### "Address already in use"

Another instance of forge-app is running:

```bash
pkill -f forge-app
BACKEND_PORT=8888 cargo run -p forge-app --bin forge-app
```

### Swagger UI not loading

Check that:
1. Server is running: `curl http://localhost:8888/health`
2. OpenAPI spec is accessible: `curl http://localhost:8888/api/openapi.json`
3. CDN is accessible (check browser console for errors)

### Empty API paths in Swagger UI

This is expected initially. The infrastructure is in place, but individual endpoint documentation requires adding `#[utoipa::path(...)]` annotations to handlers.

## References

- [utoipa Documentation](https://docs.rs/utoipa/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.0)
- [GitHub Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)
- [Automagik Forge Repository](https://github.com/namastexlabs/automagik-forge)
