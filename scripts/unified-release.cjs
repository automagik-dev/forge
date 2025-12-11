#!/usr/bin/env node

/**
 * Unified Release Script for Forge
 * Handles all release scenarios: nightly, RC bump, stable promotion
 *
 * Usage:
 *   node scripts/unified-release.cjs [options]
 *
 * Options:
 *   --action nightly|bump-rc|promote   Release action to perform
 *   --dry-run                          Show what would be done without making changes
 *   --skip-cargo                       Skip Cargo.toml updates (for testing)
 *
 * Actions:
 *   nightly     - Create nightly build version (0.7.5-nightly.20251127)
 *   bump-rc     - Bump RC version (0.7.4 → 0.7.5-rc.1, or 0.7.5-rc.1 → 0.7.5-rc.2)
 *   promote     - Promote RC to stable (0.7.5-rc.2 → 0.7.5)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACKAGE_FILES = [
  path.join(ROOT, 'package.json'),
  path.join(ROOT, 'npx-cli', 'package.json'),
  path.join(ROOT, 'frontend', 'package.json'),
];

// Files containing forge-core git tag references
const FORGE_CORE_REF_FILES = [
  path.join(ROOT, 'forge-app', 'Cargo.toml'),
  path.join(ROOT, 'forge-extensions', 'config', 'Cargo.toml'),
];

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (color, emoji, msg) => console.log(`${COLORS[color]}${emoji} ${msg}${COLORS.reset}`);
const exec = (cmd, silent = false) => {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit', cwd: ROOT });
    return result ? result.trim() : '';
  } catch (e) {
    if (!silent) throw e;
    return '';
  }
};

// Parse arguments
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.replace(/^--/, '');
    const nextArg = args[i + 1];
    if (nextArg && !nextArg.startsWith('--')) {
      opts[key] = nextArg;
      i++;
    } else {
      opts[key] = true;
    }
  }
}

const dryRun = opts['dry-run'] || false;

/**
 * Read current version from root package.json
 */
function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILES[0], 'utf8'));
  return pkg.version;
}

/**
 * Sync forge-core version via GitHub repository_dispatch
 * Triggers forge-core workflow to bump version and create matching tag
 */
async function syncForgeCoreVersion(newVersion) {
  log('blue', '🔄', `Syncing forge-core to v${newVersion}`);

  if (dryRun) {
    log('cyan', '🔍', `Would dispatch sync-version event to forge-core with version=${newVersion}`);
    return;
  }

  const tag = `v${newVersion}`;

  // Check if tag already exists
  try {
    exec(`gh api repos/namastexlabs/forge-core/git/refs/tags/${tag}`, true);
    log('green', '✅', `forge-core tag ${tag} already exists`);
    return;
  } catch {
    // Tag doesn't exist, need to trigger sync
  }

  // Dispatch to forge-core to create the version
  log('blue', '📤', 'Dispatching sync-version event to forge-core...');
  try {
    exec(`gh workflow run sync-version-from-forge.yml --repo namastexlabs/forge-core -f version=${newVersion}`, true);
  } catch (e) {
    log('yellow', '⚠️', 'Could not dispatch to forge-core workflow (may not exist yet)');
    log('yellow', '💡', 'Create .github/workflows/sync-version-from-forge.yml in forge-core');
    return;
  }

  // Wait for tag to appear (poll for up to 2 minutes)
  log('blue', '⏳', `Waiting for forge-core tag ${tag}...`);
  const maxAttempts = 24; // 24 * 5s = 2 minutes
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000);
    try {
      exec(`gh api repos/namastexlabs/forge-core/git/refs/tags/${tag}`, true);
      log('green', '✅', `forge-core tag ${tag} created successfully`);
      return;
    } catch {
      // Tag not ready yet
      if ((i + 1) % 6 === 0) {
        log('blue', '⏳', `Still waiting... (${Math.floor((i + 1) * 5 / 60)}m${((i + 1) * 5) % 60}s)`);
      }
    }
  }

  log('yellow', '⚠️', `Timeout waiting for forge-core tag ${tag}`);
  log('yellow', '💡', 'You may need to manually create the tag in forge-core');
}

/**
 * Sleep helper for async operations
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update forge-core git tag references in Cargo.toml files
 */
function updateForgeCoreRefs(newVersion) {
  log('blue', '🔗', `Updating forge-core git tag refs to v${newVersion}`);

  const tagPattern = /tag = "v[\d.]+-?[a-zA-Z]*\.?\d*"/g;
  const newTag = `tag = "v${newVersion}"`;

  for (const cargoPath of FORGE_CORE_REF_FILES) {
    if (!fs.existsSync(cargoPath)) {
      log('yellow', '⚠️', `Skipping missing file: ${cargoPath}`);
      continue;
    }

    let content = fs.readFileSync(cargoPath, 'utf8');

    // Only replace tags for forge-core.git dependencies
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('forge-core.git') && lines[i].includes('tag = "')) {
        const oldLine = lines[i];
        lines[i] = lines[i].replace(tagPattern, newTag);
        if (oldLine !== lines[i]) {
          modified = true;
        }
      }
    }

    if (modified) {
      if (!dryRun) {
        fs.writeFileSync(cargoPath, lines.join('\n'));
      }
      log('green', '✅', `Updated forge-core refs in ${path.relative(ROOT, cargoPath)}`);
    }
  }
}

/**
 * Update all version files (package.json + Cargo.toml)
 */
function updateAllVersions(newVersion) {
  log('blue', '📝', `Updating all version files to ${newVersion}`);

  // Update package.json files
  for (const pkgPath of PACKAGE_FILES) {
    if (!fs.existsSync(pkgPath)) {
      log('yellow', '⚠️', `Skipping missing file: ${pkgPath}`);
      continue;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const oldVersion = pkg.version;
    pkg.version = newVersion;

    if (!dryRun) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }
    log('green', '✅', `${path.relative(ROOT, pkgPath)}: ${oldVersion} → ${newVersion}`);
  }

  // Update Cargo.toml workspace versions using direct file manipulation
  // This replaces cargo-edit dependency for more reliable CI behavior
  if (!opts['skip-cargo']) {
    log('blue', '📦', 'Updating Cargo.toml workspace versions...');

    const cargoFiles = [
      path.join(ROOT, 'Cargo.toml'),
      path.join(ROOT, 'forge-core', 'Cargo.toml'),
    ];

    for (const cargoPath of cargoFiles) {
      if (!fs.existsSync(cargoPath)) {
        log('yellow', '⚠️', `Skipping (not found): ${path.relative(ROOT, cargoPath)}`);
        continue;
      }

      let content = fs.readFileSync(cargoPath, 'utf8');

      // Match version in [workspace.package] section
      // Regex finds the section and updates the version line within it
      const lines = content.split('\n');
      let inWorkspacePackage = false;
      let modified = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\[workspace\.package\]/)) {
          inWorkspacePackage = true;
          continue;
        }
        if (lines[i].match(/^\[/) && inWorkspacePackage) {
          inWorkspacePackage = false;
          continue;
        }
        if (inWorkspacePackage && lines[i].match(/^version\s*=/)) {
          const oldLine = lines[i];
          lines[i] = `version = "${newVersion}"`;
          if (oldLine !== lines[i]) {
            modified = true;
          }
          break;
        }
      }

      if (modified) {
        if (!dryRun) {
          fs.writeFileSync(cargoPath, lines.join('\n'));
        }
        log('green', '✅', `Updated ${path.relative(ROOT, cargoPath)}`);
      } else {
        log('yellow', '⚠️', `No [workspace.package] version found in ${path.relative(ROOT, cargoPath)}`);
      }
    }
  }
}

/**
 * Create nightly version: 0.7.5-nightly.YYYYMMDD
 */
function createNightlyVersion(currentVersion) {
  // Strip any existing prerelease suffix
  const baseVersion = currentVersion.replace(/-.*$/, '');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${baseVersion}-nightly.${date}`;
}

/**
 * Bump RC version:
 *   0.7.4 → 0.7.5-rc.1
 *   0.7.5-rc.1 → 0.7.5-rc.2
 */
function bumpRcVersion(currentVersion) {
  const rcMatch = currentVersion.match(/^(\d+\.\d+\.\d+)-rc\.(\d+)$/);

  if (rcMatch) {
    // Already an RC, increment RC number
    const [, base, rcNum] = rcMatch;
    return `${base}-rc.${parseInt(rcNum) + 1}`;
  }

  // Not an RC, bump patch and start at rc.1
  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  const [, major, minor, patch] = match;
  return `${major}.${minor}.${parseInt(patch) + 1}-rc.1`;
}

/**
 * Promote RC to stable: 0.7.5-rc.2 → 0.7.5
 */
function promoteToStable(currentVersion) {
  const match = currentVersion.match(/^(\d+\.\d+\.\d+)-rc\.\d+$/);
  if (!match) {
    throw new Error(`Version ${currentVersion} is not an RC (expected format: X.Y.Z-rc.N)`);
  }
  return match[1];
}

/**
 * Create git tag
 */
function createTag(version) {
  const tag = `v${version}`;
  const commitMsg = `chore: release ${tag}`;

  if (dryRun) {
    log('cyan', '🔍', `Would commit: "${commitMsg}"`);
    log('cyan', '🔍', `Would create tag: ${tag}`);
    return tag;
  }

  // Stage all version changes
  exec('git add -A', true);

  // Commit
  try {
    exec(`git commit -m "${commitMsg}"`, true);
    log('green', '✅', `Committed: ${commitMsg}`);
  } catch (e) {
    log('yellow', '⚠️', 'Nothing to commit (versions may already be updated)');
  }

  // Create tag
  exec(`git tag -a ${tag} -m "Release ${tag}"`, true);
  log('green', '✅', `Created tag: ${tag}`);

  return tag;
}

/**
 * Output version and tag for GitHub Actions
 */
function outputForGitHubActions(version, tag) {
  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    fs.appendFileSync(output, `version=${version}\n`);
    fs.appendFileSync(output, `tag=${tag}\n`);
    fs.appendFileSync(output, `is_rc=${version.includes('-rc.') ? 'true' : 'false'}\n`);
    fs.appendFileSync(output, `is_nightly=${version.includes('-nightly.') ? 'true' : 'false'}\n`);
    fs.appendFileSync(output, `npm_tag=${version.includes('-rc.') ? 'next' : version.includes('-nightly.') ? 'nightly' : 'latest'}\n`);
  }
}

async function main() {
  log('cyan', '🚀', 'Forge Unified Release');

  if (dryRun) {
    log('yellow', '🔍', 'DRY RUN MODE - No changes will be made');
  }

  const action = opts['action'];
  if (!action) {
    log('red', '❌', 'Missing --action (nightly|bump-rc|promote)');
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  log('blue', '📌', `Current version: ${currentVersion}`);

  let newVersion;

  switch (action) {
    case 'nightly':
      newVersion = createNightlyVersion(currentVersion);
      log('magenta', '🌙', `Nightly version: ${newVersion}`);
      break;

    case 'bump-rc':
      newVersion = bumpRcVersion(currentVersion);
      log('magenta', '🔢', `RC version: ${currentVersion} → ${newVersion}`);
      break;

    case 'promote':
      newVersion = promoteToStable(currentVersion);
      log('magenta', '🎉', `Promoting: ${currentVersion} → ${newVersion}`);
      break;

    default:
      log('red', '❌', `Unknown action: ${action}`);
      process.exit(1);
  }

  // Update all version files
  updateAllVersions(newVersion);

  // Trigger forge-core version sync (for RC and stable releases)
  if (action === 'bump-rc' || action === 'promote') {
    await syncForgeCoreVersion(newVersion);
  }

  // Update forge-core git tag references
  updateForgeCoreRefs(newVersion);

  // Verify versions are in sync before creating tag
  if (!dryRun) {
    log('blue', '🔍', 'Verifying version consistency...');
    try {
      exec('./scripts/check-versions.sh', false);
      log('green', '✅', 'Version check passed');
    } catch (e) {
      log('red', '❌', 'Version check failed - aborting release');
      log('red', '💡', 'Run ./scripts/check-versions.sh to see details');
      process.exit(1);
    }
  }

  // Create git tag
  const tag = createTag(newVersion);

  // Output for GitHub Actions
  // Note: Release notes are auto-generated by GitHub via .github/release.yml
  outputForGitHubActions(newVersion, tag);

  log('green', '🎉', `Release ${tag} prepared!`);

  if (!dryRun) {
    log('cyan', '💡', 'Next steps:');
    log('cyan', '  ', '1. git push && git push --tags');
    log('cyan', '  ', '2. Wait for build-all-platforms workflow');
  }
}

main().catch(e => {
  log('red', '❌', e.message);
  process.exit(1);
});
