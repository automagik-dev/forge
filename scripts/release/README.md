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

**Removed features from old script:**
- Manual release notes generation (now GitHub auto-generates)
- Beta releases (can be added as separate module if needed)
- Interactive prompts for resuming failed releases (simplified workflow)
- Release notes enhancer script (GitHub --generate-notes handles this)

**Equivalent commands:**
```bash
# Old
./gh-build.sh publish

# New
node scripts/release/publish.js
# or
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
