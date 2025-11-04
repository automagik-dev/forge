# PostHog Source Maps Setup for GitHub Actions

## Overview

The `publish.yml` workflow now automatically uploads source maps to PostHog on every stable release. This enables error tracking with proper stack traces in PostHog.

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. POSTHOG_ENV_ID

**What is it:** Your PostHog project ID number

**How to find it:**
1. Go to https://us.i.posthog.com
2. Look at the URL when you're in your project
3. The number in the URL: `https://us.i.posthog.com/project/XXXXX`
4. That `XXXXX` is your project ID

**Example:** If your URL is `https://us.i.posthog.com/project/12345`, then your `POSTHOG_ENV_ID` is `12345`

### 2. POSTHOG_CLI_TOKEN

**What is it:** A Personal API Key with error tracking write permissions

**How to create it:**
1. Go to https://us.i.posthog.com/settings/user-api-keys
2. Click "Create personal API key"
3. Name it: `GitHub Actions Source Maps`
4. Set scope: **Write-only** (or select specific permissions for error tracking)
5. Click "Create key"
6. Copy the generated key (starts with `phx_...`)

**Important:** Save this key immediately - you won't be able to see it again!

## Adding Secrets to GitHub

### Option 1: Via GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `POSTHOG_ENV_ID`, Value: `your_project_id`
   - Name: `POSTHOG_CLI_TOKEN`, Value: `phx_your_token_here`

### Option 2: Via GitHub CLI

```bash
# Set POSTHOG_ENV_ID
gh secret set POSTHOG_ENV_ID --body "12345"

# Set POSTHOG_CLI_TOKEN (will prompt for value)
gh secret set POSTHOG_CLI_TOKEN
# Paste your token when prompted
```

## How It Works

When you create a stable release (convert from pre-release):

1. **Publish workflow** runs automatically
2. Downloads the release assets
3. Publishes to npm registry
4. **Uploads source maps** to PostHog:
   - Reads `frontend/dist` directory
   - Finds all `.js.map` files
   - Tags them with the release version (e.g., `v0.5.7`)
   - Uploads to PostHog for error tracking
5. Updates release description with success message

## Workflow Configuration

The source map upload step in `.github/workflows/publish.yml`:

```yaml
- name: Upload source maps to PostHog
  uses: PostHog/upload-source-maps@v0.4.6
  with:
    directory: frontend/dist           # Where built files are
    env-id: ${{ secrets.POSTHOG_ENV_ID }}
    cli-token: ${{ secrets.POSTHOG_CLI_TOKEN }}
    version: ${{ github.event.release.tag_name || inputs.tag_name }}
```

## Verifying It Works

After a release is published:

1. Check the **Actions** tab in GitHub
2. Find the "Publish to npm" workflow run
3. Look for the "Upload source maps to PostHog" step
4. Should show: ✅ Success

In PostHog:

1. Go to https://us.i.posthog.com
2. Navigate to **Error Tracking** → **Source Maps**
3. You should see your version listed (e.g., `v0.5.7`)
4. Errors will now show proper stack traces with original source code

## Troubleshooting

### Error: "Invalid API token"
- Check that `POSTHOG_CLI_TOKEN` starts with `phx_`
- Verify the token has write permissions
- Regenerate the token if needed

### Error: "Project not found"
- Verify `POSTHOG_ENV_ID` matches your project ID
- Check the URL in PostHog dashboard

### No source maps uploaded
- Verify `frontend/dist` directory exists after build
- Check that Vite is generating `.js.map` files
- Look at the workflow logs for errors

## Current Configuration

**Project:** Automagik Forge
**PostHog Instance:** https://us.i.posthog.com
**API Key (Write-only):** phc_KYI6y57aVECNO9aj5O28gNAz3r7BU0cTtEf50HQJZHd
**Build Output:** `frontend/dist`
**Trigger:** On stable release (when pre-release is converted)

## Next Steps

1. ✅ Workflow configured (done)
2. ⏳ Add GitHub secrets (`POSTHOG_ENV_ID` and `POSTHOG_CLI_TOKEN`)
3. ⏳ Create next stable release to test
4. ⏳ Verify source maps appear in PostHog
