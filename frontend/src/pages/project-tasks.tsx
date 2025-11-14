import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Plus, ChevronDown } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { tasksApi } from '@/lib/api';
import type { GitBranch } from 'shared/types';
import { openTaskForm } from '@/lib/openTaskForm';
import { FeatureShowcaseModal } from '@/components/showcase/FeatureShowcaseModal';
import { showcases } from '@/config/showcases';
import { useShowcaseTrigger } from '@/hooks/useShowcaseTrigger';
import { usePostHog } from 'posthog-js/react';
import type { ViewModeSwitchedEvent, ViewModeChangeTrigger, KeyboardContext } from '@/types/analytics';
import { trackKeyboardShortcut, isFirstUse } from '@/lib/track-analytics';

import { useSearch } from '@/contexts/search-context';
import { useProject } from '@/contexts/project-context';
import { useTaskAttempts } from '@/hooks/useTaskAttempts';
import { useTaskAttempt } from '@/hooks/useTaskAttempt';
import { useProjects } from '@/hooks/useProjects';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useBranchStatus, useAttemptExecution } from '@/hooks';
import { projectsApi } from '@/lib/api';
import { paths } from '@/lib/paths';
import { ExecutionProcessesProvider } from '@/contexts/ExecutionProcessesContext';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';
import { ReviewProvider } from '@/contexts/ReviewProvider';
import {
  useKeyCreate,
  useKeyExit,
  useKeyFocusSearch,
  useKeyNavUp,
  useKeyNavDown,
  useKeyNavLeft,
  useKeyNavRight,
  useKeyOpenDetails,
  Scope,
  useKeyDeleteTask,
  useKeyCycleViewBackward,
} from '@/keyboard';

import TaskKanbanBoard from '@/components/tasks/TaskKanbanBoard';
import type { TaskWithAttemptStatus } from 'shared/types';
import type { DragEndEvent } from '@/components/ui/shadcn-io/kanban';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useHotkeysContext } from 'react-hotkeys-hook';
import { TasksLayout, type LayoutMode } from '@/components/layout/TasksLayout';
import { PreviewPanel } from '@/components/panels/PreviewPanel';
import { DiffsPanel } from '@/components/panels/DiffsPanel';
import TaskAttemptPanel from '@/components/panels/TaskAttemptPanel';
import TaskPanel from '@/components/panels/TaskPanel';
import TodoPanel from '@/components/tasks/TodoPanel';
import { NewCard } from '@/components/ui/new-card';
import { ChatPanelActions } from '@/components/panels/ChatPanelActions';
import { TasksListView } from '@/components/mobile/TasksListView';

type Task = TaskWithAttemptStatus;

const TASK_STATUSES = [
  'todo',
  'inprogress',
  'inreview',
  'done',
  'archived',
] as const;

function DiffsPanelContainer({
  attempt,
  selectedTask,
  projectId,
  branchStatus,
  branches,
  setGitError,
}: {
  attempt: any;
  selectedTask: any;
  projectId: string;
  branchStatus: any;
  branches: GitBranch[];
  setGitError: (error: string | null) => void;
}) {
  const { isAttemptRunning } = useAttemptExecution(attempt?.id);

  return (
    <DiffsPanel
      selectedAttempt={attempt}
      gitOps={
        attempt && selectedTask
          ? {
              task: selectedTask,
              projectId,
              branchStatus: branchStatus ?? null,
              branches,
              isAttemptRunning,
              setError: setGitError,
              selectedBranch: branchStatus?.target_branch_name ?? null,
            }
          : undefined
      }
    />
  );
}

export function ProjectTasks() {
  const { t } = useTranslation(['tasks', 'common']);
  const { taskId, attemptId } = useParams<{
    projectId: string;
    taskId?: string;
    attemptId?: string;
  }>();
  const navigate = useNavigate();
  const { enableScope, disableScope, activeScopes } = useHotkeysContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const isXL = useMediaQuery('(min-width: 1280px)');
  const isMobile = !isXL;
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isSmallScreen = useMediaQuery('(max-width: 767px)'); // Same as useIsMobile()
  const isMobilePortrait = (isMobile && !isLandscape) || (isSmallScreen && !isLandscape);
  const posthog = usePostHog();

  const {
    projectId,
    isLoading: projectLoading,
    error: projectError,
  } = useProject();

  const { data: projects } = useProjects();
  const currentProject = projects?.find((p) => p.id === projectId);

  useEffect(() => {
    enableScope(Scope.KANBAN);

    return () => {
      disableScope(Scope.KANBAN);
    };
  }, [enableScope, disableScope]);

  const handleCreateTask = useCallback(() => {
    if (projectId) {
      openTaskForm({ projectId });
    }
  }, [projectId]);
  const { query: searchQuery, focusInput } = useSearch();

  const {
    tasks,
    tasksById,
    isLoading,
    error: streamError,
  } = useProjectTasks(projectId || '');

  const selectedTask = useMemo(
    () => (taskId ? (tasksById[taskId] ?? null) : null),
    [taskId, tasksById]
  );

  // Panel is open if we have a regular task OR an agent task (Master Genie) with attemptId OR in chat view
  const isInChatView = searchParams.get('view') === 'chat';
  const isPanelOpen = Boolean(taskId && (selectedTask || attemptId || isInChatView));

  const { isOpen: showTaskPanelShowcase, close: closeTaskPanelShowcase } =
    useShowcaseTrigger(showcases.taskPanel, {
      enabled: isPanelOpen,
    });

  const isLatest = attemptId === 'latest';
  const { data: attempts = [], isLoading: isAttemptsLoading } = useTaskAttempts(
    taskId,
    {
      enabled: !!taskId && isLatest,
    }
  );

  const latestAttemptId = useMemo(() => {
    if (!attempts?.length) return undefined;
    return [...attempts].sort((a, b) => {
      const diff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    })[0].id;
  }, [attempts]);

  useEffect(() => {
    if (!projectId || !taskId) return;
    if (!isLatest) return;
    if (isAttemptsLoading) return;

    if (!latestAttemptId) {
      navigateWithSearch(paths.task(projectId, taskId), { replace: true });
      return;
    }

    navigateWithSearch(paths.attempt(projectId, taskId, latestAttemptId), {
      replace: true,
    });
  }, [
    projectId,
    taskId,
    isLatest,
    isAttemptsLoading,
    latestAttemptId,
    navigate,
  ]);

  useEffect(() => {
    if (!projectId || !taskId || isLoading) return;
    // Don't redirect if we have an attemptId - agent tasks (Master Genie) won't be in tasksById
    // but we can still show them via their attempts
    // Also don't redirect if in chat view - ChatPanel will create attempt on first message
    if (selectedTask === null && !attemptId && !isInChatView) {
      navigate(`/projects/${projectId}/tasks`, { replace: true });
    }
  }, [projectId, taskId, isLoading, selectedTask, attemptId, isInChatView, navigate]);

  // Close task panel when user starts searching (to show search results in kanban)
  useEffect(() => {
    if (searchQuery.trim() && isPanelOpen && projectId) {
      navigate(`/projects/${projectId}/tasks`, { replace: true });
    }
  }, [searchQuery, isPanelOpen, projectId, navigate]);

  const effectiveAttemptId = attemptId === 'latest' ? undefined : attemptId;
  const isTaskView = !!taskId && !effectiveAttemptId;
  const { data: attempt } = useTaskAttempt(effectiveAttemptId);

  const { data: branchStatus } = useBranchStatus(attempt?.id, attempt);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [gitError, setGitError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    projectsApi
      .getBranches(projectId)
      .then(setBranches)
      .catch(() => setBranches([]));
  }, [projectId]);

  const rawMode = searchParams.get('view') as LayoutMode;
  const mode: LayoutMode =
    rawMode === 'preview' || rawMode === 'diffs' || rawMode === 'kanban' || rawMode === 'chat'
      ? rawMode
      : null;

  // TODO: Remove this redirect after v0.1.0 (legacy URL support for bookmarked links)
  // Migrates old `view=logs` to `view=diffs`
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'logs') {
      const params = new URLSearchParams(searchParams);
      params.set('view', 'diffs');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setMode = useCallback(
    (newMode: LayoutMode, trigger: ViewModeChangeTrigger = 'ui_button') => {
      // Track view mode switch before changing
      const viewModeSwitchedEvent: ViewModeSwitchedEvent = {
        from_mode: mode,
        to_mode: newMode,
        trigger,
        task_selected: Boolean(taskId && selectedTask),
      };
      posthog.capture('view_mode_switched', viewModeSwitchedEvent);
      console.log('[Analytics] view_mode_switched', viewModeSwitchedEvent);

      const params = new URLSearchParams(searchParams);
      if (newMode === null) {
        params.delete('view');
      } else {
        params.set('view', newMode);
      }
      setSearchParams(params, { replace: true });
    },
    [mode, taskId, selectedTask, posthog, searchParams, setSearchParams]
  );

  const navigateWithSearch = useCallback(
    (pathname: string, options?: { replace?: boolean }) => {
      const search = searchParams.toString();
      navigate({ pathname, search: search ? `?${search}` : '' }, options);
    },
    [navigate, searchParams]
  );

  const handleCreateNewTask = useCallback(() => {
    trackKeyboardShortcut({
      shortcut: 'create_task',
      context: 'task_list',
      is_first_use: isFirstUse('shortcut_create_task'),
    });
    handleCreateTask();
  }, [handleCreateTask]);

  useKeyCreate(handleCreateNewTask, {
    scope: Scope.KANBAN,
    preventDefault: true,
  });

  useKeyFocusSearch(
    () => {
      focusInput();
    },
    {
      scope: Scope.KANBAN,
      preventDefault: true,
    }
  );

  useKeyExit(
    () => {
      if (isPanelOpen) {
        handleClosePanel();
      } else {
        navigate('/projects');
      }
    },
    { scope: Scope.KANBAN }
  );

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

  const groupedFilteredTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    TASK_STATUSES.forEach((status) => {
      groups[status] = [];
    });
    filteredTasks.forEach((task) => {
      const normalizedStatus = task.status.toLowerCase();
      if (groups[normalizedStatus]) {
        groups[normalizedStatus].push(task);
      } else {
        groups['todo'].push(task);
      }
    });
    return groups;
  }, [filteredTasks]);

  useKeyNavUp(
    () => {
      selectPreviousTask();
    },
    {
      scope: Scope.KANBAN,
      preventDefault: true,
    }
  );

  useKeyNavDown(
    () => {
      selectNextTask();
    },
    {
      scope: Scope.KANBAN,
      preventDefault: true,
    }
  );

  useKeyNavLeft(
    () => {
      selectPreviousColumn();
    },
    {
      scope: Scope.KANBAN,
      preventDefault: true,
    }
  );

  useKeyNavRight(
    () => {
      selectNextColumn();
    },
    {
      scope: Scope.KANBAN,
      preventDefault: true,
    }
  );

  /**
   * Cycle the attempt area view.
   * - When panel is closed: opens task details (if a task is selected)
   * - When panel is open: cycles among [kanban, preview, diffs, chat]
   */
  const cycleView = useCallback(
    (direction: 'forward' | 'backward' = 'forward') => {
      const order: LayoutMode[] = ['kanban', 'preview', 'diffs', 'chat'];
      const idx = order.indexOf(mode ?? 'kanban');
      const next =
        direction === 'forward'
          ? order[(idx + 1) % order.length]
          : order[(idx - 1 + order.length) % order.length];
      setMode(next, 'keyboard_shortcut');
    },
    [mode, setMode]
  );

  const cycleViewForward = useCallback(() => cycleView('forward'), [cycleView]);
  const cycleViewBackward = useCallback(
    () => cycleView('backward'),
    [cycleView]
  );

  // meta/ctrl+enter → open details or cycle forward
  const isFollowUpReadyActive = activeScopes.includes(Scope.FOLLOW_UP_READY);

  useKeyOpenDetails(
    () => {
      if (isPanelOpen) {
        trackKeyboardShortcut({
          shortcut: 'cycle_view',
          context: mode as KeyboardContext || 'task_list',
          is_first_use: isFirstUse('shortcut_cycle_view'),
        });
        cycleViewForward();
      } else if (selectedTask) {
        trackKeyboardShortcut({
          shortcut: 'open_details',
          context: 'task_list',
          is_first_use: isFirstUse('shortcut_open_details'),
        });
        handleViewTaskDetails(selectedTask);
      }
    },
    { scope: Scope.KANBAN, when: () => !isFollowUpReadyActive }
  );

  // meta/ctrl+shift+enter → cycle backward
  useKeyCycleViewBackward(
    () => {
      if (isPanelOpen) {
        trackKeyboardShortcut({
          shortcut: 'cycle_view',
          context: mode as KeyboardContext || 'task_list',
          is_first_use: isFirstUse('shortcut_cycle_view_backward'),
        });
        cycleViewBackward();
      }
    },
    { scope: Scope.KANBAN, preventDefault: true }
  );

  useKeyDeleteTask(
    () => {
      // Note: Delete is now handled by TaskActionsDropdown
      // This keyboard shortcut could trigger the dropdown action if needed
    },
    {
      scope: Scope.KANBAN,
      preventDefault: true,
    }
  );

  const handleClosePanel = useCallback(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/tasks`, { replace: true });
    }
  }, [projectId, navigate]);

  const handleViewTaskDetails = useCallback(
    (task: Task, attemptIdToShow?: string) => {
      // Always open tasks in chat view (don't preserve kanban/list view params)
      const pathname = attemptIdToShow
        ? paths.attempt(projectId!, task.id, attemptIdToShow)
        : `${paths.task(projectId!, task.id)}/attempts/latest`;
      navigate({ pathname, search: '?view=chat' });
    },
    [projectId, navigate]
  );

  const handleNavigateToTask = useCallback(
    (taskId: string) => {
      if (!projectId) return;
      navigateWithSearch(`${paths.task(projectId, taskId)}/attempts/latest`);
    },
    [projectId, navigateWithSearch]
  );

  const selectNextTask = useCallback(() => {
    if (selectedTask) {
      const tasksInStatus = groupedFilteredTasks[selectedTask.status] || [];
      const currentIndex = tasksInStatus.findIndex(
        (task) => task.id === selectedTask.id
      );
      if (currentIndex >= 0 && currentIndex < tasksInStatus.length - 1) {
        handleViewTaskDetails(tasksInStatus[currentIndex + 1]);
      }
    } else {
      for (const status of TASK_STATUSES) {
        const tasks = groupedFilteredTasks[status];
        if (tasks && tasks.length > 0) {
          handleViewTaskDetails(tasks[0]);
          break;
        }
      }
    }
  }, [selectedTask, groupedFilteredTasks, handleViewTaskDetails]);

  const selectPreviousTask = useCallback(() => {
    if (selectedTask) {
      const tasksInStatus = groupedFilteredTasks[selectedTask.status] || [];
      const currentIndex = tasksInStatus.findIndex(
        (task) => task.id === selectedTask.id
      );
      if (currentIndex > 0) {
        handleViewTaskDetails(tasksInStatus[currentIndex - 1]);
      }
    } else {
      for (const status of TASK_STATUSES) {
        const tasks = groupedFilteredTasks[status];
        if (tasks && tasks.length > 0) {
          handleViewTaskDetails(tasks[0]);
          break;
        }
      }
    }
  }, [selectedTask, groupedFilteredTasks, handleViewTaskDetails]);

  const selectNextColumn = useCallback(() => {
    if (selectedTask) {
      const currentIndex = TASK_STATUSES.findIndex(
        (status) => status === selectedTask.status
      );
      for (let i = currentIndex + 1; i < TASK_STATUSES.length; i++) {
        const tasks = groupedFilteredTasks[TASK_STATUSES[i]];
        if (tasks && tasks.length > 0) {
          handleViewTaskDetails(tasks[0]);
          return;
        }
      }
    } else {
      for (const status of TASK_STATUSES) {
        const tasks = groupedFilteredTasks[status];
        if (tasks && tasks.length > 0) {
          handleViewTaskDetails(tasks[0]);
          break;
        }
      }
    }
  }, [selectedTask, groupedFilteredTasks, handleViewTaskDetails]);

  const selectPreviousColumn = useCallback(() => {
    if (selectedTask) {
      const currentIndex = TASK_STATUSES.findIndex(
        (status) => status === selectedTask.status
      );
      for (let i = currentIndex - 1; i >= 0; i--) {
        const tasks = groupedFilteredTasks[TASK_STATUSES[i]];
        if (tasks && tasks.length > 0) {
          handleViewTaskDetails(tasks[0]);
          return;
        }
      }
    } else {
      for (const status of TASK_STATUSES) {
        const tasks = groupedFilteredTasks[status];
        if (tasks && tasks.length > 0) {
          handleViewTaskDetails(tasks[0]);
          break;
        }
      }
    }
  }, [selectedTask, groupedFilteredTasks, handleViewTaskDetails]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active.data.current) return;

      const draggedTaskId = active.id as string;
      const newStatus = over.id as Task['status'];
      const task = tasksById[draggedTaskId];
      if (!task || task.status === newStatus) return;

      // Track kanban drag event
      const fromStatus = task.status;
      const fromColumn = groupedFilteredTasks[fromStatus] || [];
      const toColumn = groupedFilteredTasks[newStatus] || [];

      posthog.capture('kanban_task_dragged', {
        from_status: fromStatus,
        to_status: newStatus,
        tasks_in_source_column: fromColumn.length,
        tasks_in_target_column: toColumn.length,
      });
      console.log('[Analytics] kanban_task_dragged', { from_status: fromStatus, to_status: newStatus });

      try {
        await tasksApi.update(draggedTaskId, {
          title: task.title,
          description: task.description,
          status: newStatus,
          parent_task_attempt: task.parent_task_attempt,
          image_ids: null,
        });
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    },
    [tasksById, groupedFilteredTasks, posthog]
  );

  // Action handlers for mobile task list view
  const handleViewDiff = useCallback(
    (task: Task) => {
      const pathname = `${paths.task(projectId!, task.id)}/attempts/latest`;
      navigate({ pathname, search: '?view=diffs' });
    },
    [projectId, navigate]
  );

  const handleViewPreview = useCallback(
    (task: Task) => {
      const pathname = `${paths.task(projectId!, task.id)}/attempts/latest`;
      navigate({ pathname, search: '?view=preview' });
    },
    [projectId, navigate]
  );

  const isInitialTasksLoad = isLoading && tasks.length === 0;

  if (projectError) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle size="16" />
            {t('common:states.error')}
          </AlertTitle>
          <AlertDescription>
            {projectError.message || 'Failed to load project'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (projectLoading && isInitialTasksLoad) {
    return <Loader message={t('loading')} size={32} className="py-8" />;
  }

  const kanbanContent =
    tasks.length === 0 ? (
      <div className="max-w-7xl mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">{t('empty.noTasks')}</p>
            <Button className="mt-4" onClick={handleCreateNewTask}>
              <Plus className="h-4 w-4 mr-2" />
              {t('empty.createFirst')}
            </Button>
          </CardContent>
        </Card>
      </div>
    ) : filteredTasks.length === 0 ? (
      <div className="max-w-7xl mx-auto mt-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {t('empty.noSearchResults')}
            </p>
          </CardContent>
        </Card>
      </div>
    ) : isMobilePortrait && mode !== 'kanban' ? (
      <div className="w-full h-full overflow-y-auto mobile-scroll">
        <TasksListView
          tasks={filteredTasks}
          onTaskClick={handleViewTaskDetails}
          selectedTaskId={selectedTask?.id}
          projectName={currentProject?.name}
          onProjectClick={() => navigate('/projects')}
          onViewDiff={handleViewDiff}
          onViewPreview={handleViewPreview}
          branches={branches}
        />
      </div>
    ) : (
      <div className="w-full h-full flex flex-col">
        {/* Mobile header for kanban view */}
        {isMobilePortrait && currentProject && (
          <button
            onClick={() => navigate('/projects')}
            className="sticky top-0 z-20 px-4 py-3 bg-[#1A1625]/95 backdrop-blur-sm border-b border-white/10 hover:bg-white/5 transition-colors"
          >
            <div className="flex flex-col gap-2">
              {/* Top row: project name and task count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-muted-foreground rotate-90" />
                  <span className="font-primary text-sm font-semibold text-foreground">
                    {currentProject.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              {/* Bottom row: git branch info */}
              {branches.length > 0 && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentBranch = branches.find((b) => b.is_current);
                    if (!currentBranch) return null;

                    return (
                      <div className="flex items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-secondary/70 text-secondary-foreground text-xs">
                          <span className="text-[10px]">⎇</span>
                          <span>{currentBranch.name}</span>
                        </div>
                        {/* TODO: Add commits ahead/behind badges when main workspace branch status API is available */}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </button>
        )}
        <div className="flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain touch-pan-y">
          <TaskKanbanBoard
            groupedTasks={groupedFilteredTasks}
            onDragEnd={handleDragEnd}
            onViewTaskDetails={handleViewTaskDetails}
            selectedTask={selectedTask || undefined}
            onCreateTask={handleCreateNewTask}
          />
        </div>
      </div>
    );

  // Mobile chat header - shows task name and back navigation
  const rightHeader = isMobilePortrait && mode === 'chat' && selectedTask ? (
    <button
      onClick={() => navigate({ pathname: location.pathname, search: '?view=kanban' })}
      className="w-full px-4 py-3 bg-[#1A1625]/95 backdrop-blur-sm hover:bg-white/5 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        <ChevronDown className="w-4 h-4 text-muted-foreground rotate-90" />
        <div className="flex-1 min-w-0">
          <div className="font-primary text-sm font-semibold text-foreground truncate">
            {selectedTask.title}
          </div>
          <div className="text-xs text-muted-foreground">
            Tap to return to board
          </div>
        </div>
      </div>
    </button>
  ) : null;

  // Allow rendering attempt content for agent tasks (Master Genie) where selectedTask is null
  // but we have an attempt to show, OR when in chat view (ChatPanel creates attempt on first message)
  const attemptContent = selectedTask || (attempt && attemptId) || isInChatView ? (
    <NewCard className="h-full min-h-0 flex flex-col bg-diagonal-lines bg-muted border-0 relative">
      {isTaskView && selectedTask ? (
        <TaskPanel task={selectedTask} />
      ) : (
        <TaskAttemptPanel
          key={attempt?.id}
          attempt={attempt}
          task={selectedTask}
          tasksById={tasksById}
          onNavigateToTask={handleNavigateToTask}
          isInChatView={isInChatView}
          taskIdFromUrl={taskId}
          projectId={projectId}
        >
          {({ logs, followUp }) => (
            <>
              <ChatPanelActions attempt={attempt} task={selectedTask} />
              {gitError && (
                <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-destructive text-sm">{gitError}</div>
                </div>
              )}
              <div className="flex-1 min-h-0 flex flex-col">{logs}</div>

              <div className="shrink-0 border-t">
                <div className="mx-auto w-full max-w-[50rem]">
                  <TodoPanel />
                </div>
              </div>

              <div className="shrink-0 border-t">
                <div className="mx-auto w-full max-w-[50rem]">{followUp}</div>
              </div>
            </>
          )}
        </TaskAttemptPanel>
      )}
    </NewCard>
  ) : null;

  const auxContent = (
    <div className="relative h-full w-full">
      {mode === 'preview' && attempt && selectedTask && <PreviewPanel />}
      {mode === 'diffs' && attempt && selectedTask && (
        <DiffsPanelContainer
          attempt={attempt}
          selectedTask={selectedTask}
          projectId={projectId!}
          branchStatus={branchStatus}
          branches={branches}
          setGitError={setGitError}
        />
      )}
    </div>
  );

  const attemptArea = attempt ? (
    <ClickedElementsProvider attempt={attempt}>
      <ReviewProvider key={attempt.id}>
        <ExecutionProcessesProvider key={attempt.id} attemptId={attempt.id}>
          <TasksLayout
            kanban={kanbanContent}
            attempt={attemptContent}
            aux={auxContent}
            isPanelOpen={isPanelOpen}
            mode={mode}
            isMobile={isMobilePortrait}
            rightHeader={rightHeader}
            onKanbanClick={handleClosePanel}
          />
        </ExecutionProcessesProvider>
      </ReviewProvider>
    </ClickedElementsProvider>
  ) : isInChatView ? (
    // Chat view (Master Genie or task chat)
    // Use taskId from URL if available, otherwise use a placeholder for Master Genie
    // ClickedElementsProvider accepts null attempt (used for preview click tracking)
    <ClickedElementsProvider attempt={null}>
      <ReviewProvider key={taskId || 'chat'}>
        <ExecutionProcessesProvider key={taskId || 'chat'} attemptId={taskId || 'master-genie'}>
          <TasksLayout
            kanban={kanbanContent}
            attempt={attemptContent}
            aux={auxContent}
            isPanelOpen={isPanelOpen}
            mode={mode}
            isMobile={isMobilePortrait}
            rightHeader={rightHeader}
            onKanbanClick={handleClosePanel}
          />
        </ExecutionProcessesProvider>
      </ReviewProvider>
    </ClickedElementsProvider>
  ) : isPanelOpen && taskId ? (
    // Task is selected but no attempt yet (e.g., task details view)
    // Still need ExecutionProcessesProvider because TaskAttemptPanel contains RetryUiProvider
    <ClickedElementsProvider attempt={null}>
      <ReviewProvider key={taskId}>
        <ExecutionProcessesProvider key={taskId} attemptId={taskId}>
          <TasksLayout
            kanban={kanbanContent}
            attempt={attemptContent}
            aux={auxContent}
            isPanelOpen={isPanelOpen}
            mode={mode}
            isMobile={isMobile}
            rightHeader={rightHeader}
            onKanbanClick={handleClosePanel}
          />
        </ExecutionProcessesProvider>
      </ReviewProvider>
    </ClickedElementsProvider>
  ) : (
    <TasksLayout
      kanban={kanbanContent}
      attempt={attemptContent}
      aux={auxContent}
      isPanelOpen={isPanelOpen}
      mode={mode}
      isMobile={isMobile}
      rightHeader={rightHeader}
      onKanbanClick={handleClosePanel}
    />
  );

  return (
    <div className="min-h-full h-full flex flex-col">
      {streamError && (
        <Alert className="w-full z-30 xl:sticky xl:top-0">
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle size="16" />
            {t('common:states.reconnecting')}
          </AlertTitle>
          <AlertDescription>{streamError}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0">{attemptArea}</div>
      <FeatureShowcaseModal
        isOpen={showTaskPanelShowcase}
        onClose={closeTaskPanelShowcase}
        config={showcases.taskPanel}
      />
    </div>
  );
}
