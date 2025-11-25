import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Entry points - where the app starts
  entry: ['src/main.tsx', 'src/App.tsx'],

  // Project files to analyze
  project: ['src/**/*.{ts,tsx}'],

  // Ignore patterns
  ignore: [
    // Test files (covered by test framework)
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    // Storybook
    '**/*.stories.{ts,tsx}',
    // Type definition files
    '**/*.d.ts',
    // Generated files
    'src/routeTree.gen.ts',
    // ESLint local rules (loaded by eslint-plugin-local-rules)
    'eslint-local-rules/**',
    // Service worker (loaded by browser)
    'public/**',
  ],

  // Ignore specific dependencies (used dynamically or by external tools)
  ignoreDependencies: [
    // Capacitor plugins (used at runtime)
    '@capacitor/*',
    // Used dynamically by components
    '@ebay/nice-modal-react',
    'framer-motion',
    'react-resizable-panels',
    'mermaid',
    '@dnd-kit/utilities',
    // Tailwind plugin
    '@tailwindcss/typography',
    // ESLint plugins
    'eslint-plugin-prettier',
  ],

  // Plugin configurations
  vite: {
    entry: ['vite.config.ts'],
  },

  tailwind: {
    config: ['tailwind.config.js'],
  },

  eslint: {
    config: ['.eslintrc.cjs'],
  },
};

export default config;
