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
  webServer: {
    command: 'make dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 600000, // 10 minutes for build (Rust compilation can be slow on CI)
  },
});
