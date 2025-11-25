/**
 * Mobile Theme Tokens
 *
 * Centralized design tokens for mobile-specific UI elements.
 * This file provides a single source of truth for:
 * - Z-index layering
 * - Spacing values
 * - Breakpoints
 * - Animation durations
 *
 * Usage:
 * ```typescript
 * import { mobileTheme } from '@/styles/mobile-theme';
 *
 * // Access tokens
 * const navHeight = mobileTheme.spacing.bottomNav;
 * const navZIndex = mobileTheme.zIndex.bottomNav;
 * ```
 *
 * Note: Z-index values are also available as CSS variables (--z-mobile-*)
 * defined in index.css for use in Tailwind classes.
 */

export const mobileTheme = {
  /**
   * Spacing tokens for mobile UI elements
   * Values in pixels for consistent sizing
   */
  spacing: {
    bottomNav: 'var(--mobile-bottom-nav-height)', // defined in index.css
    inputBar: 'var(--mobile-input-bar-height)',
    fab: 'var(--touch-target-comfortable)',
    drawer: 'auto',      // Drawer height (auto-calculated)
    sheet: 'auto',       // Bottom sheet height (snap-based)
  },

  /**
   * Z-index layering (from bottom to top)
   *
   * Layer hierarchy:
   * 1. content (1) - Base content layer
   * 2. header (10) - Page headers
   * 3. inputBar (15) - Input bar (below bottom nav)
   * 4. bottomNav (20) - Bottom navigation (above input)
   * 5. fab (30) - Floating action button
   * 6. sheet (40) - Bottom sheets and drawers
   * 7. modal (50) - Modal dialogs
   * 8. toast (60) - Toast notifications (topmost)
   *
   * CSS Variables: --z-mobile-* (defined in index.css)
   */
  zIndex: {
    content: 1,         // var(--z-mobile-content)
    header: 10,         // var(--z-mobile-header)
    inputBar: 15,       // var(--z-mobile-input-bar) - NEW
    bottomNav: 20,      // var(--z-mobile-bottom-nav)
    fab: 30,            // var(--z-mobile-fab)
    sheet: 40,          // var(--z-mobile-sheet)
    modal: 50,          // var(--z-mobile-modal)
    toast: 60,          // var(--z-mobile-toast)
  },

  /**
   * Breakpoints for responsive design
   * Values in pixels
   */
  breakpoints: {
    mobile: 768,        // max-width for mobile (< 768px)
    tablet: 768,        // min-width for tablet (>= 768px)
    desktop: 1024,      // min-width for desktop (>= 1024px)
  },

  /**
   * Animation durations
   * Values in milliseconds
   */
  animation: {
    fast: 150,          // Quick transitions (150ms)
    normal: 250,        // Standard transitions (250ms)
    slow: 350,          // Slow transitions (350ms)
  },

  /**
   * Mobile-specific color tokens (if needed)
   * Uses CSS variables from index.css
   */
  colors: {
    bottomNavBg: 'hsl(var(--background))',
    bottomNavBorder: 'hsl(var(--border))',
  },
} as const;

/** @public - Mobile theme type */
export type MobileTheme = typeof mobileTheme;

/**
 * Helper to get CSS variable name for z-index
 * @public - Mobile theme utility
 *
 * @param layer - Z-index layer name
 * @returns CSS variable name
 *
 * @example
 * ```typescript
 * const zIndexVar = getZIndexVar('bottomNav');
 * // Returns: 'var(--z-mobile-bottom-nav)'
 * ```
 */
export function getZIndexVar(layer: keyof typeof mobileTheme.zIndex): string {
  const varNames: Record<keyof typeof mobileTheme.zIndex, string> = {
    content: '--z-mobile-content',
    header: '--z-mobile-header',
    inputBar: '--z-mobile-input-bar',
    bottomNav: '--z-mobile-bottom-nav',
    fab: '--z-mobile-fab',
    sheet: '--z-mobile-sheet',
    modal: '--z-mobile-modal',
    toast: '--z-mobile-toast',
  };

  return `var(${varNames[layer]})`;
}

/**
 * Helper to check if current viewport is mobile
 * @public - Mobile theme utility
 *
 * @returns true if viewport width is less than mobile breakpoint
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < mobileTheme.breakpoints.mobile;
}

/**
 * Hook-friendly helper to get mobile spacing values
 *
 * @param key - Spacing key
 * @returns Spacing value with 'px' unit (or 'auto')
 */
export function getMobileSpacing(key: keyof typeof mobileTheme.spacing): string {
  const value = mobileTheme.spacing[key];
  return typeof value === 'number' ? `${value}px` : value;
}
