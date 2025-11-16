import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useProjectTasks } from './useProjectTasks';
import { useTaskAttempts } from './useTaskAttempts';
import { useBranchStatus } from './useBranchStatus';
import { useApproveTask } from './useApproveTask';
import { useRebase } from './useRebase';
import { useProject } from '@/contexts/project-context';

/**
 * Hook that provides mobile-specific task actions (sync/approve)
 * Automatically fetches relevant data based on URL params
 */
export function useMobileTaskActions() {
  const { taskId, attemptId: routeAttemptId } = useParams<{
    taskId?: string;
    attemptId?: string;
  }>();
  const { projectId } = useProject();

  // Fetch tasks to get the selected task data
  const { tasksById } = useProjectTasks(projectId || '');
  const selectedTask = useMemo(
    () => (taskId && tasksById ? (tasksById[taskId] ?? null) : null),
    [taskId, tasksById]
  );

  // Get attempts to find the latest if no specific attemptId in URL
  const { data: attempts = [] } = useTaskAttempts(taskId, {
    enabled: !!taskId && !routeAttemptId,
  });

  const latestAttemptId = useMemo(() => {
    if (routeAttemptId && routeAttemptId !== 'latest') return routeAttemptId;
    if (!attempts?.length) return undefined;
    return [...attempts].sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    })[0].id;
  }, [routeAttemptId, attempts]);

  // Get the actual attempt object
  const currentAttempt = useMemo(() => {
    if (!latestAttemptId || !attempts?.length) return null;
    return attempts.find((a) => a.id === latestAttemptId) ?? null;
  }, [latestAttemptId, attempts]);

  // Branch status for the attempt
  const { data: branchStatus, isLoading: isBranchStatusLoading } = useBranchStatus(
    latestAttemptId,
    currentAttempt
  );

  // Approve task hook
  const { approve, isApproving, error: approveError } = useApproveTask();

  // Rebase hook
  const rebaseMutation = useRebase(latestAttemptId, projectId);

  // Calculate action availability
  const hasCodeChanges = (branchStatus?.commits_ahead ?? 0) > 0;
  const hasConflicts = (branchStatus?.conflicted_files?.length ?? 0) > 0;
  const canApprove = selectedTask?.status === 'inreview' && !hasConflicts;
  const canSync = !!latestAttemptId && !!currentAttempt?.container_ref && !hasConflicts;
  const isSyncing = rebaseMutation.isPending;

  // Action handlers
  const handleSync = () => {
    if (!canSync) return;
    rebaseMutation.mutate({});
  };

  const handleApprove = () => {
    if (!canApprove || !selectedTask || !latestAttemptId || !projectId) return;
    approve({
      taskId: selectedTask.id,
      attemptId: latestAttemptId,
      shouldMerge: hasCodeChanges,
      projectId,
      title: selectedTask.title,
      description: selectedTask.description,
      parentTaskAttempt: selectedTask.parent_task_attempt,
    });
  };

  // Disabled reasons
  const syncDisabledReason = !canSync
    ? hasConflicts
      ? 'Resolve conflicts first'
      : !latestAttemptId
        ? 'No attempt selected'
        : !currentAttempt?.container_ref
          ? 'No worktree available'
          : null
    : null;

  const approveDisabledReason = !canApprove
    ? hasConflicts
      ? 'Resolve conflicts first'
      : selectedTask?.status !== 'inreview'
        ? 'Task must be in review'
        : 'Cannot approve task'
    : null;

  return {
    // Data
    taskId,
    attemptId: latestAttemptId,
    selectedTask,
    currentAttempt,
    branchStatus,
    projectId,

    // Loading states
    isLoading: isBranchStatusLoading,
    isSyncing,
    isApproving,

    // Capabilities
    canSync,
    canApprove,
    hasCodeChanges,
    hasConflicts,

    // Actions
    handleSync,
    handleApprove,

    // Disabled reasons
    syncDisabledReason,
    approveDisabledReason,

    // Errors
    approveError,
  };
}
