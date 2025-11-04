#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function main() {
  const repoRoot = path.join(__dirname, '..', '..');

  // Skip tests entirely if GENIE_SKIP_BUILD is set
  if (process.env.GENIE_SKIP_BUILD) {
    console.log('⏭️  Build skipped (GENIE_SKIP_BUILD set)');
    console.log('✅ Assuming binaries already built');
    return process.exit(0);
  }

  // Detect context: CI, git hook, or manual execution
  const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
  const isHook = process.env.GIT_REFNAME || process.env.GIT_DIR; // Set by git hooks
  const useNonInteractive = isCI || isHook;

  const testCommand = useNonInteractive ? 'test:ci' : 'test:all';

  if (useNonInteractive) {
    console.log('⚙️  Running tests (non-interactive mode)...');
  } else {
    console.log('⚙️  Running tests...');
  }

  await new Promise((resolve) => {
    const ps = spawn('pnpm', ['run', testCommand], {
      stdio: 'inherit',
      cwd: repoRoot,
      shell: false,
      env: { ...process.env, CI: 'true' } // Ensure CI flag is passed
    });
    ps.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Tests passed');
      } else {
        console.error(`❌ Tests failed (exit code: ${code})`);
        console.error('   Fix failing tests before pushing');
      }
      process.exit(code || 0);
    });
  });
}

main().catch((e) => {
  console.error(`❌ Error running tests: ${e.message}`);
  process.exit(1);
});

