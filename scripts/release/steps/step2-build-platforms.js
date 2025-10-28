/**
 * Step 2: Build All Platforms
 *
 * Triggers build-all-platforms.yml workflow which:
 * - Builds binaries for all platforms (Linux, macOS, Windows)
 * - Publishes to npm @next tag
 * - Uploads assets to GitHub release
 */

import { log, config } from '../config.js';
import { triggerWorkflow, monitorWorkflow } from '../github.js';
import { execSync } from 'child_process';

export async function buildAllPlatforms(tag, version) {
  log('cyan', '🔨', 'Step 2: Building all platforms');
  console.log('');
  console.log('  This will:');
  console.log('  • Build binaries for Linux, macOS, Windows');
  console.log('  • Publish to npm @next tag');
  console.log('  • Upload assets to GitHub release');
  console.log('  • Duration: ~30-45 minutes');
  console.log('');

  // Trigger build-all-platforms.yml with the tag
  log('blue', '🚀', `Triggering build workflow for tag ${tag}...`);

  const runId = await triggerWorkflow('Build All Platforms', { tag });

  if (!runId) {
    throw new Error('Failed to trigger build workflow');
  }

  log('green', '✅', `Build workflow triggered: Run ID ${runId}`);

  // Monitor the build workflow (this takes a while)
  const success = await monitorWorkflow(runId, 'Platform Builds');

  if (!success) {
    throw new Error('Build workflow failed');
  }

  // Verify npm publication
  console.log('');
  log('blue', '🔍', 'Verifying npm publication...');

  // Wait a bit for npm registry to update
  await new Promise(resolve => setTimeout(resolve, 30000));

  try {
    const npmVersion = execSync('npm view automagik-forge version', { encoding: 'utf8' }).trim();

    if (npmVersion === version) {
      log('green', '✅', `Version ${version} successfully published to npm!`);
    } else {
      log('yellow', '⚠️', `npm shows: ${npmVersion} (expected ${version})`);
      console.log('  It may take a few minutes for npm to update.');
    }
  } catch (error) {
    log('yellow', '⚠️', 'Could not verify npm publication');
  }

  return true;
}
