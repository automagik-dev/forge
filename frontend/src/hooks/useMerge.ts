import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useMerge(
  attemptId?: string,
  onSuccess?: () => void,
  onError?: (err: unknown) => void
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!attemptId) return Promise.resolve();
      return attemptsApi.merge(attemptId);
    },
    onSuccess: () => {
      // Refresh attempt-specific branch information
      queryClient.invalidateQueries({ queryKey: queryKeys.branch.status(attemptId) });

      // If a merge can change the list of branches shown elsewhere
      // Note: Uses partial match to invalidate all projectBranches queries regardless of projectId
      // queryKeys.branch.projectAll() returns ['projectBranches', projectId], so we match the prefix
      queryClient.invalidateQueries({ queryKey: ['projectBranches'] });

      onSuccess?.();
    },
    onError: (err) => {
      console.error('Failed to merge:', err);
      onError?.(err);
    },
  });
}
