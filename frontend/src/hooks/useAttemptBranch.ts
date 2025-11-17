import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';

export function useAttemptBranch(attemptId?: string) {
  const query = useQuery({
    queryKey: ['attemptBranch', attemptId],
    queryFn: async () => {
      try {
        const attempt = await attemptsApi.get(attemptId!);
        return attempt.branch ?? null;
      } catch (error) {
        // Handle 404 - task attempt may not exist yet
        // This can happen when viewing a task without attempts
        console.debug(`[useAttemptBranch] Failed to load attempt ${attemptId}:`, error);
        return null;
      }
    },
    enabled: !!attemptId,
    retry: false, // Don't retry 404s
  });

  return {
    branch: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  } as const;
}
