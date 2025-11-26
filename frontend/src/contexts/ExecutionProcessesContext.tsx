import React, { useMemo } from 'react';
import {
  createContext,
  useContextSelector,
} from 'use-context-selector';
import { useExecutionProcesses } from '@/hooks/useExecutionProcesses';
import { useTaskCompletionNotification } from '@/hooks/useTaskCompletionNotification';
import type { ExecutionProcess } from 'shared/types';

type ExecutionProcessesContextType = {
  executionProcessesAll: ExecutionProcess[];
  executionProcessesByIdAll: Record<string, ExecutionProcess>;
  isAttemptRunningAll: boolean;

  executionProcessesVisible: ExecutionProcess[];
  executionProcessesByIdVisible: Record<string, ExecutionProcess>;
  isAttemptRunningVisible: boolean;

  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
};

const ExecutionProcessesContext =
  createContext<ExecutionProcessesContextType | null>(null);

export const ExecutionProcessesProvider: React.FC<{
  attemptId?: string | null;
  children: React.ReactNode;
}> = ({ attemptId, children }) => {
  const sanitizedAttemptId = attemptId ?? '';
  const {
    executionProcesses,
    executionProcessesById,
    isAttemptRunning,
    isLoading,
    isConnected,
    error,
  } = useExecutionProcesses(sanitizedAttemptId, { showSoftDeleted: true });

  // Monitor for task completion and play notification sound
  useTaskCompletionNotification(executionProcesses);

  const visible = useMemo(
    () => executionProcesses.filter((p) => !p.dropped),
    [executionProcesses]
  );

  const executionProcessesByIdVisible = useMemo(() => {
    const m: Record<string, ExecutionProcess> = {};
    for (const p of visible) m[p.id] = p;
    return m;
  }, [visible]);

  const isAttemptRunningVisible = useMemo(
    () =>
      visible.some(
        (process) =>
          (process.run_reason === 'codingagent' ||
            process.run_reason === 'setupscript' ||
            process.run_reason === 'cleanupscript') &&
          process.status === 'running'
      ),
    [visible]
  );

  const value = useMemo<ExecutionProcessesContextType>(
    () => ({
      executionProcessesAll: executionProcesses,
      executionProcessesByIdAll: executionProcessesById,
      isAttemptRunningAll: isAttemptRunning,
      executionProcessesVisible: visible,
      executionProcessesByIdVisible,
      isAttemptRunningVisible,
      isLoading,
      isConnected,
      error,
    }),
    [
      executionProcesses,
      executionProcessesById,
      isAttemptRunning,
      visible,
      executionProcessesByIdVisible,
      isAttemptRunningVisible,
      isLoading,
      isConnected,
      error,
    ]
  );

  return (
    <ExecutionProcessesContext.Provider value={value}>
      {children}
    </ExecutionProcessesContext.Provider>
  );
};

/**
 * Returns the full context value. Re-renders on any context change.
 * Prefer useExecutionProcessSelector for granular subscriptions.
 */
export const useExecutionProcessesContext = () => {
  const ctx = useContextSelector(ExecutionProcessesContext, (v) => v);
  if (!ctx) {
    throw new Error(
      'useExecutionProcessesContext must be used within ExecutionProcessesProvider'
    );
  }
  return ctx;
};

/**
 * Selector hook for granular subscriptions to ExecutionProcessesContext.
 * Only re-renders when the selected value changes (using use-context-selector).
 *
 * @example
 * // Only re-render when isAttemptRunningVisible changes
 * const isRunning = useExecutionProcessSelector(s => s.isAttemptRunningVisible);
 *
 * // Select multiple values (component re-renders when any selected value changes)
 * const { isLoading, error } = useExecutionProcessSelector(
 *   s => ({ isLoading: s.isLoading, error: s.error })
 * );
 */
export function useExecutionProcessSelector<T>(
  selector: (state: ExecutionProcessesContextType) => T
): T {
  const selected = useContextSelector(ExecutionProcessesContext, (ctx) => {
    if (!ctx) {
      throw new Error(
        'useExecutionProcessSelector must be used within ExecutionProcessesProvider'
      );
    }
    return selector(ctx);
  });
  return selected;
}
