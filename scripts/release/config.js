/**
 * Release Configuration
 */

export const config = {
  repo: 'namastexlabs/automagik-forge',
  workflows: {
    preRelease: 'pre-release.yml',
    publish: 'publish.yml',
  },
  files: {
    packageJson: 'package.json',
  },
  polling: {
    intervalMs: 15000, // 15 seconds
    maxAttempts: 120, // 30 minutes (for pre-release build to complete)
  },
};

export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export function log(color, emoji, message) {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}
