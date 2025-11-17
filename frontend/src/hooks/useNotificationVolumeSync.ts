import { useEffect } from 'react';
import type { Config } from 'shared/types';

const VOLUME_STORAGE_KEY = 'notification_sound_volume';

/**
 * Temporary hook to persist sound volume via localStorage until backend supports it.
 *
 * This provides a workaround while waiting for forge-core PR to add sound_volume field.
 * Once backend is updated, this can be removed.
 */
export function useNotificationVolumeSync(config: Config | null) {
  // Load volume from localStorage on mount if backend doesn't provide it
  useEffect(() => {
    if (!config) return;

    const storedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (storedVolume !== null && config.notifications.sound_volume === undefined) {
      // Backend doesn't have volume yet, but we have a stored value
      const volume = parseFloat(storedVolume);
      if (!isNaN(volume) && volume >= 0 && volume <= 1) {
        // Update config object (this won't persist to backend, but works for current session)
        config.notifications.sound_volume = volume;
      }
    }
  }, [config]);

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    if (config?.notifications.sound_volume !== undefined) {
      localStorage.setItem(VOLUME_STORAGE_KEY, config.notifications.sound_volume.toString());
    }
  }, [config?.notifications.sound_volume]);
}
