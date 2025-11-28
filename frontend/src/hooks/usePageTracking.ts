import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import type { PageVisitedEvent, NavigationMethod } from '@/types/analytics';
import { isNamestexEmployee } from '@/lib/track-analytics';
import { analyticsLogger } from '@/lib/logger';

/**
 * Custom hook to track page navigation for analytics
 * Captures page_visited events with time spent on previous page
 */
export function usePageTracking() {
  const location = useLocation();
  const posthog = usePostHog();
  const previousPageRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());
  const isFirstLoadRef = useRef<boolean>(true);

  useEffect(() => {
    const currentPath = location.pathname;
    const now = Date.now();

    // Determine page name from path
    let pageName: PageVisitedEvent['page'] = 'home';
    if (currentPath.startsWith('/projects') && currentPath.includes('/tasks')) {
      pageName = 'tasks';
    } else if (currentPath.startsWith('/projects')) {
      pageName = 'projects';
    } else if (currentPath.startsWith('/settings')) {
      pageName = 'settings';
    } else if (currentPath.includes('/full')) {
      pageName = 'logs';
    }

    // Determine navigation method
    let navigationMethod: NavigationMethod = 'direct_url';
    if (isFirstLoadRef.current) {
      navigationMethod = 'direct_url';
      isFirstLoadRef.current = false;
    } else if (
      location.state &&
      typeof location.state === 'object' &&
      'navigationMethod' in location.state
    ) {
      // Allow routes to specify navigation method via state
      navigationMethod =
        (location.state as { navigationMethod?: NavigationMethod })
          .navigationMethod || 'link';
    } else {
      // Default to 'link' for subsequent navigations
      navigationMethod = 'link';
    }

    // Calculate time on previous page
    const timeOnPreviousPage = previousPageRef.current
      ? Math.floor((now - pageStartTimeRef.current) / 1000)
      : null;

    // Capture page_visited event
    const pageVisitedEvent: PageVisitedEvent = {
      page: pageName,
      time_on_previous_page_seconds: timeOnPreviousPage,
      navigation_method: navigationMethod,
    };

    // ========== NAMASTEX ANALYTICS ==========
    const userEmail = posthog.get_property('email') as string | undefined;
    const isNamestexer = isNamestexEmployee(userEmail);

    if (isNamestexer) {
      posthog.capture('page_visited', {
        ...pageVisitedEvent,
        namastexer_email: userEmail,
        tracking_tier: 'namastexer',
      });
    } else {
      posthog.capture('page_visited', pageVisitedEvent);
    }

    analyticsLogger.log('page_visited', pageVisitedEvent);
    // ========== END ==========

    // Update refs for next navigation
    previousPageRef.current = currentPath;
    pageStartTimeRef.current = now;
  }, [location.pathname, location.state, posthog]);
}
