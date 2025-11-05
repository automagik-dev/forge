import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import type { TaskAttempt } from 'shared/types';

export function useBranchStatus(attemptId?: string, attempt?: TaskAttempt | null) {
  // Only fetch branch status if attempt has a container_ref
  // (Master Genie and other no-worktree attempts won't have containers initially)
  const hasContainer = attempt?.container_ref != null;

  return useQuery({
    queryKey: ['branchStatus', attemptId],
    queryFn: () => attemptsApi.getBranchStatus(attemptId!),
    enabled: !!attemptId && hasContainer,
    // Poll faster to promptly reflect rebase/abort transitions
    refetchInterval: 5000,
  });
}
