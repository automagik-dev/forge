import { Capacitor } from '@capacitor/core';

export const Platform = {
  /**
   * Check if running as native app
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  /**
   * Check if running on Android
   */
  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  /**
   * Check if running on iOS
   */
  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  },

  /**
   * Check if running in web browser
   */
  isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  },

  /**
   * Get platform name
   */
  getPlatform(): 'web' | 'android' | 'ios' {
    return Capacitor.getPlatform() as 'web' | 'android' | 'ios';
  },

  /**
   * Check if plugin is available
   */
  isPluginAvailable(pluginName: string): boolean {
    return Capacitor.isPluginAvailable(pluginName);
  }
};

/**
 * Hook for platform detection
 */
export function usePlatform() {
  return {
    isNative: Platform.isNative(),
    isAndroid: Platform.isAndroid(),
    isIOS: Platform.isIOS(),
    isWeb: Platform.isWeb(),
    platform: Platform.getPlatform()
  };
}
