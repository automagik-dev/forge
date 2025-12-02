import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration - LLM-Friendly Testing Framework
 *
 * Philosophy:
 * - Real browser events (no synthetic event issues)
 * - Accessibility-first selectors (role, label, text)
 * - Clear error messages for LLM debugging
 * - Auto-wait for elements (no manual waits needed)
 */

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
    baseURL: 'http://localhost:3000',

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
      ? 'DATABASE_URL=sqlite:///$(pwd)/dev_assets/db.sqlite ./target/release/forge-app'
      : 'make dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.USE_RELEASE_BINARY
      ? 60000   // 1 min for binary startup
      : 600000, // 10 min for Rust compilation in dev mode
    env: process.env.USE_RELEASE_BINARY
      ? {
          DATABASE_URL: `sqlite:///${process.cwd()}/dev_assets/db.sqlite`,
          RUST_LOG: 'info',
        }
      : undefined,
  },
});
