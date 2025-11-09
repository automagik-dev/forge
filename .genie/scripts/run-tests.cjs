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

  // Git hooks should run fast unit tests, not slow package tests
  if (isHook && !process.env.FORCE_PACKAGE_TEST) {
    console.log('⚙️  Running unit tests (git hook - fast validation)...');
    console.log('   Package tests skipped (run manually: npm run test:npm)');

    await new Promise((resolve) => {
      const ps = spawn('cargo', ['test', '--workspace'], {
        stdio: 'inherit',
        cwd: repoRoot,
        shell: false,
        env: { ...process.env, SQLX_OFFLINE: 'true' }
      });
      ps.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Unit tests passed');
        } else {
          console.error(`❌ Unit tests failed (exit code: ${code})`);
          console.error('   Fix failing tests before pushing');
        }
        process.exit(code || 0);
      });
    });
    return;
  }

  // Manual or CI execution: run full package tests
  const useNonInteractive = isCI;
  const testCommand = useNonInteractive ? 'test:ci' : 'test:all';

  if (useNonInteractive) {
    console.log('⚙️  Running package tests (CI mode)...');
  } else {
    console.log('⚙️  Running package tests (interactive)...');
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
        console.log('✅ Package tests passed');
      } else {
        console.error(`❌ Package tests failed (exit code: ${code})`);
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

