import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';

export function useProjectBranchStatus(projectId?: string, baseBranch?: string) {
  return useQuery({
    queryKey: ['projectBranchStatus', projectId, baseBranch],
    queryFn: () => projectsApi.getBranchStatus(projectId!, baseBranch),
    enabled: !!projectId,
    // Poll to detect changes in the project repository
    refetchInterval: 30000, // Reduced from 10s to 30s to minimize server load
  });
}
