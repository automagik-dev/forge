import { useEffect, useRef, useState } from 'react';
import { stripAnsi } from 'fancy-ansi';

export type DevserverBuildState =
  | 'building' // Actively compiling/building
  | 'error' // Build errors detected
  | 'idle' // No recent activity, might be stuck
  | 'unknown'; // Not enough information yet

const buildIndicators = [
  /compiling/i,
  /building/i,
  /bundling/i,
  /webpack/i,
  /vite.*build/i,
  /starting.*dev.*server/i,
  /wait.*compiling/i,
  /modules.*transformed/i,
  /processing/i,
];

const errorIndicators = [
  /error:/i,
  /failed.*compile/i,
  /cannot find module/i,
  /syntax.*error/i,
  /module.*not.*found/i,
  /\berror\b.*\bcompil/i,
];

const successIndicators = [
  /compiled.*successfully/i,
  /ready in/i,
  /server running/i,
  /local:.*http/i,
  /network:.*http/i,
];

/**
 * Analyzes dev server logs to detect current build state
 * Returns 'building' if actively compiling, 'error' if build failed,
 * 'idle' if logs stopped but no URL found, 'unknown' if not enough data
 */
export const useDevserverBuildState = (
  logs: Array<{ content: string; timestamp?: string }> | undefined,
  hasFoundUrl: boolean
): DevserverBuildState => {
  const [buildState, setBuildState] = useState<DevserverBuildState>('unknown');
  const lastLogTimeRef = useRef<number>(0);
  const lastCheckRef = useRef<number>(0);
  const processedLinesRef = useRef<number>(0);

  useEffect(() => {
    if (!logs || logs.length === 0) {
      setBuildState('unknown');
      processedLinesRef.current = 0;
      return;
    }

    // If URL found, we're done
    if (hasFoundUrl) {
      setBuildState('unknown'); // Don't show any alerts
      return;
    }

    // Reset if logs were cleared
    if (logs.length < processedLinesRef.current) {
      processedLinesRef.current = 0;
    }

    // Check recent logs (last 10 lines or new ones since last check)
    const startIndex = Math.max(0, logs.length - 10);
    const recentLogs = logs.slice(startIndex);

    let hasRecentBuildActivity = false;
    let hasErrors = false;
    let hasSuccess = false;

    recentLogs.forEach((log) => {
      const cleaned = stripAnsi(log.content).toLowerCase();

      // Check for build activity
      if (buildIndicators.some((pattern) => pattern.test(cleaned))) {
        hasRecentBuildActivity = true;
      }

      // Check for errors
      if (errorIndicators.some((pattern) => pattern.test(cleaned))) {
        hasErrors = true;
      }

      // Check for success
      if (successIndicators.some((pattern) => pattern.test(cleaned))) {
        hasSuccess = true;
      }
    });

    // Update last log time if we got new logs
    if (logs.length > processedLinesRef.current) {
      lastLogTimeRef.current = Date.now();
      processedLinesRef.current = logs.length;
    }

    // Determine state based on what we found
    if (hasErrors && !hasSuccess) {
      setBuildState('error');
    } else if (hasRecentBuildActivity) {
      setBuildState('building');
    } else {
      // Check if logs have been idle for a while (no new logs in 10 seconds)
      const now = Date.now();
      const timeSinceLastLog = now - lastLogTimeRef.current;

      // Also check how long since we started monitoring
      if (lastCheckRef.current === 0) {
        lastCheckRef.current = now;
      }
      const timeSinceStart = now - lastCheckRef.current;

      // If we've been monitoring for at least 10s and no new logs for 8s, consider it idle
      if (timeSinceStart > 10000 && timeSinceLastLog > 8000) {
        setBuildState('idle');
      } else {
        // Still gathering information
        setBuildState('building');
      }
    }
  }, [logs, hasFoundUrl]);

  return buildState;
};
