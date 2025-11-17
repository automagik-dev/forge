import { useEffect, useRef } from 'react';
import type { ExecutionProcess } from 'shared/types';
import { useUserSystem } from '@/components/config-provider';

/**
 * Hook to play notification sound when a task execution process completes
 * Monitors execution processes and plays the configured sound when status changes to completed/failed/killed
 */
export function useTaskCompletionNotification(executionProcesses: ExecutionProcess[]) {
  const { config } = useUserSystem();
  const previousProcessesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!config?.notifications.sound_enabled) {
      return;
    }

    const currentProcesses = new Map<string, string>();

    // Build current state and detect completions
    executionProcesses.forEach((process) => {
      const prevStatus = previousProcessesRef.current.get(process.id);
      const currentStatus = process.status;

      currentProcesses.set(process.id, currentStatus);

      // Check if process just completed (status changed from running to completed/failed/killed)
      const wasRunning = prevStatus === 'running';
      const isCompleted = currentStatus === 'completed' || currentStatus === 'failed' || currentStatus === 'killed';

      if (wasRunning && isCompleted && process.run_reason === 'codingagent') {
        // Task execution completed, play notification sound
        playNotificationSound(
          config.notifications.sound_file,
          config.notifications.sound_volume ?? 0.3
        );
      }
    });

    // Update ref for next comparison
    previousProcessesRef.current = currentProcesses;
  }, [executionProcesses, config]);
}

/**
 * Play a notification sound at the specified volume
 */
function playNotificationSound(soundFile: string, volume: number) {
  try {
    const audio = new Audio(`/api/sounds/${soundFile}`);
    audio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    audio.play().catch((err) => {
      console.warn('Failed to play notification sound:', err);
      // Browser may block autoplay - this is expected behavior
    });
  } catch (err) {
    console.error('Error creating notification audio:', err);
  }
}
