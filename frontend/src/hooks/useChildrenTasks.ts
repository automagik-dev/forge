import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';

/**
 * Fetch children tasks (subtasks) for a given task attempt.
 *
 * Follows real-time-data-standard.md: React Query for all server state.
 * Automatically refetches when cache is invalidated.
 *
 * @param attemptId - The task attempt ID to fetch children for
 * @returns React Query result with children tasks array
 *
 * @see .genie/code/spells/real-time-data-standard.md
 */
export function useChildrenTasks(attemptId?: string) {
  return useQuery({
    queryKey: ['children-tasks', attemptId],
    queryFn: async () => {
      if (!attemptId) return [];

      const relationships = await attemptsApi.getChildren(attemptId);
      return relationships.children;
    },
    enabled: !!attemptId,
    staleTime: 30_000, // Consider fresh for 30s
  });
}
