import { useTheme } from '@/components/theme-provider';
import { useEffect, useState } from 'react';

export function Logo({ className = '' }: { className?: string }) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const themeValue = String(theme);

    const updateTheme = () => {
      if (themeValue === 'LIGHT' || themeValue === 'ALUCARD') {
        setIsDark(false);
      } else if (themeValue === 'SYSTEM') {
        // System theme
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        // All other themes (dark, purple, green, blue, orange, red, dracula) have dark backgrounds
        setIsDark(true);
      }
    };

    updateTheme();

    // Listen for system theme changes when using system theme
    if (themeValue === 'SYSTEM') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  const logoSrc = isDark ? '/forge-dark.svg' : '/forge-clear.svg';

  return (
    <img
      src={logoSrc}
      alt="Automagik Forge"
      width="140"
      height="auto"
      className={className}
    />
  );
}
