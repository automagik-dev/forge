import React, { useEffect } from 'react';
import { AUTOMAGIK_FEATURES, CUSTOM_THEMES } from './config';

// Conditionally import custom styles
if (AUTOMAGIK_FEATURES.enableDraculaTheme) {
  import('./themes/dracula.css');
}

if (AUTOMAGIK_FEATURES.enableBlankaFont) {
  import('./fonts/fonts.css');
}

interface CustomThemeWrapperProps {
  children: React.ReactNode;
  theme?: string;
}

/**
 * Wrapper component that adds automagik-forge customizations
 * This wraps the existing ThemeProvider to add our custom themes
 */
export function CustomThemeWrapper({ children, theme }: CustomThemeWrapperProps) {
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Add automagik-forge class if features are enabled
    if (AUTOMAGIK_FEATURES.showBranding) {
      root.classList.add('automagik-forge');
    }
    
    // Handle Dracula theme
    if (theme === 'dracula' && CUSTOM_THEMES.dracula.enabled) {
      root.classList.add('theme-dracula');
    } else {
      root.classList.remove('theme-dracula');
    }
  }, [theme]);
  
  return <>{children}</>;
}