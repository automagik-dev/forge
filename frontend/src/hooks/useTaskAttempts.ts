import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { attemptsApi } from '@/lib/api';
import type { TaskAttempt, TaskWithAttemptStatus } from 'shared/types';
import { queryKeys } from '@/lib/queryKeys';

type Options = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

/**
 * Fetches task attempts with event-driven cache invalidation.
 *
 * TaskAttempts are effectively immutable after creation - token counts
 * and other fields don't update during execution. Instead of polling,
 * this hook relies on:
 * 1. staleTime to keep data fresh for 1 minute
 * 2. Manual invalidation on mutations (attempt create/delete)
 * 3. useTaskAttemptsWithLiveStatus for components needing task stream reactivity
 */
export function useTaskAttempts(taskId?: string, opts?: Options) {
  const enabled = (opts?.enabled ?? true) && !!taskId;

  return useQuery<TaskAttempt[]>({
    queryKey: queryKeys.taskAttempts.byTask(taskId),
    queryFn: () => attemptsApi.getAll(taskId!),
    enabled,
    staleTime: 60_000, // Fresh for 1 minute - data is immutable
    refetchInterval: opts?.refetchInterval, // Optional polling fallback
  });
}

/**
 * Hook that combines useTaskAttempts with task stream status monitoring.
 * Automatically invalidates attempts cache when:
 * - has_in_progress_attempt status changes (attempt starts/completes)
 * - attempt_count changes (new attempt created, including external ones)
 *
 * Use this when displaying attempts alongside live task status.
 */
export function useTaskAttemptsWithLiveStatus(
  taskId: string | undefined,
  task: TaskWithAttemptStatus | null | undefined,
  opts?: Options
) {
  const queryClient = useQueryClient();
  const prevStatusRef = useRef<boolean | undefined>();
  const prevAttemptCountRef = useRef<number | undefined>();

  const attemptsQuery = useTaskAttempts(taskId, opts);

  // Invalidate attempts cache when task status OR attempt count changes
  // We intentionally only depend on specific properties, not the full task object
  useEffect(() => {
    if (!taskId || !task) return;

    const currentStatus = task.has_in_progress_attempt;
    // Convert bigint to number for comparison (safe for practical attempt counts)
    const currentCount = Number(task.attempt_count);

    const statusChanged =
      prevStatusRef.current !== undefined &&
      prevStatusRef.current !== currentStatus;

    const countChanged =
      prevAttemptCountRef.current !== undefined &&
      prevAttemptCountRef.current !== currentCount;

    if (statusChanged || countChanged) {
      // Status or count changed - refresh attempts list
      queryClient.invalidateQueries({ queryKey: queryKeys.taskAttempts.byTask(taskId) });
    }

    prevStatusRef.current = currentStatus;
    prevAttemptCountRef.current = currentCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.has_in_progress_attempt, task?.attempt_count, taskId, queryClient]);

  return attemptsQuery;
}
