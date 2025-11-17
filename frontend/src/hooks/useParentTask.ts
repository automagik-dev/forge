import { useQuery } from '@tanstack/react-query';
import { attemptsApi, tasksApi } from '@/lib/api';

/**
 * Fetch parent task for a given task attempt.
 *
 * Follows real-time-data-standard.md: React Query for all server state.
 * Automatically refetches when cache is invalidated.
 *
 * @param parentAttemptId - The parent task attempt ID
 * @returns React Query result with parent task data
 *
 * @see .genie/code/spells/real-time-data-standard.md
 */
export function useParentTask(parentAttemptId?: string) {
  return useQuery({
    queryKey: ['parent-task', parentAttemptId],
    queryFn: async () => {
      if (!parentAttemptId) return null;

      const attempt = await attemptsApi.get(parentAttemptId);
      return tasksApi.getById(attempt.task_id);
    },
    enabled: !!parentAttemptId,
    staleTime: 30_000, // Consider fresh for 30s
  });
}
