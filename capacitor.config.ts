import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.namastex.forge',
  appName: 'Forge',
  webDir: 'frontend/dist',
  server: {
    androidScheme: 'https',
    hostname: 'forge.local',
    cleartext: true,
    allowNavigation: ['localhost', '127.0.0.1']
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Set in CI/CD
      keystoreAlias: undefined,
      keystorePassword: undefined,
      releaseType: 'APK'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    Keyboard: {
      resize: 'native',
      style: 'dark'
    }
  }
};

export default config;
