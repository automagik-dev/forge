# Automagik Forge Authentication System

## Overview

Automagik Forge uses **GitHub OAuth with Device Flow** for authentication. This authentication method is particularly well-suited for CLI applications and desktop tools where traditional web-based OAuth flows are inconvenient.

## Architecture

### Authentication Flow

```
┌─────────────────┐
│   User/Client   │
└────────┬────────┘
         │ 1. Request device code
         ▼
┌────────────────────────┐
│  Forge Backend API     │
│  /api/auth/github/     │
│      device            │
└────────┬───────────────┘
         │ 2. Returns device_code,
         │    user_code, verification_uri
         ▼
┌──────────────────────────┐
│  User visits GitHub URL  │
│  and enters user_code    │
└──────────────────────────┘
         │
         │ 3. User authorizes
         ▼
┌────────────────────────────┐
│  Frontend polls            │
│  /api/auth/github/device/  │
│  poll with device_code     │
└────────┬───────────────────┘
         │ 4. Returns access_token
         │    when authorized
         ▼
┌────────────────────────────┐
│  Client stores session     │
│  token for subsequent      │
│  requests                  │
└────────────────────────────┘
```

## Device Flow Endpoints

### 1. Initiate Device Flow

**Endpoint:** `POST /api/auth/github/device`

**Description:** Initiates the GitHub OAuth device flow by requesting a device code.

**Response:**
```json
{
  "device_code": "3584d83530557fdd1f46af8289938c8ef79f9dc5",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
```

**Fields:**
- `device_code`: The device verification code (used for polling)
- `user_code`: The code the user enters on GitHub
- `verification_uri`: The URL the user visits to authorize
- `expires_in`: Number of seconds the codes are valid
- `interval`: Minimum number of seconds between polling requests

### 2. Poll for Authorization

**Endpoint:** `POST /api/auth/github/device/poll`

**Request Body:**
```json
{
  "device_code": "3584d83530557fdd1f46af8289938c8ef79f9dc5"
}
```

**Success Response:**
```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "user:email,repo"
}
```

**Pending Response (user hasn't authorized yet):**
```json
{
  "error": "authorization_pending",
  "error_description": "The authorization request is still pending"
}
```

**Error Responses:**
- `slow_down`: Client is polling too frequently
- `expired_token`: The device code has expired
- `access_denied`: User denied the authorization request

### 3. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Invalidates the current session token.

**Headers:**
```
Authorization: Bearer <session_token>
```

## Using Authentication in API Requests

Once authenticated, include the session token in the `Authorization` header for all subsequent API requests:

```bash
curl -H "Authorization: Bearer <session_token>" \
     https://localhost:3001/api/projects
```

## Required GitHub OAuth Scopes

The application requests the following GitHub scopes:

- **`user:email`**: Read user email addresses
- **`repo`**: Full control of private repositories (required for worktree management and PR creation)

## Configuration

### Environment Variables

- **`GITHUB_CLIENT_ID`** (Build-time): GitHub OAuth App Client ID
  - Default: `Ov23li2nd1KF5nCPbgoj` (official Automagik Forge app)
  - Custom: Set during build to use your own GitHub OAuth app

### Creating a Custom GitHub OAuth App

For self-hosting with custom branding:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your application name
   - **Homepage URL**: Your application homepage
   - **Authorization callback URL**: Not used (device flow)
4. Enable **Device Flow** in the app settings
5. Set the required scopes: `user:email`, `repo`
6. Copy the **Client ID**
7. Build Forge with your client ID:
   ```bash
   GITHUB_CLIENT_ID=your_client_id pnpm run build
   ```

## Security Considerations

### Token Storage

- Session tokens are stored in the frontend (browser localStorage or similar)
- Tokens are transmitted via HTTPS only in production
- Backend validates tokens on every authenticated request

### Token Expiration

- GitHub access tokens do not expire unless explicitly revoked
- Session tokens can be invalidated via the logout endpoint
- Users should log out when done to prevent unauthorized access

### Rate Limiting

- GitHub enforces rate limits on device flow authorization attempts
- Frontend should respect the `interval` value returned from the device endpoint
- Implement exponential backoff if receiving `slow_down` errors

## Implementation Details

### Backend (Rust/Axum)

The authentication logic is implemented in the upstream `server` crate under `routes/auth.rs`. Key components:

- **Device Flow Handler**: Initiates the flow with GitHub
- **Poll Handler**: Checks authorization status
- **Middleware**: Validates session tokens on protected routes
- **Session Management**: Stores and validates active sessions

### Frontend (React/TypeScript)

The frontend implements:

- **Auth Context**: Manages authentication state globally
- **Device Flow UI**: Displays the user code and verification URL
- **Polling Logic**: Automatically polls for authorization
- **Token Storage**: Securely stores and manages session tokens
- **Protected Routes**: Redirects unauthenticated users to login

## Testing Authentication

### Manual Testing

1. Start the backend server:
   ```bash
   cargo run -p forge-app --bin forge-app
   ```

2. Test device flow initiation:
   ```bash
   curl -X POST http://localhost:3001/api/auth/github/device
   ```

3. Visit the returned `verification_uri` and enter the `user_code`

4. Poll for authorization:
   ```bash
   curl -X POST http://localhost:3001/api/auth/github/device/poll \
        -H "Content-Type: application/json" \
        -d '{"device_code":"YOUR_DEVICE_CODE"}'
   ```

5. Use the returned token:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3001/api/projects
   ```

### Automated Testing

The authentication flow can be tested programmatically:

```typescript
// Example: Frontend auth hook
const { login, logout, isAuthenticated } = useAuth();

// Initiate login
await login();

// Check auth status
if (isAuthenticated) {
  // Make authenticated requests
}

// Logout
await logout();
```

## Troubleshooting

### Common Issues

1. **"authorization_pending" for too long**
   - User hasn't completed authorization on GitHub
   - Device code may have expired (900 seconds)
   - Start a new device flow

2. **"slow_down" error**
   - Polling too frequently
   - Respect the `interval` value from the device endpoint
   - Implement exponential backoff

3. **"Invalid token" on API requests**
   - Token may have been revoked
   - Session may have expired
   - Re-authenticate via device flow

4. **GitHub OAuth app not configured**
   - Ensure `GITHUB_CLIENT_ID` is set during build
   - Verify the OAuth app has device flow enabled
   - Check that required scopes are configured

## References

- [GitHub OAuth Device Flow Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)
- [Automagik Forge API Documentation](/docs)
- [GitHub OAuth App Settings](https://github.com/settings/developers)
