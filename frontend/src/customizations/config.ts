/**
 * Automagik-Forge Customization Configuration
 * 
 * Feature flags to control custom features that are not in upstream.
 * This allows easy toggling and maintains separation from vibe-kanban.
 */

export const AUTOMAGIK_FEATURES = {
  // Visual customizations
  enableDraculaTheme: true,
  enableBlankaFont: true,
  enableAnimatedAnvil: true,
  enableCustomLogo: true,
  
  // Feature customizations (for future use)
  enableWishSystem: false, // We'll add this later
  enableMultiUser: false,   // We'll add this later
  
  // Branding
  appName: 'automagik-forge',
  showBranding: true,
} as const;

// Helper to check if we're in automagik-forge mode
export const isAutomagikForge = () => {
  // Check if package name is automagik-forge or if explicitly enabled
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('automagik') || 
     (import.meta.env.VITE_AUTOMAGIK === 'true') ||
     AUTOMAGIK_FEATURES.showBranding);
};

// Theme configuration
export const CUSTOM_THEMES = {
  dracula: {
    name: 'Dracula',
    className: 'theme-dracula',
    enabled: AUTOMAGIK_FEATURES.enableDraculaTheme,
  }
} as const;