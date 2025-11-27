import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { attemptsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TaskAttempt } from 'shared/types';

/**
 * Track document visibility state.
 * Returns true when tab is visible, false when hidden/backgrounded.
 */
function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true
  );

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}

export function useBranchStatus(
  attemptId?: string,
  attempt?: TaskAttempt | null
) {
  // Only fetch branch status if attempt has a container_ref
  // (Master Genie and other no-worktree attempts won't have containers initially)
  const hasContainer = attempt?.container_ref != null;
  const isVisible = useDocumentVisible();

  return useQuery({
    queryKey: queryKeys.branch.status(attemptId),
    queryFn: () => attemptsApi.getBranchStatus(attemptId!),
    enabled: !!attemptId && hasContainer,
    // Smart polling: 15s when visible, 60s when backgrounded
    // Reduces unnecessary network requests while maintaining responsiveness
    refetchInterval: isVisible ? 15000 : 60000,
    // Ensure refetching continues when the tab is in the background
    refetchIntervalInBackground: true,
    // Consider data fresh for 5s to prevent rapid refetches
    staleTime: 5000,
  });
}
