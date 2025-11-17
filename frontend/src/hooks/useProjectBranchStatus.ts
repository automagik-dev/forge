import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';

export function useProjectBranchStatus(projectId?: string) {
  return useQuery({
    queryKey: ['projectBranchStatus', projectId],
    queryFn: () => projectsApi.getBranchStatus(projectId!),
    enabled: !!projectId,
    // Poll to detect changes in the project repository
    refetchInterval: 10000,
  });
}
