import { useMemo } from 'react';
import { Task, TaskAttempt } from '@/shared/types';

/**
 * Filters tasks that should appear in widget views.
 *
 * Shows tasks with status="agent" that match the widget's variant.
 *
 * How it works:
 * 1. Filters tasks where status === "agent"
 * 2. Finds matching task attempts
 * 3. Parses executor string to extract variant (e.g., "claude_code:wish" → "wish")
 * 4. Returns only tasks where variant matches the widget
 *
 * @param tasks - All tasks from the project
 * @param taskAttempts - All task attempts from the project
 * @param variant - The widget variant to filter by ("wish", "forge", or "review")
 * @returns Filtered array of tasks that match the variant
 *
 * @example
 * const agentTasks = useAgentTasks(allTasks, allAttempts, 'wish');
 * // Returns only tasks with status="agent" and executor variant="wish"
 */
export const useAgentTasks = (
  tasks: Task[],
  taskAttempts: TaskAttempt[],
  variant: 'wish' | 'forge' | 'review'
): Task[] => {
  return useMemo(() => {
    // Step 1: Get tasks with agent status
    const agentTasks = tasks.filter(task => task.status === 'agent');

    // Step 2: Match with task attempts that have the correct variant
    return agentTasks.filter(task => {
      // Find the most recent task attempt for this task
      const attempt = taskAttempts
        .filter(a => a.task_id === task.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!attempt) {
        return false;
      }

      // Step 3: Parse executor to extract variant
      // Format: "claude_code:wish" or "gemini:forge" or just "claude_code"
      const executorParts = attempt.executor.split(':');

      // If no variant in executor string, this is not an agent task
      if (executorParts.length < 2) {
        return false;
      }

      const attemptVariant = executorParts[1];

      // Step 4: Match variant
      return attemptVariant === variant;
    });
  }, [tasks, taskAttempts, variant]);
};

/**
 * Hook to count agent tasks for a specific variant.
 * Useful for displaying task counts in widget headers.
 *
 * @param tasks - All tasks from the project
 * @param taskAttempts - All task attempts from the project
 * @param variant - The widget variant to count
 * @returns Number of agent tasks for this variant
 */
export const useAgentTaskCount = (
  tasks: Task[],
  taskAttempts: TaskAttempt[],
  variant: 'wish' | 'forge' | 'review'
): number => {
  const agentTasks = useAgentTasks(tasks, taskAttempts, variant);
  return agentTasks.length;
};

/**
 * Hook to check if any agent tasks are running for a variant.
 *
 * @param tasks - All tasks from the project
 * @param taskAttempts - All task attempts from the project
 * @param variant - The widget variant to check
 * @returns True if any agent tasks exist for this variant
 */
export const useHasAgentTasks = (
  tasks: Task[],
  taskAttempts: TaskAttempt[],
  variant: 'wish' | 'forge' | 'review'
): boolean => {
  const count = useAgentTaskCount(tasks, taskAttempts, variant);
  return count > 0;
};
