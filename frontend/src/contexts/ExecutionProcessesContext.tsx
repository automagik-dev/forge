import React, { createContext, useContext, useMemo, useRef } from 'react';
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

export const useExecutionProcessesContext = () => {
  const ctx = useContext(ExecutionProcessesContext);
  if (!ctx) {
    throw new Error(
      'useExecutionProcessesContext must be used within ExecutionProcessesProvider'
    );
  }
  return ctx;
};

/**
 * Selector hook for granular subscriptions to ExecutionProcessesContext.
 * Only re-renders when the selected value changes (by reference or custom equality).
 *
 * @example
 * // Only re-render when isAttemptRunningVisible changes
 * const isRunning = useExecutionProcessSelector(s => s.isAttemptRunningVisible);
 *
 * // With custom equality (for objects/arrays)
 * const processes = useExecutionProcessSelector(
 *   s => s.executionProcessesVisible,
 *   (a, b) => a.length === b.length && a.every((p, i) => p.id === b[i]?.id)
 * );
 */
export function useExecutionProcessSelector<T>(
  selector: (state: ExecutionProcessesContextType) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is
): T {
  const ctx = useExecutionProcessesContext();
  const selectedRef = useRef<T | undefined>(undefined);
  const selected = selector(ctx);

  // Only update ref if value actually changed
  if (selectedRef.current === undefined || !equalityFn(selectedRef.current, selected)) {
    selectedRef.current = selected;
  }

  return selectedRef.current;
}
