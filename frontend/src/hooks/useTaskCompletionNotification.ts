import { useEffect, useRef } from 'react';
import type { ExecutionProcess } from 'shared/types';
import { useUserSystem } from '@/components/config-provider';

/**
 * Hook to play notification sound when a task execution process completes
 * Monitors execution processes and plays the configured sound when status changes to completed/failed/killed
 *
 * Uses a Set to track which process IDs have already triggered notification,
 * preventing duplicate sounds from re-renders or array re-creation.
 */
export function useTaskCompletionNotification(
  executionProcesses: ExecutionProcess[]
) {
  const { config } = useUserSystem();
  // Track which process IDs have already played notification sound
  // This prevents duplicates from re-renders, React Strict Mode, or array re-creation
  const notifiedProcessIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!config?.notifications.sound_enabled) {
      return;
    }

    executionProcesses.forEach((process) => {
      const isCompleted =
        process.status === 'completed' ||
        process.status === 'failed' ||
        process.status === 'killed';

      // Only notify once per process ID when it reaches a completed state
      if (
        isCompleted &&
        process.run_reason === 'codingagent' &&
        !notifiedProcessIdsRef.current.has(process.id)
      ) {
        notifiedProcessIdsRef.current.add(process.id);
        playNotificationSound(config.notifications.sound_file, 1.0);
      }
    });
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
