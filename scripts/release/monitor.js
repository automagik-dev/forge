#!/usr/bin/env node
/**
 * Monitor GitHub Actions workflow runs
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

async function monitorWorkflow(runId) {
  if (!runId) {
    // Get latest run ID
    runId = exec(
      `gh run list --workflow="${config.workflows.release}" --repo ${config.repo} --limit 1 --json databaseId --jq '.[0].databaseId'`,
      true
    );
  }

  if (!runId) {
    log('red', '❌', 'No run ID provided and could not find latest run');
    log('yellow', '💡', 'Usage: node scripts/release/monitor.js [run_id]');
    process.exit(1);
  }

  log('blue', '📋', `Monitoring workflow run: ${runId}`);
  log('cyan', '🔗', `https://github.com/${config.repo}/actions/runs/${runId}`);
  console.log('');

  let attempts = 0;

  while (attempts < config.polling.maxAttempts) {
    const statusData = exec(
      `gh run view ${runId} --repo ${config.repo} --json status,conclusion`,
      true
    );

    if (!statusData) {
      log('red', '❌', 'Failed to fetch workflow status');
      await new Promise(resolve => setTimeout(resolve, config.polling.intervalMs));
      attempts++;
      continue;
    }

    const { status, conclusion } = JSON.parse(statusData);

    if (status === 'completed') {
      console.log('');
      if (conclusion === 'success') {
        log('green', '✅', 'Workflow completed successfully!');
        exec(`gh run view ${runId} --repo ${config.repo}`);
        process.exit(0);
      } else {
        log('red', '❌', `Workflow failed: ${conclusion}`);
        exec(`gh run view ${runId} --repo ${config.repo}`);
        process.exit(1);
      }
    }

    // Still running
    process.stdout.write(`\r[${new Date().toLocaleTimeString()}] Status: ${status} `);

    await new Promise(resolve => setTimeout(resolve, config.polling.intervalMs));
    attempts++;
  }

  log('yellow', '⚠️', 'Monitoring timeout reached');
  process.exit(1);
}

const runId = process.argv[2];
monitorWorkflow(runId);
