# Automagik Forge Complete API Reference
*For building alternative frontends*

Generated: 2025-10-20
Version: 0.3.15+

---

## 🔐 Authentication Required
Most endpoints require GitHub OAuth token via device flow.
See [Authentication Flow](#authentication-flow) below.

---

## Forge Configuration Endpoints

### `GET /api/forge/config`
Get global Forge configuration (applies to all projects).

**Authentication**: Required (GitHub OAuth Bearer token)

**Request**:
```http
GET /api/forge/config HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "omni_enabled": boolean,
    "omni_config": {
      "enabled": boolean,
      "host": string | null,              // Evolution API host (e.g., "https://omni.example.com")
      "api_key": string | null,            // Evolution API key
      "instance": string | null,           // Default instance name
      "recipient": string | null,          // Default recipient (phone/userId)
      "recipient_type": "PhoneNumber" | "UserId" | null
    } | null
  },
  "error_data": null,
  "message": null
}
```

**Error Responses**:
- `500` - Internal server error (check logs)

**What You Can Configure**:
- **Omni Messaging System**: Enable/disable WhatsApp/Discord/Slack notifications via Evolution API
- **Global Defaults**: Set default instance, recipient, and API credentials for all projects

---

### `PUT /api/forge/config`
Update global Forge configuration.

**Authentication**: Required

**Request**:
```http
PUT /api/forge/config HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "omni_enabled": true,
  "omni_config": {
    "enabled": true,
    "host": "https://evolution-api.example.com",
    "api_key": "evo_1234567890abcdef",
    "instance": "automagik-forge",
    "recipient": "+15551234567",
    "recipient_type": "PhoneNumber"
  }
}
```

**Request Body Schema**:
```typescript
type ForgeProjectSettings = {
  omni_enabled: boolean,
  omni_config: {
    enabled: boolean,
    host: string | null,
    api_key: string | null,
    instance: string | null,
    recipient: string | null,
    recipient_type: "PhoneNumber" | "UserId" | null
  } | null
}
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": ForgeProjectSettings,  // Updated config echoed back
  "error_data": null,
  "message": null
}
```

**Side Effects**:
- Refreshes Omni service configuration globally
- Validates Evolution API credentials if provided

**Error Responses**:
- `500` - Failed to persist config or refresh Omni service

---

### `GET /api/forge/projects/{project_id}/settings`
Get per-project Forge settings (overrides global config).

**Authentication**: Required

**Path Parameters**:
- `project_id` (UUID, required) - Project identifier

**Request**:
```http
GET /api/forge/projects/550e8400-e29b-41d4-a716-446655440000/settings HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "omni_enabled": boolean,
    "omni_config": {
      "enabled": boolean,
      "host": string | null,
      "api_key": string | null,
      "instance": string | null,
      "recipient": string | null,
      "recipient_type": "PhoneNumber" | "UserId" | null
    } | null
  },
  "error_data": null,
  "message": null
}
```

**Behavior**:
- Returns project-specific overrides
- If no project override exists, returns empty/default settings
- Does NOT inherit global settings in response (merge on frontend if needed)

---

### `PUT /api/forge/projects/{project_id}/settings`
Update per-project Forge settings.

**Authentication**: Required

**Path Parameters**:
- `project_id` (UUID, required) - Project identifier

**Request**:
```http
PUT /api/forge/projects/550e8400-e29b-41d4-a716-446655440000/settings HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "omni_enabled": true,
  "omni_config": {
    "enabled": true,
    "instance": "project-specific-instance",
    "recipient": "project-lead@example.com",
    "recipient_type": "UserId"
  }
}
```

**Request Body Schema**: Same as global config (`ForgeProjectSettings`)

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": ForgeProjectSettings,  // Updated project settings
  "error_data": null,
  "message": null
}
```

**Use Cases**:
- Different notification recipients per project
- Project-specific Evolution API instances
- Disable Omni for specific projects while keeping it globally enabled

---

## Filesystem Endpoints

### `GET /api/filesystem/tree`
List directory contents (file tree browser).

**Authentication**: Required

**Query Parameters**:
- `path` (string, optional) - Directory path to list (defaults to project root)
- `project_id` (UUID, optional) - Project context (may be required depending on implementation)

**Request**:
```http
GET /api/filesystem/tree?path=/src/components HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "entries": [
      {
        "name": "Header.tsx",
        "path": "/src/components/Header.tsx",
        "is_directory": false,
        "is_git_repo": false,
        "last_modified": 1234567890000  // Unix timestamp in milliseconds (bigint)
      },
      {
        "name": "Footer",
        "path": "/src/components/Footer",
        "is_directory": true,
        "is_git_repo": false,
        "last_modified": 1234567890000
      }
    ],
    "current_path": "/src/components"
  },
  "error_data": null,
  "message": null
}
```

**Response Schema**:
```typescript
type DirectoryListResponse = {
  entries: Array<DirectoryEntry>,
  current_path: string
}

type DirectoryEntry = {
  name: string,                   // Filename or directory name
  path: string,                   // Full path
  is_directory: boolean,          // True for folders
  is_git_repo: boolean,           // True if .git present (for nested repos)
  last_modified: bigint | null    // Unix timestamp (ms), null if unavailable
}
```

**Use Cases**:
- File browser UI
- Navigate project structure
- Select files for task context

---

### `GET /api/filesystem/file`
Read file contents.

**Authentication**: Required

**Query Parameters**:
- `path` (string, required) - File path to read
- `project_id` (UUID, optional) - Project context

**Request**:
```http
GET /api/filesystem/file?path=/src/main.rs HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```http
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8

fn main() {
    println!("Hello, world!");
}
```

**Response Format**:
- **Content-Type**: Detected from file extension (text/plain, application/json, etc.)
- **Body**: Raw file contents

**Error Responses**:
- `404` - File not found
- `403` - Access denied (outside project directory)
- `500` - Read error

**Use Cases**:
- Display file contents in UI
- Code preview
- Task description context

---

## Application Configuration Endpoints

### `GET /api/config`
Get user application configuration.

**Authentication**: Required

**Request**:
```http
GET /api/config HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "config": {
      "config_version": "1",
      "theme": "DARK" | "LIGHT" | "SYSTEM",
      "executor_profile": {
        "executor": "CLAUDE_CODE" | "CURSOR" | "GEMINI" | "CODEX" | "AMP" | "OPENCODE" | "QWEN_CODE" | "COPILOT",
        "variant": string | null  // e.g., "PLAN", "ROUTER"
      },
      "disclaimer_acknowledged": boolean,
      "onboarding_acknowledged": boolean,
      "github_login_acknowledged": boolean,
      "telemetry_acknowledged": boolean,
      "notifications": {
        "sound_enabled": boolean,
        "push_enabled": boolean,
        "sound_file": "ABSTRACT_SOUND1" | "ABSTRACT_SOUND2" | "ABSTRACT_SOUND3" | "ABSTRACT_SOUND4" | "COW_MOOING" | "PHONE_VIBRATION" | "ROOSTER"
      },
      "editor": {
        "editor_type": "VS_CODE" | "CURSOR" | "WINDSURF" | "INTELLI_J" | "ZED" | "XCODE" | "CUSTOM",
        "custom_command": string | null
      },
      "github": {
        "pat": string | null,               // Personal Access Token
        "oauth_token": string | null,       // OAuth token from device flow
        "username": string | null,
        "primary_email": string | null,
        "default_pr_base": string | null    // Default base branch for PRs (e.g., "main")
      },
      "analytics_enabled": boolean | null,
      "workspace_dir": string | null,
      "last_app_version": string | null,
      "show_release_notes": boolean,
      "language": "BROWSER" | "EN" | "JA" | "ES" | "KO",
      "git_branch_prefix": string,          // e.g., "forge/" or "vk/"
      "showcases": {
        "seen_features": Array<string>
      }
    },
    "environment": {
      "os_type": string,              // e.g., "Linux", "Darwin", "Windows"
      "os_version": string,
      "os_architecture": string,      // e.g., "x86_64", "aarch64"
      "bitness": string              // "64", "32"
    },
    "capabilities": {
      "CLAUDE_CODE": ["SESSION_FORK"] | [],
      // ... per-executor capability flags
    },
    "executors": {
      "CLAUDE_CODE": {
        "default": {
          "append_prompt": string | null,
          "claude_code_router": boolean | null,
          "plan": boolean | null,
          "approvals": boolean | null,
          "model": string | null,
          "dangerously_skip_permissions": boolean | null,
          "base_command_override": string | null,
          "additional_params": Array<string> | null
        },
        "PLAN": { /* variant config */ },
        // ... other variants
      },
      // ... other executors
    }
  },
  "error_data": null,
  "message": null
}
```

**Response Schema**:
```typescript
type UserSystemInfo = {
  config: Config,
  environment: Environment,
  capabilities: { [executor: string]: Array<"SESSION_FORK"> },
  executors: { [executor: string]: ExecutorConfig }
}
```

**What You Can Read**:
- **Theme**: UI dark/light mode preference
- **Executor Profile**: Default AI agent (Claude Code, Cursor, etc.) + variant
- **Onboarding State**: Which acknowledgements/showcases user has seen
- **GitHub Integration**: OAuth token, username, email, default PR base
- **Editor Preference**: Which code editor to open (VS Code, Cursor, etc.)
- **Notifications**: Sound/push settings
- **Executor Configurations**: Per-agent settings (models, flags, command overrides)
- **System Info**: OS, architecture for platform-specific features

---

### `PUT /api/config`
Update user application configuration.

**Authentication**: Required

**Request**:
```http
PUT /api/config HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "DARK",
  "executor_profile": {
    "executor": "CLAUDE_CODE",
    "variant": null
  },
  "github": {
    "default_pr_base": "develop"
  },
  "notifications": {
    "sound_enabled": false,
    "push_enabled": true,
    "sound_file": "ABSTRACT_SOUND2"
  }
}
```

**Request Body Schema**: Partial `Config` (only include fields to update)

```typescript
type UpdateConfigRequest = Partial<Config>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": Config,  // Full updated config
  "error_data": null,
  "message": null
}
```

**Updateable Fields**:
- `theme`, `executor_profile`, `notifications`, `editor`, `github`, `analytics_enabled`
- `workspace_dir`, `show_release_notes`, `language`, `git_branch_prefix`, `showcases`
- Acknowledgement flags: `disclaimer_acknowledged`, `onboarding_acknowledged`, `github_login_acknowledged`, `telemetry_acknowledged`

**Use Cases**:
- Save user preferences
- Update default executor
- Change GitHub PR base branch
- Toggle analytics/telemetry
- Mark onboarding steps as complete

---

## Container/Worktree Endpoints

### `GET /api/containers`
List all containers (git worktrees for task attempts).

**Authentication**: Required

**Query Parameters**: None

**Request**:
```http
GET /api/containers HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "task_attempt_id": "660e8400-e29b-41d4-a716-446655440000",
      "path": "/path/to/worktrees/forge-1a2b-fix-auth",
      "branch": "forge/1a2b-fix-auth",
      "created_at": "2025-10-20T12:00:00Z"
    }
  ],
  "error_data": null,
  "message": null
}
```

**Response Schema**:
```typescript
type Container = {
  id: string,                    // Container UUID
  task_attempt_id: string,       // Associated task attempt
  path: string,                  // Worktree filesystem path
  branch: string,                // Git branch name
  created_at: string             // ISO 8601 timestamp
}
```

**What This Shows**:
- All active git worktrees
- Which task attempts have isolated workspaces
- Where to find code for each attempt

**Use Cases**:
- Show active workspaces
- Debug worktree issues
- Clean up orphaned worktrees

---

### `GET /api/containers/{id}`
Get details for a specific container.

**Authentication**: Required

**Path Parameters**:
- `id` (UUID, required) - Container identifier

**Request**:
```http
GET /api/containers/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer <token>
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "task_attempt_id": "660e8400-e29b-41d4-a716-446655440000",
    "path": "/path/to/worktrees/forge-1a2b-fix-auth",
    "branch": "forge/1a2b-fix-auth",
    "created_at": "2025-10-20T12:00:00Z",
    "status": "active" | "orphaned" | "deleted",
    "disk_usage_bytes": 1234567890
  },
  "error_data": null,
  "message": null
}
```

**Error Responses**:
- `404` - Container not found

---

## Authentication Flow

### `POST /api/auth/github/device`
Initiate GitHub OAuth device flow.

**Authentication**: None required

**Request**:
```http
POST /api/auth/github/device HTTP/1.1
Content-Type: application/json
```

**Response** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "device_code": "abc123def456...",           // Use for polling
    "user_code": "WDJB-MJHT",                   // Show to user
    "verification_uri": "https://github.com/login/device",
    "expires_in": 900,                          // Seconds (15 min)
    "interval": 5                               // Poll every 5 seconds
  },
  "error_data": null,
  "message": null
}
```

**Client Flow**:
1. Call this endpoint
2. Display `user_code` to user
3. Direct user to `verification_uri`
4. User enters `user_code` on GitHub
5. Poll `/api/auth/github/device/poll` every `interval` seconds

---

### `POST /api/auth/github/device/poll`
Poll for OAuth token after user authorizes.

**Authentication**: None required

**Request**:
```http
POST /api/auth/github/device/poll HTTP/1.1
Content-Type: application/json

{
  "device_code": "abc123def456..."
}
```

**Responses**:

**Pending** (`200 OK`):
```typescript
{
  "success": false,
  "data": null,
  "error_data": {
    "status": "AUTHORIZATION_PENDING"
  },
  "message": "User hasn't authorized yet"
}
```

**Success** (`200 OK`):
```typescript
{
  "success": true,
  "data": {
    "status": "SUCCESS",
    "access_token": "gho_abc123...",     // Use as Bearer token
    "scope": "user:email,repo",
    "token_type": "bearer"
  },
  "error_data": null,
  "message": null
}
```

**Slow Down** (`429 Too Many Requests`):
```typescript
{
  "success": false,
  "data": null,
  "error_data": {
    "status": "SLOW_DOWN"
  },
  "message": "Polling too fast, increase interval"
}
```

**Client Behavior**:
- Poll every `interval` seconds from initial response
- Stop on `SUCCESS` or `SLOW_DOWN`
- Increase interval if `SLOW_DOWN` received
- Timeout after `expires_in` seconds

---

## Standard Response Wrapper

All endpoints (except `/api/filesystem/file`) use this wrapper:

```typescript
type ApiResponse<T, E = T> = {
  success: boolean,
  data: T | null,           // Present when success=true
  error_data: E | null,     // Present when success=false
  message: string | null    // Human-readable message
}
```

---

## TypeScript Type Imports

All types are auto-generated from Rust:

```typescript
// Core types
import type {
  DirectoryEntry,
  DirectoryListResponse,
  Config,
  UserSystemInfo,
  ApiResponse
} from './shared/types'

// Forge extension types
import type {
  ForgeProjectSettings,
  OmniConfig,
  RecipientType,
  OmniInstance
} from './shared/forge-types'
```

---

## CORS Configuration

**CORS is FULLY OPEN** for cross-origin requests:

```rust
// forge-app/src/router.rs:74-78
let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods([GET, POST, PUT, DELETE, OPTIONS])
    .allow_headers(Any);
```

✅ **Your Genie frontend can call Forge from ANY origin without restrictions!**

---

## Additional Endpoints

For the complete API surface (~59 endpoints), see:
- **Interactive Swagger UI**: `GET /docs`
- **OpenAPI Spec**: `GET /api/openapi.json`
- **Route Listing**: `GET /api/routes`

---

## Key Capabilities You Can Build

### 1. **Fully Custom Frontend**
- Authenticate users via GitHub device flow
- Manage projects, tasks, and task attempts
- Stream real-time logs and diffs via SSE
- Configure Forge settings (global + per-project)
- Browse project files and read contents

### 2. **Multi-Tenant Dashboards**
- Per-project Omni notification settings
- Different Evolution API instances per project
- Custom executor profiles per project

### 3. **Integration Platforms**
- Embed Forge task execution in your own tools
- Cross-application workflows (Genie ↔ Forge)
- Unified authentication across services

---

## Examples

### Complete Authentication Flow
```typescript
// 1. Start device flow
const deviceResp = await fetch('http://localhost:8888/api/auth/github/device', {
  method: 'POST'
})
const { device_code, user_code, verification_uri, interval } = (await deviceResp.json()).data

// 2. Show user code
console.log(`Visit ${verification_uri} and enter: ${user_code}`)

// 3. Poll for token
let token: string | null = null
while (!token) {
  await new Promise(r => setTimeout(r, interval * 1000))

  const pollResp = await fetch('http://localhost:8888/api/auth/github/device/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_code })
  })

  const result = await pollResp.json()
  if (result.success && result.data.status === 'SUCCESS') {
    token = result.data.access_token
  }
}

// 4. Use token
const projectsResp = await fetch('http://localhost:8888/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const projects = (await projectsResp.json()).data
```

### Configure Omni Per-Project
```typescript
const projectId = '550e8400-e29b-41d4-a716-446655440000'

await fetch(`http://localhost:8888/api/forge/projects/${projectId}/settings`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    omni_enabled: true,
    omni_config: {
      enabled: true,
      instance: 'project-alpha-whatsapp',
      recipient: '+15551234567',
      recipient_type: 'PhoneNumber'
    }
  })
})
```

### Browse Files
```typescript
// List directory
const treeResp = await fetch(
  'http://localhost:8888/api/filesystem/tree?path=/src',
  { headers: { 'Authorization': `Bearer ${token}` } }
)
const { entries, current_path } = (await treeResp.json()).data

// Read file
const fileResp = await fetch(
  'http://localhost:8888/api/filesystem/file?path=/src/main.rs',
  { headers: { 'Authorization': `Bearer ${token}` } }
)
const fileContents = await fileResp.text()
```

---

## Notes

- **Upstream Submodule**: Full implementation details for filesystem/config/containers are in `upstream/crates/server/src/routes/` (submodule not initialized in this worktree)
- **Type Safety**: All TypeScript types are auto-generated via `ts-rs` from Rust - run `cargo run -p server --bin generate_types` and `cargo run -p forge-app --bin generate_forge_types` after Rust changes
- **CORS**: No restrictions - call from any origin
- **Rate Limiting**: None currently implemented (except GitHub device flow polling)
- **Pagination**: Not implemented yet (may be added for large lists)

---

**End of Reference**
