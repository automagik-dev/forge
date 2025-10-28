/**
 * Step 3: Verify Release
 *
 * Verifies that:
 * - GitHub release exists with assets
 * - npm package is published
 * - Git tag exists
 */

import { log, config } from '../config.js';
import { execSync } from 'child_process';

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

export async function verifyRelease(tag, version) {
  log('cyan', '🔍', 'Step 3: Verifying release');
  console.log('');

  let allPassed = true;

  // Check GitHub release
  const releaseExists = exec(`gh release view ${tag} --repo ${config.repo} 2>&1`);
  if (releaseExists && !releaseExists.includes('release not found')) {
    log('green', '✅', 'GitHub release exists');

    // Check assets
    const assetCount = exec(
      `gh release view ${tag} --repo ${config.repo} --json assets --jq '.assets | length'`
    );
    console.log(`   Assets: ${assetCount} files`);
  } else {
    log('red', '❌', 'GitHub release not found');
    allPassed = false;
  }

  // Check npm package
  const npmVersion = exec('npm view automagik-forge version');
  if (npmVersion === version) {
    log('green', '✅', `npm package: ${npmVersion}`);
  } else {
    log('yellow', '⚠️', `npm shows: ${npmVersion} (expected ${version})`);
  }

  // Check git tag
  const tagExists = exec(`git ls-remote --tags origin | grep "refs/tags/${tag}$"`);
  if (tagExists) {
    log('green', '✅', `Git tag ${tag} exists`);
  } else {
    log('red', '❌', `Git tag ${tag} not found`);
    allPassed = false;
  }

  console.log('');

  if (allPassed) {
    log('green', '🎉', 'Release verification passed!');
    console.log('');
    console.log(`📦 Package: https://www.npmjs.com/package/automagik-forge`);
    console.log(`🏷️  Release: https://github.com/${config.repo}/releases/tag/${tag}`);
    console.log('');
    console.log('Install with:');
    console.log(`  npx automagik-forge@next    # RC version`);
    console.log(`  npx automagik-forge@${version}   # Specific version`);
  } else {
    log('yellow', '⚠️', 'Some verification checks failed');
  }

  return allPassed;
}
