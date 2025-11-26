/**
 * Local ESLint rules for Automagik Forge frontend
 *
 * These rules enforce project-specific coding standards that aren't
 * covered by existing ESLint plugins.
 *
 * eslint-plugin-local-rules expects a flat object of rules (not { rules: {...} })
 */
module.exports = {
  'no-hardcoded-query-keys': require('./rules/no-hardcoded-query-keys'),
};
