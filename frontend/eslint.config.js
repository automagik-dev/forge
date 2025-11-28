import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import i18next from 'eslint-plugin-i18next';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import process from 'node:process';

const i18nCheck = process.env.LINT_I18N === 'true';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript configuration with type checking
  ...tseslint.configs.recommended,

  // Prettier compatibility (must be after other configs)
  prettier,

  // Main configuration for TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
      i18next: i18next,
    },
    rules: {
      // React hooks rules
      ...reactHooks.configs.recommended.rules,

      // React refresh
      'react-refresh/only-export-components': 'off',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
        },
      ],

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off', // Using unused-imports plugin instead
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty interfaces (was allowed in v6)
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // i18n rule - only active when LINT_I18N=true
      'i18next/no-literal-string': i18nCheck
        ? [
            'warn',
            {
              markupOnly: true,
              ignoreAttribute: [
                'data-testid',
                'to',
                'href',
                'id',
                'key',
                'type',
                'role',
                'className',
                'style',
                'aria-describedby',
              ],
              'jsx-components': {
                exclude: ['code'],
              },
            },
          ]
        : 'off',
    },
  },

  // Override for test and story files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },

  // Override for config files - disable type-aware linting
  {
    files: ['*.config.{ts,js,cjs,mjs}', 'eslint.config.js'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
    },
  }
);
