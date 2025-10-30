#!/usr/bin/env node

/**
 * Publish RC Release
 *
 * Workflow:
 *   1. Trigger pre-release.yml workflow with version_type=prerelease
 *   2. Monitor build progress (30-45 min)
 *   3. Verify release created and published to npm @next
 *
 * Usage:
 *   node scripts/release/publish-rc.js
 *   or: make publish-rc
 */

import { log, config } from './config.js';
import { displayVersionInfo } from './version.js';
import { triggerWorkflow, monitorWorkflow, getLatestRelease } from './github.js';
import { execSync } from 'child_process';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              🚀 Publish RC Release                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Display current version
    displayVersionInfo();

    // Step 1: Trigger pre-release workflow
    log('cyan', '🚀', 'Triggering pre-release workflow...');
    console.log('');
    console.log('  This will:');
    console.log('  • Auto-increment RC version (0.5.1-rc.1 → 0.5.1-rc.2)');
    console.log('  • Build all platforms (Linux, macOS, Windows)');
    console.log('  • Publish to npm @next tag');
    console.log('  • Create GitHub pre-release');
    console.log('  • Duration: ~30-45 minutes');
    console.log('');

    const runId = await triggerWorkflow(config.workflows.preRelease, {
      version_type: 'prerelease'
    });

    if (!runId) {
      throw new Error('Failed to trigger pre-release workflow');
    }

    log('green', '✅', `Workflow triggered: Run ID ${runId}`);
    console.log('');

    // Step 2: Monitor workflow
    log('blue', '⏳', 'Monitoring build progress...');
    const success = await monitorWorkflow(runId, 'Pre-Release Build');

    if (!success) {
      throw new Error('Pre-release workflow failed');
    }

    // Step 3: Get created release
    console.log('');
    log('blue', '🔍', 'Finding created pre-release...');

    const release = await getLatestRelease(true); // Get latest pre-release

    if (!release) {
      throw new Error('Could not find created pre-release');
    }

    const tag = release.tagName || release.tag_name;
    const version = tag.replace(/^v/, '');

    log('green', '✅', `Pre-release created: ${tag}`);

    // Step 4: Verify npm publication
    console.log('');
    log('blue', '🔍', 'Verifying npm publication...');

    // Wait for npm registry to update
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
      const npmInfo = execSync('npm view automagik-forge dist-tags --json', {
        encoding: 'utf8'
      });
      const distTags = JSON.parse(npmInfo);

      log('green', '✅', `npm dist-tags:`);
      console.log(`     latest: ${distTags.latest}`);
      console.log(`     next:   ${distTags.next}`);

      if (distTags.next === version) {
        log('green', '✅', `Version ${version} published to npm @next!`);
      }
    } catch (error) {
      log('yellow', '⚠️', 'Could not verify npm publication');
    }

    console.log('');
    log('green', '🎉', 'RC release published successfully!');
    console.log('');
    console.log('📦 Next steps:');
    console.log(`   • Test the RC: npx automagik-forge@next`);
    console.log(`   • When ready: make publish-stable`);
    console.log('');

    process.exit(0);

  } catch (error) {
    console.log('');
    log('red', '❌', `Error: ${error.message}`);
    console.log('');
    if (error.stack) {
      console.log(error.stack);
    }
    process.exit(1);
  }
}

main();
