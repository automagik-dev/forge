import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Project } from 'shared/types';

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectsApi.getAll(),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}
