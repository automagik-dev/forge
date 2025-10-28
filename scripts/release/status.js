#!/usr/bin/env node
/**
 * Show release and workflow status
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

function showStatus() {
  log('cyan', '📊', 'Latest workflow status:');
  console.log('');

  exec(`gh run list --workflow="${config.workflows.release}" --repo ${config.repo} --limit 5`);

  console.log('');
  log('cyan', '📦', 'Available commands:');
  console.log('  node scripts/release/publish.js        - Full RC release pipeline');
  console.log('  node scripts/release/monitor.js [id]   - Monitor workflow run');
  console.log('  node scripts/release/status.js         - Show this status');
  console.log('');
  console.log('  Or via Makefile:');
  console.log('  make publish                           - Full RC release pipeline');
  console.log('');
}

showStatus();
