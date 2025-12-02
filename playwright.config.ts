import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration - LLM-Friendly Testing Framework
 *
 * Philosophy:
 * - Real browser events (no synthetic event issues)
 * - Accessibility-first selectors (role, label, text)
 * - Clear error messages for LLM debugging
 * - Auto-wait for elements (no manual waits needed)
 *
 * Port Configuration:
 * - USE_RELEASE_BINARY=true (CI): Backend serves embedded frontend on port 8887
 * - make dev (local): Vite dev server on port 3000, backend on dynamic port
 */

// In CI with release binary, the app serves on 8887
// In local dev, Vite frontend is on 3000
const basePort = process.env.USE_RELEASE_BINARY ? 8887 : 3000;
const baseURL = `http://localhost:${basePort}`;

export default defineConfig({
  testDir: './tests/e2e',

  // Test execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter - verbose for LLM debugging
  reporter: [
    ['html'],
    ['list'], // Shows test progress in terminal
  ],

  // Global settings
  use: {
    // Base URL for tests
    baseURL,

    // Screenshots - capture on failure for debugging
    screenshot: 'only-on-failure',

    // Videos - only retain on failure to reduce I/O overhead
    video: 'retain-on-failure',

    // Trace - capture on first retry for detailed debugging
    trace: 'on-first-retry',

    // Accessibility snapshots (instead of relying on selectors)
    // This is KEY for LLM testing - we can see the page structure
  },

  // Output directories for artifacts
  outputDir: 'test-results',

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile testing (optional)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Dev server - automatically start the app
  // USE_RELEASE_BINARY: In CI, uses pre-built release binary (faster)
  // Otherwise: Uses make dev with cargo watch (hot reload for local dev)
  webServer: {
    command: process.env.USE_RELEASE_BINARY
      ? './target/release/forge-app'
      : 'make dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.USE_RELEASE_BINARY
      ? 60000   // 1 min for binary startup
      : 600000, // 10 min for Rust compilation in dev mode
    stdout: 'pipe', // Show webServer output for debugging
    stderr: 'pipe',
    env: process.env.USE_RELEASE_BINARY
      ? {
          DATABASE_URL: `sqlite:///${process.cwd()}/dev_assets/db.sqlite`,
          RUST_LOG: 'info',
        }
      : undefined,
  },
});
