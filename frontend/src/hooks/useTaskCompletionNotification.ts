import { useEffect, useRef } from 'react';
import type { ExecutionProcess } from 'shared/types';
import { useUserSystem } from '@/components/config-provider';

/**
 * Hook to play notification sound when a task execution process completes
 * Monitors execution processes and plays the configured sound when status changes to completed/failed/killed
 */
export function useTaskCompletionNotification(
  executionProcesses: ExecutionProcess[]
) {
  const { config } = useUserSystem();
  const previousProcessesRef = useRef<Map<string, string>>(new Map());
  // Track active audio elements for cleanup on unmount
  const activeAudioRef = useRef<Set<HTMLAudioElement>>(new Set());

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
      const isCompleted =
        currentStatus === 'completed' ||
        currentStatus === 'failed' ||
        currentStatus === 'killed';

      if (wasRunning && isCompleted && process.run_reason === 'codingagent') {
        // Task execution completed, play notification sound
        playNotificationSound(
          config.notifications.sound_file,
          config.notifications.sound_volume ?? 0.3,
          activeAudioRef.current
        );
      }
    });

    // Update ref for next comparison
    previousProcessesRef.current = currentProcesses;
  }, [executionProcesses, config]);

  // Cleanup: pause and remove all active audio elements on unmount
  useEffect(() => {
    const activeAudio = activeAudioRef.current;
    return () => {
      activeAudio.forEach((audio) => {
        audio.pause();
        audio.src = ''; // Release the audio resource
      });
      activeAudio.clear();
    };
  }, []);
}

/**
 * Play a notification sound at the specified volume
 * Tracks the audio element for cleanup and removes it when finished
 */
function playNotificationSound(
  soundFile: string,
  volume: number,
  activeAudioSet: Set<HTMLAudioElement>
) {
  try {
    const audio = new Audio(`/api/sounds/${soundFile}`);
    audio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1

    // Track this audio element
    activeAudioSet.add(audio);

    // Clean up when audio finishes playing
    const cleanup = () => {
      activeAudioSet.delete(audio);
      audio.removeEventListener('ended', cleanup);
      audio.removeEventListener('error', cleanup);
    };
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', cleanup);

    audio.play().catch((err) => {
      console.warn('Failed to play notification sound:', err);
      // Browser may block autoplay - this is expected behavior
      cleanup(); // Clean up on play failure
    });
  } catch (err) {
    console.error('Error creating notification audio:', err);
  }
}
