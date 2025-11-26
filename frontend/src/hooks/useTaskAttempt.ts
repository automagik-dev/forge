import { useQuery } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useTaskAttempt(attemptId?: string) {
  return useQuery({
    queryKey: queryKeys.taskAttempts.detail(attemptId),
    queryFn: () => attemptsApi.get(attemptId!),
    enabled: !!attemptId,
  });
}
