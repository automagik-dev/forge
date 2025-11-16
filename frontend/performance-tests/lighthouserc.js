/**
 * Lighthouse CI Configuration
 *
 * Performance budget and lighthouse configuration for mobile web validation
 */

module.exports = {
  ci: {
    collect: {
      // URL to test
      url: ['http://localhost:3000'],
      // Number of runs to average
      numberOfRuns: 3,
      settings: {
        // Mobile device emulation
        preset: 'desktop',
        // Or use mobile preset:
        // preset: 'mobile',
        // Custom throttling for mobile network conditions
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance budgets
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'speed-index': ['error', { maxNumericValue: 2000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:document:size': ['error', { maxNumericValue: 50000 }], // 50KB
        'resource-summary:font:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:image:size': ['error', { maxNumericValue: 200000 }], // 200KB
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
