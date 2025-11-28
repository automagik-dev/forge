import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from 'shared/types';

const THEME_STORAGE_KEY = 'forge-theme';

type ThemeProviderProps = {
  children: React.ReactNode;
  initialTheme?: ThemeMode;
};

type ThemeProviderState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
};

const initialState: ThemeProviderState = {
  theme: ThemeMode.SYSTEM,
  setTheme: () => null,
  resolvedTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && Object.values(ThemeMode).includes(stored as ThemeMode)) {
      return stored as ThemeMode;
    }
  } catch {
    // localStorage may not be available
  }
  return null;
}

function storeTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may not be available
  }
}

function getResolvedTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === ThemeMode.SYSTEM) {
    // SSR-safe: Check if window exists before accessing matchMedia
    if (typeof window === 'undefined') {
      return 'light'; // Default to light during SSR
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme.toLowerCase() as 'light' | 'dark';
}

export function ThemeProvider({
  children,
  initialTheme,
  ...props
}: ThemeProviderProps) {
  // Priority: initialTheme (from config) > localStorage > SYSTEM default
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return initialTheme ?? getStoredTheme() ?? ThemeMode.SYSTEM;
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    getResolvedTheme(initialTheme ?? getStoredTheme() ?? ThemeMode.SYSTEM)
  );

  // Update theme when initialTheme changes (from config load)
  useEffect(() => {
    if (initialTheme) {
      setThemeState(initialTheme);
    }
  }, [initialTheme]);

  // Apply theme to DOM and update resolved theme
  useEffect(() => {
    const root = window.document.documentElement;
    const resolved = getResolvedTheme(theme);

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    setResolvedTheme(resolved);
  }, [theme]);

  // Listen for system theme changes when in SYSTEM mode
  useEffect(() => {
    if (theme !== ThemeMode.SYSTEM) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      const newResolved = e.matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(newResolved);
      setResolvedTheme(newResolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
  };

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
