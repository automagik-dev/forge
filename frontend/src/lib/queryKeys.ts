/**
 * Centralized Query Keys Factory
 *
 * All React Query keys should be defined here to prevent mismatches between
 * query definitions and cache invalidations. This is the single source of truth.
 *
 * Usage:
 *   import { queryKeys } from '@/lib/queryKeys';
 *
 *   // In a query hook:
 *   useQuery({ queryKey: queryKeys.taskAttempts.byTask(taskId), ... });
 *
 *   // In a mutation for invalidation:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.taskAttempts.byTask(taskId) });
 */

export const queryKeys = {
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    byProject: (projectId: string | undefined) => ['tasks', projectId] as const,
    detail: (taskId: string | undefined) => ['task', taskId] as const,
    images: (taskId: string | undefined, idsKey: string) =>
      ['taskImages', taskId, idsKey] as const,
  },

  // Task Attempts
  taskAttempts: {
    all: ['taskAttempts'] as const,
    byTask: (taskId: string | undefined) => ['taskAttempts', taskId] as const,
    detail: (attemptId: string | undefined) =>
      ['taskAttempt', attemptId] as const,
  },

  // Task Relationships
  taskRelationships: {
    all: ['taskRelationships'] as const,
    byAttempt: (attemptId: string | undefined) =>
      ['taskRelationships', attemptId] as const,
    children: (attemptId: string | undefined) =>
      ['childrenTasks', attemptId] as const,
    parent: (attemptId: string | undefined) =>
      ['parentTask', attemptId] as const,
    parentFromAttempt: (attemptId: string | undefined) =>
      ['parentTaskFromAttempt', attemptId] as const,
  },

  // Branch/VCS
  branch: {
    status: (attemptId: string | undefined) =>
      ['branchStatus', attemptId] as const,
    attempt: (attemptId: string | undefined) =>
      ['attemptBranch', attemptId] as const,
    projectStatus: (
      projectId: string | undefined,
      baseBranch: string | undefined
    ) => ['projectBranchStatus', projectId, baseBranch] as const,
    projectAll: (projectId: string | undefined) =>
      ['projectBranches', projectId] as const,
    // For prefix matching all project branches (used in invalidateQueries)
    allProjects: ['projectBranches'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    detail: (projectId: string | undefined) => ['project', projectId] as const,
    profiles: (projectId: string | undefined) =>
      ['projectProfiles', projectId] as const,
  },

  // Execution
  execution: {
    processes: (attemptId: string | undefined) =>
      ['executionProcesses', attemptId] as const,
    processDetails: (processId: string | undefined) =>
      ['processDetails', processId] as const,
  },

  // Profiles
  profiles: {
    all: ['profiles'] as const,
  },

  // Drafts
  drafts: {
    stream: (wsUrl: string | undefined) => ['ws-json-patch', wsUrl] as const,
    imagesForDraft: (taskId: string | undefined, idsKey: string) =>
      ['taskImagesForDraft', taskId, idsKey] as const,
  },

  // Misc
  discord: {
    onlineCount: ['discordOnlineCount'] as const,
  },

  // Attempt-specific
  attempt: {
    detail: (attemptId: string | undefined) => ['attempt', attemptId] as const,
  },

  // Mutations (for consistency with query keys)
  mutations: {
    projects: {
      create: ['createProject'] as const,
      update: ['updateProject'] as const,
    },
    devServer: {
      start: (attemptId: string | undefined) =>
        ['startDevServer', attemptId] as const,
      stop: (processId: string | undefined) =>
        ['stopDevServer', processId] as const,
    },
  },
} as const;
