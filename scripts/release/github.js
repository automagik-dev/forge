/**
 * GitHub API wrapper using gh CLI
 */

import { execSync } from 'child_process';
import { config, log } from './config.js';

function exec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    });
    return result ? result.trim() : '';
  } catch (error) {
    if (!silent) throw error;
    return null;
  }
}

export async function triggerWorkflow(workflow, inputs = {}) {
  const inputArgs = Object.entries(inputs)
    .map(([key, value]) => `-f ${key}="${value}"`)
    .join(' ');

  exec(`gh workflow run ${workflow} --repo ${config.repo} ${inputArgs}`);

  // Wait for workflow to start
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Get the latest run ID
  const runId = exec(
    `gh run list --workflow="${workflow}" --repo ${config.repo} --limit 1 --json databaseId --jq '.[0].databaseId'`,
    true
  );

  return runId;
}

export function getWorkflowStatus(runId) {
  const data = exec(
    `gh run view ${runId} --repo ${config.repo} --json status,conclusion`,
    true
  );

  if (!data) return null;

  const parsed = JSON.parse(data);
  return {
    status: parsed.status,
    conclusion: parsed.conclusion,
  };
}

export function getLatestRelease(prerelease = false) {
  const filter = prerelease ? 'select(.isPrerelease == true)' : 'select(.isPrerelease == false)';
  const data = exec(
    `gh release list --repo ${config.repo} --limit 10 --json tagName,isPrerelease,name --jq '.[] | ${filter}' | head -1`,
    true
  );

  if (!data) return null;

  return JSON.parse(data);
}

export function releaseExists(tag) {
  const result = exec(`gh release view ${tag} --repo ${config.repo} 2>&1`, true);
  return result !== null && !result.includes('release not found');
}

export function convertToFullRelease(tag, version) {
  exec(
    `gh release edit ${tag} --repo ${config.repo} --title "Release v${version}" --prerelease=false --latest`
  );
  log('green', '✅', `Converted ${tag} to full release`);
}

export async function monitorWorkflow(runId, description) {
  log('blue', '⏳', `Monitoring ${description}...`);
  log('cyan', '🔗', `https://github.com/${config.repo}/actions/runs/${runId}`);

  let attempts = 0;

  while (attempts < config.polling.maxAttempts) {
    const status = getWorkflowStatus(runId);

    if (!status) {
      log('red', '❌', 'Failed to fetch workflow status');
      await new Promise(resolve => setTimeout(resolve, config.polling.intervalMs));
      attempts++;
      continue;
    }

    if (status.status === 'completed') {
      if (status.conclusion === 'success') {
        log('green', '✅', `${description} completed successfully!`);
        return true;
      } else {
        log('red', '❌', `${description} failed: ${status.conclusion}`);
        log('cyan', '🔗', `View logs: https://github.com/${config.repo}/actions/runs/${runId}`);
        return false;
      }
    }

    // Still running
    process.stdout.write(`\r[${new Date().toLocaleTimeString()}] Status: ${status.status} `);

    await new Promise(resolve => setTimeout(resolve, config.polling.intervalMs));
    attempts++;
  }

  log('yellow', '⚠️', 'Monitoring timeout reached');
  return false;
}
