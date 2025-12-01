import { useState, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'forge:manualPreviewUrl:';

/**
 * Hook for managing manual preview URL override with localStorage persistence per project
 */
export function useManualPreviewUrl(projectId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${projectId}`;

  const [manualUrl, setManualUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });

  const setManualPreviewUrl = useCallback(
    (url: string | null) => {
      try {
        if (url) {
          localStorage.setItem(storageKey, url);
        } else {
          localStorage.removeItem(storageKey);
        }
        setManualUrl(url);
      } catch (error) {
        console.error('Failed to persist manual preview URL:', error);
      }
    },
    [storageKey]
  );

  const clearManualUrl = useCallback(() => {
    setManualPreviewUrl(null);
  }, [setManualPreviewUrl]);

  return {
    manualUrl,
    setManualUrl: setManualPreviewUrl,
    clearManualUrl,
    isManual: Boolean(manualUrl),
  };
}

/**
 * Validate and normalize a manual URL input
 * Accepts:
 * - Full URLs: http://localhost:3000, https://example.com
 * - Port-only: 3000 (converted to http://localhost:3000)
 */
export function validateAndNormalizeUrl(input: string): {
  valid: boolean;
  url?: string;
  error?: string;
} {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  if (/^\d+$/.test(trimmed)) {
    const port = parseInt(trimmed, 10);
    if (port < 1 || port > 65535) {
      return { valid: false, error: 'Port must be between 1 and 65535' };
    }
    return { valid: true, url: `http://localhost:${port}` };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use http:// or https://' };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Use http://localhost:3000 or just 3000',
    };
  }
}
