#!/usr/bin/env node

/**
 * Unified Release Script for Automagik Forge
 * Handles all release scenarios: RC bump, stable promotion, changelog generation
 *
 * Usage:
 *   node scripts/unified-release.cjs [options]
 *
 * Options:
 *   --bump rc|patch|minor|major   Auto-bump version
 *   --promote                      Promote RC to stable (0.4.6-rc.1 → 0.4.6)
 *   --tag v1.2.3                   Manual tag (skip bump)
 *   --publish                      Publish to npm
 *   --github-release               Create GitHub release
 *   --skip-tests                   Skip test execution
 *   --skip-build                   Skip building binaries
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PKG_PATH = path.join(__dirname, '..', 'package.json');
const NPX_CLI_PKG_PATH = path.join(__dirname, '..', 'npx-cli', 'package.json');

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
    const result = execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
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

async function main() {
  log('cyan', '🚀', 'Unified Release Flow - Automagik Forge');

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  let version = pkg.version;
  let bumpType = null;

  // Determine version
  if (opts['promote']) {
    bumpType = 'promote';
    version = promoteRcToStable(version);
    log('magenta', '📌', `Promoting RC → Stable: ${pkg.version} → ${version}`);
  } else if (opts['bump']) {
    bumpType = opts['bump'];

    // Auto-detect: if bump=rc but current version is stable, use patch instead
    if (bumpType === 'rc' && !version.includes('-rc.')) {
      log('yellow', '⚠️', `Current version ${version} is stable, using patch bump instead of rc increment`);
      bumpType = 'patch';
    }

    exec(`pnpm run bump:${bumpType}`);
    version = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')).version;
    log('magenta', '📌', `Bumped to: ${version}`);
  } else if (opts['tag']) {
    version = opts['tag'].replace(/^v/, '');
    log('magenta', '📌', `Using version: ${version}`);
  }

  // Generate changelog
  log('blue', '📝', 'Generating changelog...');
  const changelogContent = generateMechanicalChangelog(version);

  // Install dependencies and build frontend (required for Rust tests - RustEmbed needs frontend/dist)
  log('blue', '📦', 'Installing dependencies...');
  try {
    // Don't use --frozen-lockfile in CI since bump script creates commit before this runs
    exec('pnpm install');
    log('green', '✅', 'Dependencies installed');
  } catch (e) {
    log('red', '❌', 'Dependency installation failed. Aborting release.');
    process.exit(1);
  }

  log('blue', '🏗️', 'Building frontend for tests...');
  try {
    exec('cd frontend && pnpm run build');
    log('green', '✅', 'Frontend built');
  } catch (e) {
    log('red', '❌', 'Frontend build failed. Aborting release.');
    process.exit(1);
  }

  // Run tests (always run unless explicitly skipped)
  if (!opts['skip-tests']) {
    log('blue', '🧪', 'Running tests...');
    try {
      exec('cargo test --workspace --quiet');
      exec('cd frontend && pnpm run lint');
      log('green', '✅', 'Tests passed');
    } catch (e) {
      log('red', '❌', 'Tests failed. Aborting release.');
      process.exit(1);
    }
  } else {
    log('yellow', '⚠️', 'Tests skipped (--skip-tests flag)');
  }

  // Build binaries (only for stable releases or when explicitly requested)
  if (!opts['skip-build'] && !version.includes('-rc.')) {
    log('blue', '🔨', 'Building release binaries...');
    log('yellow', '⚠️', 'Binary builds handled by GitHub Actions workflow');
    log('blue', '💡', 'Trigger manually: gh workflow run build-all-platforms.yml');
  }

  // NPM publishing happens in build-all-platforms.yml after binaries are built
  if (opts['publish']) {
    log('yellow', '⚠️', 'NPM publish skipped - handled by build-all-platforms workflow after binaries are ready');
    log('blue', '💡', 'The build-all-platforms.yml workflow will publish to npm once all platform binaries are built');
  }

  // Create GitHub release
  if (opts['github-release']) {
    log('blue', '🏷️', 'Creating GitHub release...');
    createGitHubRelease(version, changelogContent);
  }

  log('green', '🎉', `Release v${version} complete!`);
}

function promoteRcToStable(version) {
  const match = version.match(/^(\d+\.\d+\.\d+)-rc\.\d+$/);
  if (!match) {
    log('red', '❌', `Version ${version} is not an RC`);
    process.exit(1);
  }

  // Update all package.json and Cargo.toml files
  const stableVersion = match[1];
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  pkg.version = stableVersion;
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

  const npxPkg = JSON.parse(fs.readFileSync(NPX_CLI_PKG_PATH, 'utf8'));
  npxPkg.version = stableVersion;
  fs.writeFileSync(NPX_CLI_PKG_PATH, JSON.stringify(npxPkg, null, 2) + '\n');

  // Update Cargo.toml files
  exec(`find . -name Cargo.toml -not -path "./upstream/*" -exec sed -i 's/version = "${version}"/version = "${stableVersion}"/g' {} +`, true);

  return stableVersion;
}

function generateMechanicalChangelog(version) {
  // Get previous tag
  let prevTag = '';
  try {
    prevTag = exec(`git describe --tags --abbrev=0 2>/dev/null || echo ""`, true);
  } catch (e) {
    prevTag = '';
  }

  // Extract commits
  const range = prevTag ? `${prevTag}..HEAD` : `--all`;
  const commits = exec(`git log ${range} --pretty=format:"%h|%s|%an" 2>/dev/null || echo ""`, true)
    .split('\n')
    .filter(Boolean);

  if (commits.length === 0) {
    return `## [${version}]\n\nRelease ${version}`;
  }

  // Categorize commits
  const features = [];
  const fixes = [];
  const other = [];

  commits.forEach(commit => {
    const [hash, subject, author] = commit.split('|');
    if (subject.startsWith('feat:') || subject.startsWith('feat(')) {
      features.push({ hash, subject: subject.replace(/^feat(\([^)]+\))?:\s*/, ''), author });
    } else if (subject.startsWith('fix:') || subject.startsWith('fix(')) {
      fixes.push({ hash, subject: subject.replace(/^fix(\([^)]+\))?:\s*/, ''), author });
    } else if (!subject.startsWith('chore:')) {
      other.push({ hash, subject, author });
    }
  });

  let changelog = `## ${version}\n\n`;
  changelog += `**${new Date().toISOString().split('T')[0]}**\n\n`;

  if (features.length > 0) {
    changelog += `### ✨ Features\n\n`;
    features.forEach(c => {
      changelog += `- ${c.subject} (${c.hash})\n`;
    });
    changelog += `\n`;
  }

  if (fixes.length > 0) {
    changelog += `### 🐛 Bug Fixes\n\n`;
    fixes.forEach(c => {
      changelog += `- ${c.subject} (${c.hash})\n`;
    });
    changelog += `\n`;
  }

  if (other.length > 0) {
    changelog += `### 📚 Other Changes\n\n`;
    other.slice(0, 10).forEach(c => {
      changelog += `- ${c.subject} (${c.hash})\n`;
    });
    if (other.length > 10) {
      changelog += `- ...and ${other.length - 10} more commits\n`;
    }
    changelog += `\n`;
  }

  changelog += `### 📊 Statistics\n\n`;
  changelog += `- **Total Commits**: ${commits.length}\n`;
  changelog += `- **Contributors**: ${new Set(commits.map(c => c.split('|')[2])).size}\n`;

  return changelog;
}

function createGitHubRelease(version, changelog) {
  const isRc = version.includes('-rc.');
  const prerelease = isRc ? '--prerelease' : '';

  const notesFile = path.join(os.tmpdir(), `release-notes-${Date.now()}.md`);
  fs.writeFileSync(notesFile, changelog);

  try {
    exec(`gh release create v${version} -F "${notesFile}" --title "v${version}" ${prerelease}`);
    log('green', '✅', 'GitHub release created');
  } catch (e) {
    log('yellow', '⚠️', 'GitHub release creation failed (may already exist)');
  } finally {
    try {
      fs.unlinkSync(notesFile);
    } catch (e) {}
  }
}

main().catch(e => {
  log('red', '❌', e.message);
  process.exit(1);
});
