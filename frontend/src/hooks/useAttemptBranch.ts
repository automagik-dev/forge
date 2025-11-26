import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useAttemptBranch(attemptId?: string) {
  const getStatus = (err: unknown) => {
    const e = err as { status?: number; response?: { status?: number } } | undefined;
    return e?.status ?? e?.response?.status ?? null;
  };

  const query = useQuery({
    queryKey: queryKeys.branch.attempt(attemptId),
    queryFn: async () => {
      try {
        const attempt = await attemptsApi.get(attemptId!);
        return attempt.branch ?? null;
      } catch (error) {
        const status = getStatus(error);
        if (status === 404) {
          console.debug(`[useAttemptBranch] Attempt ${attemptId} not found (404)`);
          return null;
        }
        throw error;
      }
    },
    enabled: !!attemptId,
    retry: (failureCount, error) => {
      const status = getStatus(error);
      return status !== 404 && failureCount < 3;
    },
  });

  return {
    branch: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  } as const;
}
