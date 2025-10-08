# Rust Backend Analysis - Forge Extensions

## Overview

Forge extends upstream with **2 backend extensions**: Omni and Config.

## forge-extensions/ Structure

```
forge-extensions/
├── omni/           # WhatsApp/Discord/Telegram notifications
│   ├── src/
│   │   ├── lib.rs       # Public API exports
│   │   ├── client.rs    # HTTP client for Omni server
│   │   ├── service.rs   # OmniService for sending notifications
│   │   └── types.rs     # OmniConfig, OmniInstance, SendTextRequest, etc.
│   └── Cargo.toml
└── config/         # Project configuration storage
    ├── src/
    │   ├── lib.rs       # Public API exports
    │   ├── service.rs   # ForgeConfigService for DB persistence
    │   └── types.rs     # ForgeProjectSettings (omni_enabled + omni_config)
    └── Cargo.toml
```

## Extension: Omni (forge-extensions/omni/)

### Purpose
Integrates WhatsApp, Discord, and Telegram notifications for task completion events.

### Key Types (types.rs - 152 lines)

**OmniConfig** - Configuration for Omni server connection:
- `enabled: bool`
- `host: Option<String>` - Omni server URL
- `api_key: Option<String>` - Authentication key
- `instance: Option<String>` - WhatsApp/Discord/Telegram instance ID
- `recipient: Option<String>` - Phone number or user ID
- `recipient_type: Option<RecipientType>` - PhoneNumber | UserId

**OmniInstance** - Available notification channels:
- `instance_name: String` - e.g., "felipe0008"
- `channel_type: String` - "whatsapp", "discord", "telegram"
- `display_name: String` - UI display name
- `status: String` - Connection status
- `is_healthy: bool` - Health check result

**SendTextRequest** - Message sending payload:
- `phone_number: Option<String>`
- `user_id: Option<String>`
- `text: String` - Message content

**SendTextResponse** - API response:
- `success: bool`
- `message_id: Option<String>`
- `status: String`
- `error: Option<String>`

### Service (service.rs)

**OmniService** - Business logic:
- `list_instances()` - Fetch available channels from Omni server
- `send_notification()` - Send message via Omni API
- HTTP client with reqwest, error handling

### Client (client.rs)

**OmniClient** - Low-level HTTP client:
- Handles authentication headers
- Parses Omni API responses
- Error conversion from reqwest

### TypeScript Integration

Uses `#[derive(TS)]` from `ts-rs` crate to generate TypeScript types:
- Exported to `shared/forge-types.ts` via `generate_forge_types` binary
- Frontend imports from `shared/forge-types`

## Extension: Config (forge-extensions/config/)

### Purpose
Stores and retrieves project-level Forge settings (currently only Omni config).

### Key Types (types.rs - 30 lines)

**ProjectConfig** - Generic project configuration:
- `project_id: Uuid`
- `custom_executors: Option<JsonValue>`
- `forge_config: Option<JsonValue>` - Stores ForgeProjectSettings as JSON

**ForgeProjectSettings** - Forge-specific settings:
- `omni_enabled: bool` - Master switch for Omni notifications
- `omni_config: Option<OmniConfig>` - Omni configuration (from omni extension)

### Service (service.rs)

**ForgeConfigService** - Database persistence:
- `get_project_config(project_id)` - Load from SQLite
- `update_project_config(project_id, config)` - Save to SQLite
- `get_forge_settings(project_id)` - Parse `forge_config` JSON into ForgeProjectSettings
- `update_forge_settings(project_id, settings)` - Serialize and save
- Uses `GLOBAL_PROJECT_ID` (Uuid::nil()) for global settings

### Database Schema

Stores in `project_config` table (inherited from upstream):
```sql
project_id UUID PRIMARY KEY
custom_executors JSON
forge_config JSON  -- Stores ForgeProjectSettings
```

## forge-app Integration (forge-app/src/)

### router.rs (Forge API Routes)

**Mounted at `/api/forge/*`:**

```rust
/api/forge/config                          GET, PUT - Global forge settings
/api/forge/projects/{id}/settings          GET, PUT - Project-specific settings
/api/forge/omni/status                     GET - Omni connection health
/api/forge/omni/instances                  GET - Available channels
/api/forge/omni/validate                   POST - Test Omni config
/api/forge/omni/notifications              GET - Notification history (future)
```

### services/mod.rs

**ForgeServices** - Aggregates all forge services:
```rust
pub struct ForgeServices {
    pub config: ForgeConfigService,
    pub omni: OmniService,
    pub deployment: Arc<DeploymentImpl>,
    // Other upstream services...
}
```

### main.rs

- Initializes ForgeServices with database pool
- Passes services to router
- Upstream services + Forge services composed together

### generate_forge_types.rs

- Binary that runs `ts-rs` export for forge extension types
- Generates `shared/forge-types.ts` from Rust structs
- Run via: `cargo run -p forge-app --bin generate_forge_types`

## Type Generation Flow

```
forge-extensions/omni/src/types.rs (#[derive(TS)])
        ↓
forge-app/src/bin/generate_forge_types.rs
        ↓
shared/forge-types.ts
        ↓
forge-overrides/frontend/src/components/omni/types.ts (imports)
        ↓
Frontend components
```

## Summary

### Backend Files to KEEP (All Rust):
- `forge-extensions/omni/*` (7 files: lib.rs, client.rs, service.rs, types.rs, Cargo.toml, tests)
- `forge-extensions/config/*` (5 files: lib.rs, service.rs, types.rs, Cargo.toml)
- `forge-app/src/*` (4 files: main.rs, router.rs, services/mod.rs, bin/generate_forge_types.rs)
- `forge-app/Cargo.toml`

### Backend Files to DELETE:
**NONE** - All forge backend code is for Omni feature.

### Backend to MOVE:
**NONE** - Omni is Forge-specific, not upstream functionality.

## Conclusion

**Rust backend is 100% Omni feature.**
- Config extension exists solely to persist Omni settings
- No branding-only backend overrides
- All code provides real functionality
- **All backend code stays in forge-extensions/**
