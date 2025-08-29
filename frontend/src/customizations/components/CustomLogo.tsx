import React from 'react';
import { AUTOMAGIK_FEATURES } from '../config';
import logoLight from '../assets/logo.svg';
import logoDark from '../assets/logo-dark.svg';

interface CustomLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

/**
 * Custom Logo Component for Automagik-Forge
 * Falls back to text if logos are not available
 */
export function CustomLogo({ className = '', variant = 'auto' }: CustomLogoProps) {
  if (!AUTOMAGIK_FEATURES.enableCustomLogo) {
    return null;
  }

  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        document.documentElement.classList.contains('theme-dracula');
      setIsDark(isDarkMode);
    };

    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const logoSrc = variant === 'dark' ? logoDark : 
                  variant === 'light' ? logoLight :
                  isDark ? logoDark : logoLight;

  return (
    <div className={`custom-logo ${className}`}>
      <img 
        src={logoSrc} 
        alt="Automagik Forge"
        className="h-8 w-auto"
        onError={(e) => {
          // Fallback to text if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <span className="hidden font-blanka text-xl">AUTOMAGIK FORGE</span>
    </div>
  );
}