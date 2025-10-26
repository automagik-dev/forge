#!/usr/bin/env node

/**
 * Automagik Forge Release Bumper
 *
 * Creates RC (release candidate) versions for Rust + Node hybrid project
 *
 * Usage:
 *   pnpm bump:patch  → 0.4.5 → 0.4.6-rc.1
 *   pnpm bump:minor  → 0.4.5 → 0.5.0-rc.1
 *   pnpm bump:major  → 0.4.5 → 1.0.0-rc.1
 *   pnpm bump:rc     → 0.4.6-rc.1 → 0.4.6-rc.2
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUMP_TYPE = process.argv[2];
const NO_PUSH = process.argv[3] === '--no-push' || process.env.SKIP_PUSH === 'true';
const PKG_PATH = path.join(__dirname, '..', 'package.json');
const NPX_CLI_PKG_PATH = path.join(__dirname, '..', 'npx-cli', 'package.json');
const FRONTEND_PKG_PATH = path.join(__dirname, '..', 'frontend', 'package.json');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function exec(cmd, silent = false) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return result ? result.trim() : '';
  } catch (error) {
    if (!silent) throw error;
    return '';
  }
}

// Pre-flight checks
function preflight() {
  log('blue', '🔍', 'Running pre-flight checks...');

  // Check git status
  const status = exec('git status --porcelain', true);
  if (status) {
    log('red', '❌', 'Working directory not clean. Commit or stash changes first.');
    process.exit(1);
  }

  // Check on main branch
  const branch = exec('git branch --show-current', true);
  if (branch !== 'main') {
    log('yellow', '⚠️', `You're on branch '${branch}', not main. Continue? (Ctrl+C to abort)`);
  }

  log('green', '✅', 'Pre-flight checks passed');
}

// Parse current version
function parseVersion(version) {
  const rcMatch = version.match(/^(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$/);
  if (rcMatch) {
    return {
      major: parseInt(rcMatch[1]),
      minor: parseInt(rcMatch[2]),
      patch: parseInt(rcMatch[3]),
      rc: parseInt(rcMatch[4]),
      isRC: true,
    };
  }

  const stableMatch = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (stableMatch) {
    return {
      major: parseInt(stableMatch[1]),
      minor: parseInt(stableMatch[2]),
      patch: parseInt(stableMatch[3]),
      rc: 0,
      isRC: false,
    };
  }

  throw new Error(`Invalid version format: ${version}`);
}

// Calculate new version
function calculateNewVersion(current, bumpType) {
  const parsed = parseVersion(current);

  switch (bumpType) {
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-rc.1`;

    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0-rc.1`;

    case 'major':
      return `${parsed.major + 1}.0.0-rc.1`;

    case 'rc-increment':
      if (!parsed.isRC) {
        log('red', '❌', `Current version ${current} is not an RC. Use bump:patch/minor/major instead.`);
        process.exit(1);
      }
      return `${parsed.major}.${parsed.minor}.${parsed.patch}-rc.${parsed.rc + 1}`;

    default:
      throw new Error(`Invalid bump type: ${bumpType}`);
  }
}

// Update Cargo.toml files
function updateCargoToml(filePath, newVersion) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${newVersion}"`
  );
  fs.writeFileSync(filePath, updated);
}

// Find all Cargo.toml files (excluding upstream)
function findCargoTomls() {
  const result = exec('find . -name Cargo.toml -not -path "./upstream/*"', true);
  return result.split('\n').filter(Boolean).map(p => path.join(__dirname, '..', p));
}

// Main logic
function main() {
  if (!['patch', 'minor', 'major', 'rc-increment'].includes(BUMP_TYPE)) {
    log('red', '❌', 'Usage: node scripts/bump.cjs <patch|minor|major|rc-increment>');
    process.exit(1);
  }

  preflight();

  // Read current version
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  const currentVersion = pkg.version;
  const newVersion = calculateNewVersion(currentVersion, BUMP_TYPE);

  log('magenta', '🎯', `Bumping: ${currentVersion} → ${newVersion}`);

  // Update root package.json
  pkg.version = newVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
  log('green', '✅', 'Updated package.json');

  // Update npx-cli package.json
  const npxPkg = JSON.parse(fs.readFileSync(NPX_CLI_PKG_PATH, 'utf8'));
  npxPkg.version = newVersion;
  fs.writeFileSync(NPX_CLI_PKG_PATH, JSON.stringify(npxPkg, null, 2) + '\n');
  log('green', '✅', 'Updated npx-cli/package.json');

  // Update frontend package.json
  const frontendPkg = JSON.parse(fs.readFileSync(FRONTEND_PKG_PATH, 'utf8'));
  frontendPkg.version = newVersion;
  fs.writeFileSync(FRONTEND_PKG_PATH, JSON.stringify(frontendPkg, null, 2) + '\n');
  log('green', '✅', 'Updated frontend/package.json');

  // Update all Cargo.toml files
  const cargoTomls = findCargoTomls();
  log('blue', '📦', `Updating ${cargoTomls.length} Cargo.toml files...`);
  cargoTomls.forEach(file => {
    updateCargoToml(file, newVersion);
  });
  log('green', '✅', 'Updated all Cargo.toml files');

  // Git operations
  exec('git add package.json npx-cli/package.json frontend/package.json');
  exec(`git add ${cargoTomls.join(' ')}`);

  // Stage pnpm lockfile if exists
  if (fs.existsSync(path.join(__dirname, '..', 'pnpm-lock.yaml'))) {
    exec('git add pnpm-lock.yaml');
  }

  // Stage Cargo.lock if exists and not ignored
  const cargoLockPath = path.join(__dirname, '..', 'Cargo.lock');
  if (fs.existsSync(cargoLockPath)) {
    const isIgnored = exec('git check-ignore Cargo.lock', true);
    if (!isIgnored) {
      exec('git add Cargo.lock');
    }
  }

  const commitMessage = `chore: pre-release v${newVersion}\n\nCo-authored-by: Automagik Genie 🧞 <genie@namastex.ai>`;

  exec(`git commit --no-verify -m "${commitMessage}"`);
  log('green', '✅', 'Created commit');

  exec(`git tag v${newVersion}`);
  log('green', '✅', `Tagged v${newVersion}`);

  // Push to trigger CI (unless --no-push flag is set)
  if (!NO_PUSH) {
    log('blue', '📤', 'Pushing to remote...');
    // Pull with rebase first to avoid conflicts if remote has new commits
    exec('git pull --rebase --no-verify');
    exec('git push --no-verify');
    exec('git push --no-verify --tags');

    log('green', '🎉', 'Release candidate created!');
    console.log('');

    // GitHub release and npm publish handled by unified-release.cjs in CI
    log('blue', '📦', `CI will publish: npm install automagik-forge@next`);
    log('blue', '🔗', 'Monitor CI: https://github.com/namastexlabs/automagik-forge/actions');
    console.log('');
    log('yellow', '💡', `When ready: pnpm release:stable`);
  } else {
    log('green', '🎉', 'Release candidate created locally!');
    log('yellow', '💡', `Tag: v${newVersion} (not pushed)`);
    console.log('');
    log('blue', '💡', 'Next: Push tag and create GitHub release');
  }
}

main();
