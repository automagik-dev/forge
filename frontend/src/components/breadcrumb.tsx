import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, GitBranch, GitMerge, ArrowRight, GitCompare } from 'lucide-react';
import { useProject } from '@/contexts/project-context';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTaskAttempt } from '@/hooks/useTaskAttempt';
import { useBranchStatus } from '@/hooks/useBranchStatus';
import { useChangeTargetBranch } from '@/hooks/useChangeTargetBranch';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TaskPanelHeaderActions } from '@/components/panels/TaskPanelHeaderActions';
import { AttemptHeaderActions } from '@/components/panels/AttemptHeaderActions';
import { TaskRelationshipBadges } from '@/components/tasks/TaskRelationshipBadges';
import { showModal } from '@/lib/modals';
import NiceModal from '@ebay/nice-modal-react';
import type { LayoutMode } from '@/components/layout/TasksLayout';
import type { Task, GitBranch as GitBranchType } from 'shared/types';
import { projectsApi } from '@/lib/api';

export function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId, project } = useProject();
  const { data: projects } = useProjects();
  const { taskId, attemptId } = useParams<{ taskId?: string; attemptId?: string }>();
  const { tasksById } = useProjectTasks(projectId || '');
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation('tasks');

  // Get attempt data if viewing an attempt
  const effectiveAttemptId = attemptId === 'latest' ? undefined : attemptId;
  const { data: attempt } = useTaskAttempt(effectiveAttemptId);

  // Get all attempts for history dropdown (currently unused after moving history button)
  // Commented out to avoid lint errors - uncomment if needed in future
  // const { data: attempts = [] } = useTaskAttempts(taskId);

  // Get branch status for git status badges
  const { data: branchStatus } = useBranchStatus(attempt?.id, attempt);

  // Fetch branches for change target branch dialog
  const [branches, setBranches] = useState<GitBranchType[]>([]);

  // Change target branch mutation
  const changeTargetBranchMutation = useChangeTargetBranch(
    attempt?.id || '',
    projectId || ''
  );
  const isChangingTargetBranch = changeTargetBranchMutation.isPending;

  // Fetch branches when attempt is available
  useEffect(() => {
    if (!attempt?.id || !projectId) return;

    projectsApi
      .getBranches(projectId)
      .then(setBranches)
      .catch(() => setBranches([]));
  }, [attempt?.id, projectId]);

  // Calculate conflicts for disabling change target branch button
  const hasConflictsCalculated = useMemo(
    () => Boolean((branchStatus?.conflicted_files?.length ?? 0) > 0),
    [branchStatus?.conflicted_files]
  );

  // Check if attempt is running
  const isAttemptRunning = useMemo(() => {
    if (!taskId || !tasksById[taskId]) return false;
    const task = tasksById[taskId];
    return task.status === 'agent' || task.status === 'inprogress';
  }, [taskId, tasksById]);

  // Get parent task if current task has one (via parent_task_attempt)
  const currentTask = taskId && tasksById[taskId] ? tasksById[taskId] : null;
  const parentTaskAttemptId = currentTask?.parent_task_attempt;

  // Fetch parent task via parent_task_attempt -> task_id
  const { data: parentTask } = useQuery({
    queryKey: ['parent-task-from-attempt', parentTaskAttemptId],
    queryFn: async () => {
      if (!parentTaskAttemptId) return null;

      // First fetch the parent attempt
      const attemptResponse = await fetch(`/api/task-attempts/${parentTaskAttemptId}`);
      if (!attemptResponse.ok) return null;

      const attemptWrapper = await attemptResponse.json();
      const attempt = attemptWrapper.data;
      if (!attempt || !attempt.task_id) return null;

      // Then fetch the task for that attempt
      const taskResponse = await fetch(`/api/tasks/${attempt.task_id}`);
      if (!taskResponse.ok) return null;

      const taskWrapper = await taskResponse.json();
      return taskWrapper.data as Task;
    },
    enabled: !!parentTaskAttemptId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Determine if we're in task view or attempt view
  const isTaskView = !!taskId && !effectiveAttemptId;

  // Get mode from URL params
  const rawMode = searchParams.get('view') as LayoutMode;
  const mode: LayoutMode =
    rawMode === 'preview' || rawMode === 'diffs' || rawMode === 'kanban' || rawMode === 'chat'
      ? rawMode
      : null;

  // Show breadcrumb when viewing project tasks page or task details
  const shouldShowBreadcrumb = !!projectId;

  const setMode = useCallback(
    (newMode: LayoutMode) => {
      const params = new URLSearchParams(searchParams);
      if (newMode === null) {
        params.delete('view');
      } else {
        params.set('view', newMode);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleNavigateToTask = useCallback(
    (taskId: string) => {
      if (!projectId) return;
      const search = searchParams.toString();
      navigate({
        pathname: `/projects/${projectId}/tasks/${taskId}/attempts/latest`,
        search: search ? `?${search}` : '',
      });
    },
    [projectId, navigate, searchParams]
  );

  // Determine breadcrumb items based on route
  const getBreadcrumbs = () => {
    const crumbs: Array<{
      label: string;
      path: string;
      type?: 'project' | 'task' | 'parent-task' | 'git-branch' | 'base-branch';
      icon?: React.ReactNode;
      onClick?: () => void;
    }> = [];

    if (projectId && project) {
      // Always start with project name
      crumbs.push({
        label: project.name,
        path: `/projects/${projectId}/tasks`,
        type: 'project',
      });

      // When viewing an attempt, show: project -> base branch -> worktree -> task
      if (attempt) {
        // Add target/base branch if viewing an attempt (branch origin)
        const targetBranch = attempt?.target_branch;
        if (targetBranch) {
          crumbs.push({
            label: targetBranch,
            path: location.pathname,
            type: 'base-branch',
            icon: <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
          });
        }

        // Add git branch (worktree) if viewing an attempt
        if (attempt?.branch) {
          crumbs.push({
            label: attempt.branch,
            path: location.pathname,
            type: 'git-branch',
            icon: <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />,
          });
        }

        // Add current task
        if (taskId && tasksById[taskId]) {
          crumbs.push({
            label: tasksById[taskId].title,
            path: `/projects/${projectId}/tasks/${taskId}`,
            type: 'task',
          });
        }
      } else {
        // Traditional breadcrumb for non-attempt views: project -> parent task -> task
        // Add parent task if current task has one
        if (parentTask) {
          crumbs.push({
            label: parentTask.title,
            path: `/projects/${projectId}/tasks/${parentTask.id}`,
            type: 'parent-task',
          });
        }

        // Add current task
        if (taskId && tasksById[taskId]) {
          crumbs.push({
            label: tasksById[taskId].title,
            path: `/projects/${projectId}/tasks/${taskId}`,
            type: 'task',
          });
        }
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Only show breadcrumb if we're in a project context and in the right mode
  if (!projectId || breadcrumbs.length === 0 || !shouldShowBreadcrumb) {
    return null;
  }

  const handleProjectSwitch = (newProjectId: string) => {
    navigate(`/projects/${newProjectId}/tasks`);
  };

  // Target branch change handlers
  const handleChangeTargetBranchClick = async (newBranch: string) => {
    await changeTargetBranchMutation
      .mutateAsync(newBranch)
      .catch((error) => {
        console.error(error.message || t('git.errors.changeTargetBranch'));
      });
  };

  const handleChangeTargetBranchDialogOpen = async () => {
    // Ensure branches are loaded before showing dialog
    let branchesToUse = branches;
    if (branchesToUse.length === 0 && projectId) {
      try {
        branchesToUse = await projectsApi.getBranches(projectId);
        setBranches(branchesToUse); // Update state for future use
      } catch (err) {
        // Silently handle error
        branchesToUse = [];
      }
    }

    try {
      const result = await showModal<{
        action: 'confirmed' | 'canceled';
        branchName: string;
      }>('change-target-branch-dialog', {
        branches: branchesToUse,
        isChangingTargetBranch: isChangingTargetBranch,
      });

      if (result.action === 'confirmed' && result.branchName) {
        await handleChangeTargetBranchClick(result.branchName);
      }
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  // Git actions dialog handler
  const handleGitActionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id || !currentTask || !projectId) return;
    NiceModal.show('git-actions', {
      attemptId: attempt.id,
      task: currentTask,
      projectId,
    });
  };

  return (
    <nav aria-label="Breadcrumb" className="px-3 py-2 text-sm flex items-center justify-between">
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((crumb, index) => {
          const isCurrentProject = crumb.type === 'project';
          const isParentTask = crumb.type === 'parent-task';
          const isGitBranch = crumb.type === 'git-branch';
          const isBaseBranch = crumb.type === 'base-branch';
          const isLastCrumb = index === breadcrumbs.length - 1;
          const isFirstItem = index === 0;

          return (
            <li key={`${crumb.type}-${crumb.path}-${index}`} className={`flex items-center gap-1 ${isParentTask ? 'hidden lg:flex' : ''}`}>
              {/* Separator - skip for first item (project) */}
              {!isFirstItem && (
                !isGitBranch ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )
              )}

              {/* Content */}
              {isCurrentProject ? (
                <>
                  {/* Project dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-ring rounded-sm px-1 -mx-1">
                      <span className={isLastCrumb ? 'text-foreground font-medium' : ''}>
                        {crumb.label}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-popover">
                      {projects && projects.length > 0 ? (
                        projects.map((proj) => (
                          <DropdownMenuItem
                            key={proj.id}
                            onClick={() => handleProjectSwitch(proj.id)}
                            className={proj.id === projectId ? 'bg-accent' : ''}
                          >
                            <span className="truncate">{proj.name}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No projects available
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Board link - only show if not on tasks page */}
                  {!isLastCrumb && (
                    <>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <Link
                        to={`/projects/${projectId}/tasks`}
                        className="text-muted-foreground hover:text-foreground transition-colors px-1 -mx-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        aria-label="Go to board view"
                      >
                        Board
                      </Link>
                    </>
                  )}
                </>
              ) : isGitBranch || isBaseBranch ? (
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1.5 max-w-[120px] md:max-w-[180px] lg:max-w-[280px] px-2 py-0.5 rounded-full bg-muted text-xs font-medium min-w-0">
                          {crumb.icon}
                          <span className="truncate">{crumb.label}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <span className="font-mono text-xs">{crumb.label}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {/* Add change target branch button next to base branch */}
                  {isBaseBranch && attempt && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleChangeTargetBranchDialogOpen}
                            disabled={isAttemptRunning || hasConflictsCalculated}
                            className="inline-flex h-5 w-5 p-0 hover:bg-muted"
                            aria-label={t('branches.changeTarget.dialog.title')}
                          >
                            <GitCompare className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {t('branches.changeTarget.dialog.title')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ) : isLastCrumb ? (
                <span className="text-foreground font-medium truncate max-w-[150px] md:max-w-[250px] lg:max-w-none">{crumb.label}</span>
              ) : crumb.type === 'task' ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to={crumb.path}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] md:max-w-[200px]"
                    title={crumb.label}
                  >
                    {crumb.label}
                  </Link>
                  {/* Show children badge inline with task name when it's a task crumb */}
                  {currentTask && attempt && (
                    <TaskRelationshipBadges
                      selectedAttempt={attempt}
                      onNavigateToTask={handleNavigateToTask}
                    />
                  )}
                </div>
              ) : (
                <Link
                  to={crumb.path}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] md:max-w-[200px]"
                  title={crumb.label}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}

      </ol>

      {/* Right side: Git status badges */}
      {currentTask && (
        <div className="flex items-center gap-2">
          {/* Compact git status badges */}
          {branchStatus && attempt && (
            <TooltipProvider>
              <div className="flex items-center gap-1">
                {/* Ahead badge */}
                {(branchStatus.commits_ahead ?? 0) > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleGitActionsClick}
                        className="inline-flex items-center justify-center gap-0.5 h-6 px-1.5 rounded-md bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium cursor-pointer hover:bg-emerald-200/70 dark:hover:bg-emerald-800/40 transition-colors"
                      >
                        <span className="text-[10px]">↑</span>
                        <span className="text-[10px]">{branchStatus.commits_ahead}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      +{branchStatus.commits_ahead ?? 0}{' '}
                      {t('git.status.commits', { count: branchStatus.commits_ahead ?? 0 })}{' '}
                      {t('git.status.ahead')}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Behind badge */}
                {(branchStatus.commits_behind ?? 0) > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleGitActionsClick}
                        className="inline-flex items-center justify-center gap-0.5 h-6 px-1.5 rounded-md bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium cursor-pointer hover:bg-amber-200/60 dark:hover:bg-amber-800/40 transition-colors"
                      >
                        <span className="text-[10px]">↓</span>
                        <span className="text-[10px]">{branchStatus.commits_behind}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {branchStatus.commits_behind ?? 0}{' '}
                      {t('git.status.commits', { count: branchStatus.commits_behind ?? 0 })}{' '}
                      {t('git.status.behind')}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}

          {/* Action buttons */}
          {isTaskView ? (
            <TaskPanelHeaderActions
              task={currentTask}
              onClose={() => navigate(`/projects/${projectId}/tasks`, { replace: true })}
            />
          ) : (
            <AttemptHeaderActions
              mode={mode}
              onModeChange={setMode}
              task={currentTask}
              attempt={attempt ?? null}
              onNavigateToTask={handleNavigateToTask}
              onClose={() => navigate(`/projects/${projectId}/tasks`, { replace: true })}
            />
          )}
        </div>
      )}
    </nav>
  );
}
