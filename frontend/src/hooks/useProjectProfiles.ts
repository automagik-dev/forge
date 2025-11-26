import { useQuery } from '@tanstack/react-query';
import { projectProfilesApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useProjectProfiles(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.profiles(projectId),
    queryFn: () => {
      if (!projectId) throw new Error('Project ID required');
      return projectProfilesApi.load(projectId);
    },
    enabled: Boolean(projectId),
    staleTime: 1000 * 60 * 5, // 5 minute cache
  });
}
