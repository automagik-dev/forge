const i18nCheck = process.env.LINT_I18N === 'true';

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:i18next/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'unused-imports', 'i18next'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'react-refresh/only-export-components': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    // Prevent short polling intervals - prefer WebSocket or event-driven updates
    // See docs/DATA_FETCHING.md for guidelines
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          'Property[key.name="refetchInterval"][value.type="Literal"][value.value<15000]',
        message:
          'Polling intervals under 15s are discouraged. Use WebSocket streams or event-driven invalidation instead. See docs/DATA_FETCHING.md',
      },
    ],
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
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}'],
      rules: {
        'i18next/no-literal-string': 'off',
      },
    },
    {
      // Disable type-aware linting for config files
      files: ['*.config.{ts,js,cjs,mjs}', '.eslintrc.cjs'],
      parserOptions: {
        project: null,
      },
      rules: {
        '@typescript-eslint/switch-exhaustiveness-check': 'off',
      },
    },
  ],
};
