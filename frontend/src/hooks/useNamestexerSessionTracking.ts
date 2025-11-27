import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { v4 as uuidv4 } from 'uuid';
import { isNamestexEmployee } from '@/lib/track-analytics';
import { analyticsLogger } from '@/lib/logger';

/**
 * Namastexer session tracking hook
 * Only tracks sessions for @namastex.ai accounts
 * External users: No session tracking (zero impact)
 */
export function useNamestexerSessionTracking() {
  const posthog = usePostHog();
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    const userEmail = posthog.get_property('email') as string | undefined;

    // External users: Do nothing (no session tracking)
    if (!isNamestexEmployee(userEmail)) {
      return;
    }

    // @namastex.ai namastexers: Start session tracking
    sessionIdRef.current = uuidv4();
    sessionStartRef.current = Date.now();

    posthog.capture('namastexer_session_started', {
      session_id: sessionIdRef.current,
      namastexer_email: userEmail,
      tracking_tier: 'namastexer',
      timestamp: sessionStartRef.current,
    });

    analyticsLogger.log('namastexer_session_started', {
      session_id: sessionIdRef.current,
    });

    // Heartbeat every 30s (only for namastexers)
    heartbeatIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible' && sessionIdRef.current) {
        posthog.capture('namastexer_heartbeat', {
          session_id: sessionIdRef.current,
          namastexer_email: userEmail,
          tracking_tier: 'namastexer',
        });
      }
    }, 30000);

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (!sessionIdRef.current) return;

      if (document.visibilityState === 'visible') {
        posthog.capture('namastexer_session_resumed', {
          session_id: sessionIdRef.current,
          namastexer_email: userEmail,
          tracking_tier: 'namastexer',
        });
      } else {
        posthog.capture('namastexer_session_paused', {
          session_id: sessionIdRef.current,
          namastexer_email: userEmail,
          tracking_tier: 'namastexer',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Capture session end
      if (sessionIdRef.current && sessionStartRef.current) {
        posthog.capture('namastexer_session_ended', {
          session_id: sessionIdRef.current,
          namastexer_email: userEmail,
          tracking_tier: 'namastexer',
          duration_seconds: (Date.now() - sessionStartRef.current) / 1000,
        });
        analyticsLogger.log('namastexer_session_ended', {
          session_id: sessionIdRef.current,
          duration_seconds: (Date.now() - sessionStartRef.current) / 1000,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally run once on mount, posthog instance is stable
  }, []);
}
