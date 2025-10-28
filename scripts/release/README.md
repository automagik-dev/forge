# Release Scripts

Modular JavaScript-based release automation for Automagik Forge.

## Overview

This replaces the large `gh-build.sh` bash script with organized, maintainable JavaScript modules.

## Structure

```
scripts/release/
├── config.js              # Configuration and shared utilities
├── github.js              # GitHub API wrapper (using gh CLI)
├── version.js             # Version management utilities
├── publish.js             # Main entry point (orchestrates workflow)
├── monitor.js             # Monitor workflow runs
├── status.js              # Show release/workflow status
├── steps/
│   ├── step1-trigger-rc.js    # Trigger RC release workflow
│   ├── step2-build-platforms.js  # Build all platforms
│   └── step3-verify.js        # Verify release
└── package.json           # ES modules configuration
```

## Usage

### Publish RC Release (Main Workflow)

```bash
# From project root
make publish

# Or directly
node scripts/release/publish.js
```

### Monitor Workflow Run

```bash
# Monitor latest workflow run
node scripts/release/monitor.js

# Monitor specific run by ID
node scripts/release/monitor.js 18882820971
```

### Check Release Status

```bash
# Show latest workflows and status
node scripts/release/status.js
```

**This runs the complete workflow:**

1. **Step 1: Trigger RC Release**
   - Auto-increments RC version (0.5.0-rc.3 → 0.5.0-rc.4)
   - Runs tests
   - Creates GitHub pre-release with auto-generated notes

2. **Step 2: Build All Platforms**
   - Builds binaries for Linux, macOS, Windows
   - Publishes to npm @next tag
   - Uploads assets to GitHub release
   - Duration: ~30-45 minutes

3. **Step 3: Verify Release**
   - Checks GitHub release exists with assets
   - Verifies npm package published
   - Confirms git tag exists

## Key Features

### ✅ Modular & Maintainable
- Each step is a focused module (~50 lines)
- Main workflow reads like documentation
- Easy to understand and modify

### ✅ Clear Workflow
```javascript
// publish.js - reads like a workflow diagram
displayVersionInfo();
const { tag, version } = await triggerRcRelease();
await buildAllPlatforms(tag, version);
await verifyRelease(tag, version);
```

### ✅ Centralized Configuration
All config in one place (`config.js`):
- Repo name
- Workflow files
- Polling intervals
- Colors and logging

### ✅ Reusable Utilities
- `github.js` - GitHub API operations
- `version.js` - Version calculations
- Both can be imported by other scripts

## Comparison with Old System

| Aspect | Old (gh-build.sh) | New (JS modules) |
|--------|-------------------|------------------|
| Lines of code | 1166 lines | ~450 lines total |
| Organization | One large file | 8 focused files |
| Readability | Bash scripting | Modern JavaScript |
| Maintainability | Hard to modify | Easy to extend |
| Workflow clarity | Buried in logic | Explicit steps |

## Migration Notes

The old `gh-build.sh` is still available for reference, but the Makefile now uses these scripts by default.

**Migrated features:**
- ✅ `publish` - Full RC release pipeline (publish.js)
- ✅ `monitor [run_id]` - Monitor workflow runs (monitor.js)
- ✅ `status` - Show release/workflow status (status.js)

**Removed features (no longer needed):**
- ❌ Manual release notes generation (GitHub auto-generates)
- ❌ Beta releases (simplified workflow)
- ❌ Interactive prompts for resuming failed releases
- ❌ Artifact download commands (use `gh run download` directly)
- ❌ Manual npm publish commands (automated in workflow)

**Equivalent commands:**
```bash
# Old
./gh-build.sh publish
./gh-build.sh monitor [run_id]
./gh-build.sh status

# New
node scripts/release/publish.js
node scripts/release/monitor.js [run_id]
node scripts/release/status.js

# Or via Makefile
make publish
```

## Extending

To add new functionality:

1. Create new module in `steps/` directory
2. Export async function
3. Import and call in `publish.js`

Example:
```javascript
// steps/step4-promote-to-stable.js
export async function promoteToStable(tag, version) {
  // Implementation
}

// publish.js
import { promoteToStable } from './steps/step4-promote-to-stable.js';

// In workflow
await promoteToStable(tag, version);
```
