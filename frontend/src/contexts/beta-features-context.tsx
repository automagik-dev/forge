import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { betaFeaturesApi } from '@/lib/api';
import type { BetaFeature } from 'shared/forge-types';

const BETA_FEATURES_QUERY_KEY = ['beta-features'];

interface BetaFeaturesContextValue {
  features: BetaFeature[];
  loading: boolean;
  error: Error | null;
  isEnabled: (featureId: string) => boolean;
  toggleFeature: (featureId: string) => Promise<void>;
  refreshFeatures: () => Promise<void>;
}

const BetaFeaturesContext = createContext<BetaFeaturesContextValue | null>(
  null
);

interface BetaFeaturesProviderProps {
  children: ReactNode;
}

export function BetaFeaturesProvider({ children }: BetaFeaturesProviderProps) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BETA_FEATURES_QUERY_KEY,
    queryFn: () => betaFeaturesApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const toggleMutation = useMutation({
    mutationFn: (featureId: string) => betaFeaturesApi.toggle(featureId),
    onSuccess: (updatedFeature) => {
      // Update the cache with the new feature state
      queryClient.setQueryData<BetaFeature[]>(
        BETA_FEATURES_QUERY_KEY,
        (old) => {
          if (!old) return [updatedFeature];
          return old.map((f) =>
            f.id === updatedFeature.id ? updatedFeature : f
          );
        }
      );
    },
  });

  const isEnabled = useCallback(
    (featureId: string): boolean => {
      const feature = query.data?.find((f) => f.id === featureId);
      return feature?.enabled ?? false;
    },
    [query.data]
  );

  const toggleFeature = useCallback(
    async (featureId: string): Promise<void> => {
      await toggleMutation.mutateAsync(featureId);
    },
    [toggleMutation]
  );

  const refreshFeatures = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: BETA_FEATURES_QUERY_KEY });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      features: query.data ?? [],
      loading: query.isLoading,
      error: query.error,
      isEnabled,
      toggleFeature,
      refreshFeatures,
    }),
    [
      query.data,
      query.isLoading,
      query.error,
      isEnabled,
      toggleFeature,
      refreshFeatures,
    ]
  );

  return (
    <BetaFeaturesContext.Provider value={value}>
      {children}
    </BetaFeaturesContext.Provider>
  );
}

/**
 * Hook to access the full beta features context
 */
export function useBetaFeatures(): BetaFeaturesContextValue {
  const context = useContext(BetaFeaturesContext);
  if (!context) {
    throw new Error(
      'useBetaFeatures must be used within a BetaFeaturesProvider'
    );
  }
  return context;
}

/**
 * Convenience hook to check if a single feature is enabled
 */
export function useBetaFeature(featureId: string): boolean {
  const { isEnabled } = useBetaFeatures();
  return isEnabled(featureId);
}

/**
 * Component wrapper for conditional rendering based on beta feature state
 */
interface BetaFeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function BetaFeatureGate({
  feature,
  children,
  fallback = null,
}: BetaFeatureGateProps) {
  const enabled = useBetaFeature(feature);
  return <>{enabled ? children : fallback}</>;
}
