import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type Config,
  type Environment,
  type UserSystemInfo,
  type BaseAgentCapability,
  CheckTokenResponse,
} from 'shared/types';
import type { ExecutorConfig } from 'shared/types';
import { configApi, githubAuthApi } from '../lib/api';
import { updateLanguageFromConfig } from '../i18n/config';

interface UserSystemState {
  config: Config | null;
  environment: Environment | null;
  profiles: Record<string, ExecutorConfig> | null;
  capabilities: Record<string, BaseAgentCapability[]> | null;
  analyticsUserId: string | null;
}

interface UserSystemContextType {
  // Full system state
  system: UserSystemState;

  // Hot path - config helpers (most frequently used)
  config: Config | null;
  updateConfig: (updates: Partial<Config>) => void;
  updateAndSaveConfig: (updates: Partial<Config>) => Promise<boolean>;
  saveConfig: () => Promise<boolean>;

  // System data access
  environment: Environment | null;
  profiles: Record<string, ExecutorConfig> | null;
  capabilities: Record<string, BaseAgentCapability[]> | null;
  analyticsUserId: string | null;
  setEnvironment: (env: Environment | null) => void;
  setProfiles: (profiles: Record<string, ExecutorConfig> | null) => void;
  setCapabilities: (caps: Record<string, BaseAgentCapability[]> | null) => void;

  // Reload system data
  reloadSystem: () => Promise<void>;

  // State
  loading: boolean;
  githubTokenInvalid: boolean;
}

const UserSystemContext = createContext<UserSystemContextType | undefined>(
  undefined
);

interface UserSystemProviderProps {
  children: ReactNode;
}

export function UserSystemProvider({ children }: UserSystemProviderProps) {
  // Split state for performance - independent re-renders
  const [config, setConfig] = useState<Config | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [profiles, setProfiles] = useState<Record<
    string,
    ExecutorConfig
  > | null>(null);
  const [capabilities, setCapabilities] = useState<Record<
    string,
    BaseAgentCapability[]
  > | null>(null);
  const [analyticsUserId, setAnalyticsUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubTokenInvalid, setGithubTokenInvalid] = useState(false);

  useEffect(() => {
    const loadUserSystem = async () => {
      try {
        const userSystemInfo: UserSystemInfo = await configApi.getConfig();
        setConfig(userSystemInfo.config);
        setEnvironment(userSystemInfo.environment);
        setAnalyticsUserId(userSystemInfo.analytics_user_id);
        setProfiles(
          userSystemInfo.executors as Record<string, ExecutorConfig> | null
        );
        setCapabilities(
          (userSystemInfo.capabilities || null) as Record<
            string,
            BaseAgentCapability[]
          > | null
        );
      } catch (err) {
        console.error('Error loading user system:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserSystem();
  }, []);

  // Sync language with i18n when config changes
  useEffect(() => {
    if (config?.language) {
      updateLanguageFromConfig(config.language);
    }
  }, [config?.language]);

  // Check GitHub token validity after config loads and when auth tokens change
  useEffect(() => {
    if (loading) return;
    const checkToken = async () => {
      const valid = await githubAuthApi.checkGithubToken();
      if (valid === undefined) {
        // Network/server error: do not update githubTokenInvalid
        return;
      }
      switch (valid) {
        case CheckTokenResponse.VALID:
          setGithubTokenInvalid(false);
          break;
        case CheckTokenResponse.INVALID:
          setGithubTokenInvalid(true);
          break;
      }
    };
    checkToken();
  }, [loading, config?.github?.oauth_token, config?.github?.pat]);

  const updateConfig = useCallback((updates: Partial<Config>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!config) return false;
    try {
      await configApi.saveConfig(config);
      return true;
    } catch (err) {
      console.error('Error saving config:', err);
      return false;
    }
  }, [config]);

  // Use a ref to access current config without adding it as a dependency
  // This stabilizes the callback identity and prevents unnecessary effect re-runs
  const configRef = useRef<Config | null>(config);
  configRef.current = config;

  const updateAndSaveConfig = useCallback(
    async (updates: Partial<Config>): Promise<boolean> => {
      const currentConfig = configRef.current;
      if (!currentConfig) return false;

      setLoading(true);
      const newConfig: Config = { ...currentConfig, ...updates };
      try {
        const saved = await configApi.saveConfig(newConfig);
        setConfig(saved);
        return true;
      } catch (err) {
        console.error('Error saving config:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [] // No dependencies - uses ref for config access
  );

  const reloadSystem = useCallback(async () => {
    try {
      const userSystemInfo: UserSystemInfo = await configApi.getConfig();
      setConfig(userSystemInfo.config);
      setEnvironment(userSystemInfo.environment);
      setAnalyticsUserId(userSystemInfo.analytics_user_id);
      setProfiles(
        userSystemInfo.executors as Record<string, ExecutorConfig> | null
      );
      setCapabilities(
        (userSystemInfo.capabilities || null) as Record<
          string,
          BaseAgentCapability[]
        > | null
      );
    } catch (err) {
      console.error('Error reloading user system:', err);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<UserSystemContextType>(
    () => ({
      system: { config, environment, profiles, capabilities, analyticsUserId },
      config,
      environment,
      profiles,
      capabilities,
      analyticsUserId,
      updateConfig,
      saveConfig,
      updateAndSaveConfig,
      setEnvironment,
      setProfiles,
      setCapabilities,
      reloadSystem,
      loading,
      githubTokenInvalid,
    }),
    [
      config,
      environment,
      profiles,
      capabilities,
      analyticsUserId,
      updateConfig,
      saveConfig,
      updateAndSaveConfig,
      reloadSystem,
      loading,
      githubTokenInvalid,
    ]
  );

  return (
    <UserSystemContext.Provider value={value}>
      {children}
    </UserSystemContext.Provider>
  );
}

export function useUserSystem() {
  const context = useContext(UserSystemContext);
  if (context === undefined) {
    throw new Error('useUserSystem must be used within a UserSystemProvider');
  }
  return context;
}
