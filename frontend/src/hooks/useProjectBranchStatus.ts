import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';

export function useProjectBranchStatus(projectId?: string) {
  return useQuery({
    queryKey: ['projectBranchStatus', projectId],
    queryFn: () => projectsApi.getBranchStatus(projectId!),
    enabled: !!projectId,
    // Poll to detect when remote has new commits
    refetchInterval: 30000, // Poll every 30 seconds (less frequently than attempt status)
  });
}
