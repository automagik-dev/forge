import { useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi, executionProcessesApi } from '@/lib/api';
import { useAttemptExecution } from '@/hooks/useAttemptExecution';
import type { ExecutionProcess } from 'shared/types';
import { usePostHog } from 'posthog-js/react';
import type { DevServerStartedEvent, DevServerStoppedEvent } from '@/types/analytics';
import { analyticsLogger } from '@/lib/logger';

interface UseDevServerOptions {
  onStartSuccess?: () => void;
  onStartError?: (err: unknown) => void;
  onStopSuccess?: () => void;
  onStopError?: (err: unknown) => void;
}

export function useDevServer(
  attemptId: string | undefined,
  options?: UseDevServerOptions
) {
  const queryClient = useQueryClient();
  const { attemptData } = useAttemptExecution(attemptId);
  const posthog = usePostHog();
  const devServerStartTimeRef = useRef<number | null>(null);
  const devServerUsageCountRef = useRef<number>(
    parseInt(localStorage.getItem('dev_server_usage_count') || '0', 10)
  );

  // Find running dev server process
  const runningDevServer = useMemo<ExecutionProcess | undefined>(() => {
    return attemptData.processes.find(
      (process) =>
        process.run_reason === 'devserver' && process.status === 'running'
    );
  }, [attemptData.processes]);

  // Find latest dev server process (for logs viewing)
  const latestDevServerProcess = useMemo<ExecutionProcess | undefined>(() => {
    return [...attemptData.processes]
      .filter((process) => process.run_reason === 'devserver')
      .sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )[0];
  }, [attemptData.processes]);

  // Start mutation
  const startMutation = useMutation({
    mutationKey: ['startDevServer', attemptId],
    mutationFn: async () => {
      if (!attemptId) return;
      await attemptsApi.startDevServer(attemptId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['executionProcesses', attemptId],
      });

      // Track dev_server_started event
      if (attemptId) {
        const usageCount = devServerUsageCountRef.current;
        // Check if there are any failed processes in this attempt (indicates previous failure)
        const hasFailedBefore = attemptData.processes.some(
          (p) => p.status === 'failed' || (p.exit_code !== null && p.exit_code !== BigInt(0))
        );

        const devServerStartedEvent: DevServerStartedEvent = {
          attempt_id: attemptId,
          task_has_failed_before: hasFailedBefore,
          is_first_use: usageCount === 0,
        };

        posthog.capture('dev_server_started', devServerStartedEvent);
        analyticsLogger.log('dev_server_started', devServerStartedEvent);

        // Update usage count
        devServerUsageCountRef.current = usageCount + 1;
        localStorage.setItem('dev_server_usage_count', (usageCount + 1).toString());
        devServerStartTimeRef.current = Date.now();
      }

      options?.onStartSuccess?.();
    },
    onError: (err) => {
      analyticsLogger.error('Failed to start dev server:', err);
      options?.onStartError?.(err);
    },
  });

  // Stop mutation
  const stopMutation = useMutation({
    mutationKey: ['stopDevServer', runningDevServer?.id],
    mutationFn: async () => {
      if (!runningDevServer) return;
      await executionProcessesApi.stopExecutionProcess(runningDevServer.id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['executionProcesses', attemptId],
        }),
        runningDevServer
          ? queryClient.invalidateQueries({
              queryKey: ['processDetails', runningDevServer.id],
            })
          : Promise.resolve(),
      ]);

      // Track dev_server_stopped event
      if (attemptId && devServerStartTimeRef.current) {
        const duration = Math.floor((Date.now() - devServerStartTimeRef.current) / 1000);
        const devServerStoppedEvent: DevServerStoppedEvent = {
          attempt_id: attemptId,
          duration_seconds: duration,
          was_manual_stop: true, // User manually stopped
        };

        posthog.capture('dev_server_stopped', devServerStoppedEvent);
        analyticsLogger.log('dev_server_stopped', devServerStoppedEvent);
        devServerStartTimeRef.current = null;
      }

      options?.onStopSuccess?.();
    },
    onError: (err) => {
      analyticsLogger.error('Failed to stop dev server:', err);
      options?.onStopError?.(err);
    },
  });

  return {
    start: startMutation.mutate,
    stop: stopMutation.mutate,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    runningDevServer,
    latestDevServerProcess,
  };
}
