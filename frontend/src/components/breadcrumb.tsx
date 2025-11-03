import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Home, GitBranch, GitMerge } from 'lucide-react';
import { useProject } from '@/contexts/project-context';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useTaskAttempt } from '@/hooks/useTaskAttempt';
import { useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskPanelHeaderActions } from '@/components/panels/TaskPanelHeaderActions';
import { AttemptHeaderActions } from '@/components/panels/AttemptHeaderActions';
import type { LayoutMode } from '@/components/layout/TasksLayout';

export function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId, project } = useProject();
  const { data: projects } = useProjects();
  const { taskId, attemptId } = useParams<{ taskId?: string; attemptId?: string }>();
  const { tasksById } = useProjectTasks(projectId || '');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get attempt data if viewing an attempt
  const effectiveAttemptId = attemptId === 'latest' ? undefined : attemptId;
  const { data: attempt } = useTaskAttempt(effectiveAttemptId);

  // Determine if we're in task view or attempt view
  const isTaskView = !!taskId && !effectiveAttemptId;

  // Get mode from URL params
  const rawMode = searchParams.get('view') as LayoutMode;
  const mode: LayoutMode =
    rawMode === 'preview' || rawMode === 'diffs' ? rawMode : null;

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
      // Start with project name
      crumbs.push({
        label: project.name,
        path: `/projects/${projectId}/tasks`,
        type: 'project',
      });

      // Add parent task if current task has one
      if (taskId && tasksById[taskId]) {
        const currentTask = tasksById[taskId];

        if (currentTask.parent_task_id && tasksById[currentTask.parent_task_id]) {
          const parentTask = tasksById[currentTask.parent_task_id];
          crumbs.push({
            label: parentTask.title,
            path: `/projects/${projectId}/tasks/${parentTask.id}`,
            type: 'parent-task',
          });
        }

        // Add current task
        crumbs.push({
          label: currentTask.title,
          path: `/projects/${projectId}/tasks/${taskId}`,
          type: 'task',
        });
      }

      // Add git branch if viewing an attempt (after task, outside task check)
      if (attempt?.branch) {
        crumbs.push({
          label: attempt.branch,
          path: location.pathname,
          type: 'git-branch',
          icon: <GitBranch className="h-3 w-3" />,
        });
      }

      // Always add base branch if available (not just in task view)
      if (project.default_base_branch) {
        crumbs.push({
          label: project.default_base_branch,
          path: location.pathname,
          type: 'base-branch',
          icon: <GitMerge className="h-3 w-3" />,
        });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Only show breadcrumb if we're in a project context
  if (!projectId || breadcrumbs.length === 0) {
    return null;
  }

  const handleProjectSwitch = (newProjectId: string) => {
    navigate(`/projects/${newProjectId}/tasks`);
  };

  // Get current task for action buttons
  const currentTask = taskId && tasksById[taskId] ? tasksById[taskId] : null;

  return (
    <nav aria-label="Breadcrumb" className="px-3 py-2 text-sm flex items-center justify-between">
      <ol className="flex items-center gap-1">
        {/* Home icon to navigate back to project */}
        <li className="flex items-center gap-1">
          <Link
            to={`/projects/${projectId}/tasks`}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Go to project home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {breadcrumbs.map((crumb, index) => {
          const isCurrentProject = crumb.type === 'project';
          const isLastCrumb = index === breadcrumbs.length - 1;
          const hasIcon = crumb.type === 'git-branch' || crumb.type === 'base-branch';

          return (
            <li key={`${crumb.type}-${crumb.path}-${index}`} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {isCurrentProject ? (
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
              ) : isLastCrumb && hasIcon ? (
                <span className="flex items-center gap-1 text-foreground font-medium">
                  {crumb.icon}
                  {crumb.label}
                </span>
              ) : isLastCrumb ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.path}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.icon}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Action buttons */}
      {currentTask && (
        <div className="flex items-center gap-2">
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
