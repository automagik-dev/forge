import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import i18next from 'eslint-plugin-i18next';
import prettier from 'eslint-config-prettier';
import localRules from 'eslint-plugin-local-rules';

const i18nCheck = process.env.LINT_I18N === 'true';

export default [
  // Ignore patterns
  { ignores: ['dist/**', 'eslint.config.js'] },

  // Base JS recommended
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      'i18next': i18next,
      'local-rules': localRules,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Disable no-undef for TypeScript - TS handles this better and JSX transform auto-imports React
      'no-undef': 'off',
      // Disable base rule - let unused-imports handle it
      '@typescript-eslint/no-unused-vars': 'off',
      // New in v8 - disable to match old behavior
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-refresh/only-export-components': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Changed to warn - v8 is stricter about null/undefined in switches
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',
      'no-restricted-syntax': ['warn', {
        selector: 'Property[key.name="refetchInterval"][value.type="Literal"][value.value<15000]',
        message: 'Polling intervals under 15s are discouraged. Use WebSocket streams or event-driven invalidation instead.',
      }],
      'local-rules/no-hardcoded-query-keys': 'error',
      'i18next/no-literal-string': i18nCheck ? ['warn', {
        markupOnly: true,
        ignoreAttribute: ['data-testid', 'to', 'href', 'id', 'key', 'type', 'role', 'className', 'style', 'aria-describedby'],
        'jsx-components': { exclude: ['code'] },
      }] : 'off',
    },
  },

  // Test/story files - disable i18n
  {
    files: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },

  // Config files - disable type-aware rules
  {
    files: ['*.config.{ts,js,cjs,mjs}', 'eslint.config.js'],
    languageOptions: {
      parserOptions: { project: null },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
    },
  },

  // Prettier (must be last)
  prettier,
];
