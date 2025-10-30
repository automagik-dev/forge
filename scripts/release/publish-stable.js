#!/usr/bin/env node

/**
 * Publish Stable Release
 *
 * Workflow:
 *   1. Find latest RC pre-release
 *   2. Convert GitHub pre-release → stable release
 *   3. This triggers publish.yml workflow automatically
 *   4. publish.yml publishes to npm @latest (using NPM_TOKEN secret)
 *
 * Usage:
 *   node scripts/release/publish-stable.js
 *   or: make publish-stable
 */

import { log } from './config.js';
import { displayVersionInfo } from './version.js';
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

    // Step 2: Extract stable version (remove -rc.N and timestamp)
    const stableVersion = rcVersion.replace(/-rc\.\d+.*$/, '');
    const stableTag = `v${stableVersion}`;

    log('cyan', '🎯', `Converting to stable: ${rcVersion} → ${stableVersion}`);
    console.log('');

    // Step 3: Convert GitHub pre-release to stable release
    log('blue', '🏷️', 'Converting GitHub pre-release to stable release...');
    console.log('');
    console.log('  This will:');
    console.log('  • Convert pre-release to stable release on GitHub');
    console.log('  • Trigger publish.yml workflow automatically');
    console.log('  • publish.yml will publish to npm @latest');
    console.log('');

    try {
      // Edit release: change tag, mark as stable (not pre-release), set as latest
      execSync(
        `gh release edit "${tag}" --tag "${stableTag}" --prerelease=false --latest`,
        { stdio: 'inherit' }
      );
      log('green', '✅', `GitHub release converted: ${stableTag} (stable)`);
    } catch (error) {
      throw new Error(`Failed to convert GitHub release: ${error.message}`);
    }

    console.log('');

    // Step 4: Monitor the publish.yml workflow
    log('blue', '⏳', 'Waiting for publish.yml workflow to start...');
    console.log('');
    console.log('  The publish.yml workflow will:');
    console.log('  • Download the .tgz package from the release');
    console.log('  • Publish to npm @latest (using NPM_TOKEN secret)');
    console.log('  • Update release description');
    console.log('');

    // Wait for workflow to start
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get the latest publish workflow run
    try {
      const runId = execSync(
        `gh run list --workflow=publish.yml --limit 1 --json databaseId --jq '.[0].databaseId'`,
        { encoding: 'utf8' }
      ).trim();

      if (runId) {
        log('green', '✅', `publish.yml workflow started: Run ID ${runId}`);
        log('cyan', '🔗', `https://github.com/namastexlabs/automagik-forge/actions/runs/${runId}`);
        console.log('');
        log('blue', '💡', 'Monitor the workflow with:');
        console.log(`     gh run watch ${runId}`);
      }
    } catch (error) {
      log('yellow', '⚠️', 'Could not find workflow run. Check manually:');
      console.log('     gh run list --workflow=publish.yml');
    }

    console.log('');
    log('green', '🎉', 'Stable release process initiated!');
    console.log('');
    console.log('📦 After publish.yml completes:');
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
