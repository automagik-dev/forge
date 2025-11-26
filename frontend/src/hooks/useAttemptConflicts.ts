import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useAttemptConflicts(attemptId?: string) {
  const queryClient = useQueryClient();

  const abortConflicts = useCallback(async () => {
    if (!attemptId) return;
    await attemptsApi.abortConflicts(attemptId);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.branch.status(attemptId),
    });
  }, [attemptId, queryClient]);

  return { abortConflicts } as const;
}
