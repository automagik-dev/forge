import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // Entry points - production code marked with !
  entry: [
    'src/main.tsx!', // Production entry
    'src/App.tsx!', // Production entry
  ],

  // Project files - production vs all
  project: [
    'src/**/*.{ts,tsx}!', // Production code
    '!src/**/*.test.{ts,tsx}', // Exclude tests
    '!src/**/*.spec.{ts,tsx}', // Exclude specs
    '!src/**/*.stories.{ts,tsx}', // Exclude storybook
  ],

  // Files to completely ignore (not analyze at all)
  ignore: [
    '**/*.d.ts', // Type declarations
    'src/routeTree.gen.ts', // Generated routes
    'eslint-local-rules/**', // ESLint plugin
    'public/**', // Static assets
  ],

  // Dependencies used dynamically (not statically imported)
  ignoreDependencies: [
    '@capacitor/*', // Runtime plugins
    '@ebay/nice-modal-react', // Dynamic modal registration
    'framer-motion', // Lazy loaded animations
    'react-resizable-panels', // Dynamic panels
    'mermaid', // Dynamic diagrams
    '@dnd-kit/utilities', // Drag-drop utilities
    '@tailwindcss/typography', // Tailwind CSS plugin
    'tailwindcss-animate', // Tailwind animation plugin
    '@sentry/vite-plugin', // Vite plugin (used in vite.config.ts)
    'eslint-plugin-prettier', // ESLint plugins
    '@virtuoso.dev/message-list', // Used in VirtualizedList.tsx (knip false positive)
  ],

  // Export handling - allow re-exports in same file
  ignoreExportsUsedInFile: true,

  // Granular rules - proper severity levels
  rules: {
    files: 'error', // Unused files = error (block CI)
    dependencies: 'error', // Unused deps = error (block CI)
    devDependencies: 'error', // Unused devDeps = error
    unlisted: 'error', // Missing deps = error
    unresolved: 'error', // Broken imports = error
    exports: 'warn', // Unused exports = warn (visible, not blocking)
    types: 'warn', // Unused types = warn
    duplicates: 'warn', // Duplicate exports = warn
    enumMembers: 'off', // Enum members = off (too noisy)
    classMembers: 'off', // Class members = off (performance)
  },

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
