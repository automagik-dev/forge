#!/usr/bin/env node

/**
 * Ensures git submodules are initialized before starting dev server.
 * This is especially important for git worktrees, which don't auto-initialize submodules.
 *
 * Checks if upstream/crates exists, and if not, runs git submodule update --init --recursive.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUBMODULE_CHECK_PATH = path.join(__dirname, '..', 'upstream', 'crates');

function isSubmoduleInitialized() {
  return fs.existsSync(SUBMODULE_CHECK_PATH);
}

function isGitWorktree() {
  try {
    const gitDir = path.join(__dirname, '..', '.git');
    // In worktrees, .git is a file, not a directory
    return fs.existsSync(gitDir) && fs.statSync(gitDir).isFile();
  } catch {
    return false;
  }
}

function initializeSubmodules() {
  console.log('🔧 Initializing git submodules (needed for worktrees)...');
  try {
    execSync('git submodule update --init --recursive', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Submodules initialized successfully\n');
  } catch (error) {
    console.error('❌ Failed to initialize submodules:', error.message);
    process.exit(1);
  }
}

// Main check
if (!isSubmoduleInitialized()) {
  if (isGitWorktree()) {
    console.log('📦 Detected git worktree without initialized submodules');
  } else {
    console.log('📦 Submodules not initialized');
  }
  initializeSubmodules();
} else {
  // Silent success - don't spam output on every dev start
  // console.log('✅ Submodules already initialized');
}
