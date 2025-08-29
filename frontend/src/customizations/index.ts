/**
 * Automagik-Forge Customizations
 * 
 * Central export point for all custom features.
 * Import from here to use customizations in the main app.
 */

export { AUTOMAGIK_FEATURES, isAutomagikForge, CUSTOM_THEMES } from './config';
export { CustomThemeWrapper } from './theme-wrapper';
export { AnimatedAnvil } from './components/AnimatedAnvil';

// Helper to conditionally use custom components
export function useCustomComponent<T, U>(
  customComponent: T,
  defaultComponent: U,
  featureFlag: boolean
): T | U {
  return featureFlag ? customComponent : defaultComponent;
}