#!/usr/bin/env node

/**
 * Publish Stable Release
 *
 * Workflow:
 *   1. Find latest RC pre-release
 *   2. Convert to stable version (remove -rc.N suffix)
 *   3. Update npm dist-tags (RC → latest, remove next)
 *   4. Convert GitHub pre-release to stable release
 *
 * Usage:
 *   node scripts/release/publish-stable.js
 *   or: make publish-stable
 */

import { log } from './config.js';
import { displayVersionInfo, getPackageVersion } from './version.js';
import { getLatestRelease } from './github.js';
import { execSync } from 'child_process';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              📦 Publish Stable Release                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Display current version
    displayVersionInfo();

    // Step 1: Find latest RC pre-release
    log('blue', '🔍', 'Finding latest RC pre-release...');

    const release = await getLatestRelease(true); // Get latest pre-release

    if (!release) {
      throw new Error('No RC pre-release found. Run "make publish-rc" first.');
    }

    const tag = release.tagName || release.tag_name;
    const rcVersion = tag.replace(/^v/, '');

    // Check if it's actually an RC version
    if (!rcVersion.includes('-rc.')) {
      throw new Error(`Latest pre-release (${rcVersion}) is not an RC version`);
    }

    log('green', '✅', `Found RC pre-release: ${tag}`);
    console.log('');

    // Step 2: Extract stable version
    const stableVersion = rcVersion.replace(/-rc\.\d+(-\d+)?$/, '');
    const stableTag = `v${stableVersion}`;

    log('cyan', '🎯', `Converting to stable: ${rcVersion} → ${stableVersion}`);
    console.log('');

    // Step 3: Update npm dist-tags
    log('blue', '📦', 'Updating npm dist-tags...');

    try {
      // Add @latest tag to RC version
      execSync(`npm dist-tag add automagik-forge@${rcVersion} latest`, { stdio: 'inherit' });
      log('green', '✅', `Tagged automagik-forge@${rcVersion} as "latest"`);

      // Remove @next tag from RC version
      try {
        execSync(`npm dist-tag rm automagik-forge next`, { stdio: 'inherit' });
      } catch (e) {
        // Ignore if @next tag doesn't exist
      }
    } catch (error) {
      throw new Error(`Failed to update npm dist-tags: ${error.message}`);
    }

    console.log('');

    // Step 4: Update GitHub release
    log('blue', '🏷️', 'Converting GitHub pre-release to stable...');

    try {
      // Edit release: change tag, mark as stable (not pre-release), set as latest
      execSync(
        `gh release edit "${tag}" --tag "${stableTag}" --prerelease=false --latest`,
        { stdio: 'inherit' }
      );
      log('green', '✅', `GitHub release updated: ${stableTag} (stable)`);
    } catch (error) {
      throw new Error(`Failed to update GitHub release: ${error.message}`);
    }

    console.log('');

    // Step 5: Verify publication
    log('blue', '🔍', 'Verifying publication...');

    try {
      const npmInfo = execSync('npm view automagik-forge dist-tags --json', {
        encoding: 'utf8'
      });
      const distTags = JSON.parse(npmInfo);

      console.log('');
      log('green', '✅', 'npm dist-tags:');
      console.log(`     latest: ${distTags.latest}`);
      if (distTags.next) {
        console.log(`     next:   ${distTags.next}`);
      }
    } catch (error) {
      log('yellow', '⚠️', 'Could not verify npm tags');
    }

    console.log('');
    log('green', '🎉', 'Stable release published successfully!');
    console.log('');
    console.log('📦 Installation:');
    console.log(`   npx automagik-forge@${stableVersion}`);
    console.log(`   npx automagik-forge@latest`);
    console.log('');
    console.log('🔗 GitHub Release:');
    console.log(`   https://github.com/namastexlabs/automagik-forge/releases/tag/${stableTag}`);
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
