import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { attemptsApi } from '@/lib/api';
import type { TaskAttempt, TaskWithAttemptStatus } from 'shared/types';

export const taskAttemptKeys = {
  all: ['taskAttempts'] as const,
  byTask: (taskId: string | undefined) => ['taskAttempts', taskId] as const,
};

type Options = {
  enabled?: boolean;
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
    queryKey: taskAttemptKeys.byTask(taskId),
    queryFn: () => attemptsApi.getAll(taskId!),
    enabled,
    staleTime: 60_000, // Fresh for 1 minute - data is immutable
    // NO refetchInterval - attempts don't change after creation
  });
}

/**
 * Hook that combines useTaskAttempts with task stream status monitoring.
 * Automatically invalidates attempts cache when task status changes
 * (e.g., has_in_progress_attempt transitions).
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

  const attemptsQuery = useTaskAttempts(taskId, opts);

  // Invalidate attempts cache when task status changes
  // We intentionally only depend on has_in_progress_attempt, not the full task object
  useEffect(() => {
    if (!taskId || !task) return;

    const currentStatus = task.has_in_progress_attempt;
    if (
      prevStatusRef.current !== undefined &&
      prevStatusRef.current !== currentStatus
    ) {
      // Status changed - refresh attempts list
      queryClient.invalidateQueries({ queryKey: taskAttemptKeys.byTask(taskId) });
    }
    prevStatusRef.current = currentStatus;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.has_in_progress_attempt, taskId, queryClient]);

  return attemptsQuery;
}
