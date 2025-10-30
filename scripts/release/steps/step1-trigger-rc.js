/**
 * Step 1: Trigger RC Release Workflow
 *
 * Triggers the release.yml workflow which:
 * - Auto-increments RC version
 * - Runs tests
 * - Creates GitHub pre-release with auto-generated notes
 */

import { log } from '../config.js';
import { triggerWorkflow, monitorWorkflow, getLatestRelease } from '../github.js';

export async function triggerRcRelease() {
  log('cyan', '🚀', 'Step 1: Triggering RC release workflow');
  console.log('');
  console.log('  This will:');
  console.log('  • Auto-increment RC version (0.5.0-rc.3 → 0.5.0-rc.4)');
  console.log('  • Run tests');
  console.log('  • Create GitHub pre-release with auto-generated notes');
  console.log('');

  // Trigger release.yml with bump-rc action
  const runId = await triggerWorkflow('release.yml', { action: 'bump-rc' });

  if (!runId) {
    throw new Error('Failed to trigger release workflow');
  }

  log('green', '✅', `Workflow triggered: Run ID ${runId}`);

  // Monitor the workflow
  const success = await monitorWorkflow(runId, 'RC Release Workflow');

  if (!success) {
    throw new Error('RC release workflow failed');
  }

  // Get the created pre-release tag
  console.log('');
  log('blue', '🔍', 'Finding created pre-release...');

  const release = getLatestRelease(true); // Get latest pre-release

  if (!release) {
    throw new Error('Could not find created pre-release');
  }

  const tag = release.tagName;
  const version = tag.replace(/^v/, '');

  log('green', '✅', `Pre-release created: ${tag} (version: ${version})`);

  return { tag, version };
}
