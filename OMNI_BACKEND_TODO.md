# Omni Backend Implementation TODO

The Omni integration frontend components have been restored, but the backend endpoints are missing.
These endpoints were previously implemented in the old "Forge Override" codebase and need to be re-implemented.

## Required Backend Endpoints

### 1. **GET `/api/forge/config`**
- **Purpose**: Retrieve global Forge project settings including Omni configuration
- **Response**: `ForgeProjectSettings` object
- **TypeScript Type**:
```typescript
interface ForgeProjectSettings {
  omni_enabled: boolean;
  omni_config: OmniConfig;
}

interface OmniConfig {
  enabled: boolean;
  host: string | null;        // e.g., "http://localhost:8882"
  api_key: string | null;     // Omni API key
  instance: string | null;    // Omni instance name
  recipient: string | null;   // Phone number or user ID
  recipient_type: RecipientType | null;  // "PhoneNumber" | "UserId"
}
```

### 2. **PUT `/api/forge/config`**
- **Purpose**: Update global Forge project settings
- **Request Body**: `ForgeProjectSettings` object
- **Response**: Success/error status

### 3. **GET `/api/forge/omni/instances`**
- **Purpose**: List available Omni instances from the configured Omni server
- **Response**:
```typescript
{
  instances: Array<{
    id: string;
    name: string;
    status: string;
    // ... other instance properties
  }>
}
```
- **Notes**:
  - Requires valid `omni_config.host` and `omni_config.api_key` to be set
  - Makes request to Omni server at `{host}/instances` or similar
  - Returns list of available WhatsApp instances

## Implementation Notes

### Storage
- Forge settings should be stored in SQLite database
- Suggested table: `forge_settings` with JSON column for configuration
- Or add columns to existing `projects` table

### Security
- Omni API key should be encrypted at rest
- Consider using environment variables for sensitive defaults
- Validate Omni server host URLs (prevent SSRF)

### Omni Server Integration
The Omni server is a separate WhatsApp bot service (likely running on port 8882 locally).
Backend needs to:
1. Proxy requests to Omni server
2. Handle authentication with Omni API key
3. Transform responses to match frontend expectations

### Error Handling
- Return appropriate error messages when Omni server is unreachable
- Validate configuration before attempting Omni connections
- Provide clear feedback when API key is invalid

## Testing Checklist
- [ ] GET `/api/forge/config` returns default settings when unconfigured
- [ ] PUT `/api/forge/config` persists settings to database
- [ ] PUT `/api/forge/config` validates Omni configuration
- [ ] GET `/api/forge/omni/instances` requires valid host + API key
- [ ] GET `/api/forge/omni/instances` handles Omni server errors gracefully
- [ ] API key is encrypted in database
- [ ] Settings persist across server restarts

## Frontend Components Using These Endpoints

1. **OmniCard.tsx** - Settings card in project configuration
   - Displays connection status
   - Shows configured recipient
   - "Disconnect" button

2. **OmniModal.tsx** - Configuration dialog
   - Host input field
   - API key input field
   - Instance selector (fetches from `/api/forge/omni/instances`)
   - Recipient input
   - Recipient type selector

3. **forge-api.ts** - API client wrapper
   - `forgeApi.getGlobalSettings()`
   - `forgeApi.setGlobalSettings(settings)`
   - `forgeApi.listOmniInstances()`

## Migration from Old Backend

If the old "Forge Override" backend code exists:
1. Locate the Omni endpoint handlers
2. Port the logic to current crate structure (likely `crates/server/src/routes/forge/`)
3. Update database schema if needed
4. Ensure encryption/security is maintained
5. Add tests

## Priority

**HIGH** - User explicitly wants Omni integration restored.
This should be implemented soon to restore full functionality.
