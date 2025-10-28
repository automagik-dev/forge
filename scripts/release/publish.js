#!/usr/bin/env node

/**
 * Automated RC Release Pipeline
 *
 * Workflow:
 *   Step 1: Trigger RC release (auto-increment, test, create pre-release)
 *   Step 2: Build all platforms (30-45 min, publish to npm @next)
 *   Step 3: Verify release (check GitHub, npm, git tag)
 *
 * Usage:
 *   node scripts/release/publish.js
 */

import { log } from './config.js';
import { displayVersionInfo } from './version.js';
import { triggerRcRelease } from './steps/step1-trigger-rc.js';
import { buildAllPlatforms } from './steps/step2-build-platforms.js';
import { verifyRelease } from './steps/step3-verify.js';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              🚀 Automated RC Release Pipeline                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Display version info
    displayVersionInfo();

    // Step 1: Trigger RC release workflow
    const { tag, version } = await triggerRcRelease();
    console.log('');

    // Step 2: Build all platforms
    await buildAllPlatforms(tag, version);
    console.log('');

    // Step 3: Verify release
    await verifyRelease(tag, version);

    log('green', '🎉', 'RC release pipeline completed successfully!');
    process.exit(0);

  } catch (error) {
    console.log('');
    log('red', '❌', `Error: ${error.message}`);
    console.log('');
    console.log(error.stack);
    process.exit(1);
  }
}

main();
