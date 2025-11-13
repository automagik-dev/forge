import { useTranslation } from 'react-i18next';
import { useProject } from '@/contexts/project-context';
import { useTaskAttempts } from '@/hooks/useTaskAttempts';
import { useNavigateWithSearch } from '@/hooks';
import { paths } from '@/lib/paths';
import type { TaskWithAttemptStatus, Task } from 'shared/types';
import { NewCardContent } from '../ui/new-card';
import { Button } from '../ui/button';
import { PlusIcon, Edit2, Network, GitFork, Play } from 'lucide-react';
import NiceModal from '@ebay/nice-modal-react';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { attemptsApi, tasksApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { FileSearchTextarea } from '../ui/file-search-textarea';
import { useTaskMutations } from '@/hooks/useTaskMutations';

interface TaskPanelProps {
  task: TaskWithAttemptStatus | null;
}

const TaskPanel = ({ task }: TaskPanelProps) => {
  const { t } = useTranslation('tasks');
  const navigate = useNavigateWithSearch();
  const { projectId } = useProject();
  const { updateTask } = useTaskMutations(projectId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [childrenTasks, setChildrenTasks] = useState<Task[]>([]);

  const {
    data: attempts = [],
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
  } = useTaskAttempts(task?.id);

  // Fetch parent task relationship
  useEffect(() => {
    if (!task) {
      setParentTask(null);
      return;
    }

    // Fetch parent task if exists
    if (task.parent_task_attempt) {
      attemptsApi
        .get(task.parent_task_attempt)
        .then((attempt) => tasksApi.getById(attempt.task_id))
        .then((parentTask) => setParentTask(parentTask))
        .catch(() => setParentTask(null));
    } else {
      setParentTask(null);
    }
  }, [task]);

  // Fetch children tasks (subtasks) - separate effect to wait for attempts to load
  useEffect(() => {
    if (!task) {
      setChildrenTasks([]);
      return;
    }

    // Fetch children tasks (subtasks)
    const latestAttempt = attempts[0];
    if (latestAttempt) {
      attemptsApi
        .getChildren(latestAttempt.id)
        .then((relationships) => setChildrenTasks(relationships.children))
        .catch(() => setChildrenTasks([]));
    } else {
      setChildrenTasks([]);
    }
  }, [task, attempts]);

  // Initialize edit state when task changes
  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
    }
  }, [task]);

  const formatTimeAgo = (iso: string) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const absSec = Math.round(Math.abs(diffMs) / 1000);

    const rtf =
      typeof Intl !== 'undefined' && (Intl as any).RelativeTimeFormat
        ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
        : null;

    const to = (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      rtf
        ? rtf.format(-value, unit)
        : `${value} ${unit}${value !== 1 ? 's' : ''} ago`;

    if (absSec < 60) return to(Math.round(absSec), 'second');
    const mins = Math.round(absSec / 60);
    if (mins < 60) return to(mins, 'minute');
    const hours = Math.round(mins / 60);
    if (hours < 24) return to(hours, 'hour');
    const days = Math.round(hours / 24);
    if (days < 30) return to(days, 'day');
    const months = Math.round(days / 30);
    if (months < 12) return to(months, 'month');
    const years = Math.round(months / 12);
    return to(years, 'year');
  };

  const displayedAttempts = [...attempts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const latestAttempt = displayedAttempts[0] ?? null;

  const handleSaveTitle = async () => {
    if (!task || !projectId) return;

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: {
          title: editTitle,
          description: task.description,
          status: task.status,
          parent_task_attempt: task.parent_task_attempt,
          image_ids: null, // null = don't modify images (backend keeps existing)
        },
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update task title:', error);
    }
  };

  const handleSaveDescription = async () => {
    if (!task || !projectId) return;

    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: {
          title: task.title,
          description: editDescription,
          status: task.status,
          parent_task_attempt: task.parent_task_attempt,
          image_ids: null, // null = don't modify images (backend keeps existing)
        },
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update task description:', error);
    }
  };

  const handleCancelEdit = (type: 'title' | 'description') => {
    if (type === 'title') {
      setEditTitle(task?.title || '');
      setIsEditingTitle(false);
    } else {
      setEditDescription(task?.description || '');
      setIsEditingDescription(false);
    }
  };

  if (!task) {
    return (
      <div className="text-muted-foreground">
        {t('taskPanel.noTaskSelected')}
      </div>
    );
  }

  return (
    <>
      <NewCardContent>
        <div className="p-6 flex flex-col h-full max-h-[calc(100vh-8rem)]">
          <div className="space-y-3 overflow-y-auto flex-shrink min-h-0">
            {/* Editable Title */}
            <div className="group relative">
              {isEditingTitle ? (
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTitle();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit('title');
                      }
                    }}
                    autoFocus
                    className="text-2xl font-bold"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveTitle}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelEdit('title')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <MarkdownRenderer content={`# ${task.title || 'Task'}`} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Editable Description */}
            <div className="group relative">
              {isEditingDescription ? (
                <div className="space-y-2">
                  <FileSearchTextarea
                    value={editDescription}
                    onChange={setEditDescription}
                    rows={5}
                    maxRows={15}
                    projectId={projectId}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelEdit('description')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  {task.description && (
                    <MarkdownRenderer content={task.description} />
                  )}
                  {!task.description && (
                    <p className="text-muted-foreground italic">
                      No description
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Parent/Children Task Relationships */}
          {(parentTask || childrenTasks.length > 0) && (
            <div className="mt-6 flex-shrink-0">
              <table className="w-full text-sm">
                <thead className="uppercase text-muted-foreground">
                  <tr>
                    <th colSpan={2}>
                      <div className="w-full flex text-left">
                        <span className="flex-1">
                          {parentTask ? 'Related Tasks' : `Subtasks (${childrenTasks.length})`}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parentTask && (
                    <tr
                      className="border-t cursor-pointer hover:bg-muted"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (projectId && parentTask.id) {
                          navigate(paths.task(projectId, parentTask.id));
                        }
                      }}
                    >
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 shrink-0" />
                          <span>{parentTask.title}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-0 text-right">
                        {formatTimeAgo(parentTask.created_at)}
                      </td>
                    </tr>
                  )}
                  {childrenTasks.map((child) => (
                    <tr
                      key={child.id}
                      className="border-t cursor-pointer hover:bg-muted"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (projectId && child.id) {
                          navigate(paths.task(projectId, child.id));
                        }
                      }}
                    >
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <GitFork className="h-4 w-4 shrink-0" />
                          <span>{child.title}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-0 text-right">
                        {formatTimeAgo(child.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex-shrink-0">
            {isAttemptsLoading && (
              <div className="text-muted-foreground">
                {t('taskPanel.loadingAttempts')}
              </div>
            )}
            {isAttemptsError && (
              <div className="text-destructive">
                {t('taskPanel.errorLoadingAttempts')}
              </div>
            )}
            {!isAttemptsLoading && !isAttemptsError && (
              <table className="w-full text-sm">
                <thead className="uppercase text-muted-foreground">
                  <tr>
                    <th colSpan={3}>
                      <div className="w-full flex text-left">
                        <span className="flex-1">
                          {t('taskPanel.attemptsCount', {
                            count: displayedAttempts.length,
                          })}
                        </span>
                        <span>
                          <Button
                            variant="icon"
                            onClick={() =>
                              NiceModal.show('create-attempt', {
                                taskId: task.id,
                                latestAttempt,
                              })
                            }
                            aria-label={t('taskPanel.startNewAttempt')}
                            title={t('taskPanel.startNewAttempt')}
                          >
                            <Play size={16} />
                          </Button>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAttempts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-2 text-muted-foreground border-t"
                      >
                        {t('taskPanel.noAttempts')}
                      </td>
                    </tr>
                  ) : (
                    displayedAttempts.map((attempt) => (
                      <tr
                        key={attempt.id}
                        className="border-t cursor-pointer hover:bg-muted"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (projectId && task.id && attempt.id) {
                            navigate(
                              paths.attempt(projectId, task.id, attempt.id)
                            );
                          }
                        }}
                      >
                        <td className="py-2 pr-4 font-mono text-xs">
                          {attempt.executor || 'Base Agent'}
                        </td>
                        <td className="py-2 pr-4">{attempt.branch || '—'}</td>
                        <td className="py-2 pr-0 text-right">
                          {formatTimeAgo(attempt.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </NewCardContent>
    </>
  );
};

export default TaskPanel;
