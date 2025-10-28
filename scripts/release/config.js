/**
 * Release Configuration
 */

export const config = {
  repo: 'namastexlabs/automagik-forge',
  workflows: {
    release: 'release.yml',
    buildAllPlatforms: 'build-all-platforms.yml',
  },
  files: {
    packageJson: 'package.json',
  },
  polling: {
    intervalMs: 15000, // 15 seconds
    maxAttempts: 120, // 30 minutes
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
