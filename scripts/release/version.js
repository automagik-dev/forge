/**
 * Version management utilities
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { config, log } from './config.js';

export function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(config.files.packageJson, 'utf8'));
  return pkg.version;
}

export function getNpmVersion() {
  try {
    return execSync('npm view automagik-forge version', { encoding: 'utf8' }).trim();
  } catch {
    return '0.0.0';
  }
}

export function calculateNextRcVersion(currentVersion) {
  // Match: 0.5.0-rc.3 or 0.5.0
  const rcMatch = currentVersion.match(/^(\d+\.\d+\.\d+)-rc\.(\d+)$/);

  if (rcMatch) {
    // Already RC, increment RC number
    const baseVersion = rcMatch[1];
    const rcNum = parseInt(rcMatch[2], 10) + 1;
    return `${baseVersion}-rc.${rcNum}`;
  }

  // Stable version, create first RC of next patch
  const stableMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (stableMatch) {
    const major = stableMatch[1];
    const minor = stableMatch[2];
    const patch = parseInt(stableMatch[3], 10) + 1;
    return `${major}.${minor}.${patch}-rc.1`;
  }

  throw new Error(`Invalid version format: ${currentVersion}`);
}

export function displayVersionInfo() {
  const current = getCurrentVersion();
  const npm = getNpmVersion();
  const next = calculateNextRcVersion(current);

  console.log('');
  log('cyan', '📊', 'Version Status:');
  console.log(`  Current local:  ${current}`);
  console.log(`  Latest on npm:  ${npm}`);
  console.log(`  Next RC:        ${next}`);
  console.log('');

  return { current, npm, next };
}
