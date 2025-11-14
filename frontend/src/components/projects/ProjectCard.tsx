import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Calendar,
  Edit,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Project, TaskWithAttemptStatus } from 'shared/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';
import { useNavigateWithSearch } from '@/hooks';
import { projectsApi, tasksApi } from '@/lib/api';
import { formatRelativeTime, getLastActivityDate } from '@/lib/date-utils';

type Props = {
  project: Project;
  isFocused: boolean;
  fetchProjects: () => void;
  setError: (error: string) => void;
  onEdit: (project: Project) => void;
};

function ProjectCard({
  project,
  isFocused,
  fetchProjects,
  setError,
  onEdit,
}: Props) {
  const { t } = useTranslation('projects');
  const navigate = useNavigateWithSearch();
  const ref = useRef<HTMLDivElement>(null);
  const handleOpenInEditor = useOpenProjectInEditor(project);
  const [tasks, setTasks] = useState<TaskWithAttemptStatus[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      ref.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const projectTasks = await tasksApi.getAll(project.id);
        setTasks(projectTasks);
      } catch (error) {
        console.error('Failed to fetch tasks for project:', error);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [project.id]);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(t('card.deleteConfirm', { name }))
    )
      return;

    try {
      await projectsApi.delete(id);
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      setError(t('errors.deleteFailed'));
    }
  };

  const handleEdit = (project: Project) => {
    onEdit(project);
  };

  const handleOpenInIDE = () => {
    handleOpenInEditor();
  };

  // Calculate task stats
  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'inprogress' || t.has_in_progress_attempt).length,
    hasActivity: tasks.some((t) => t.has_in_progress_attempt),
    hasMerged: tasks.some((t) => t.has_merged_attempt),
    hasFailed: tasks.some((t) => t.last_attempt_failed),
  };

  const handleProjectClick = () => {
    // Navigate to tasks page, let ProjectTasks component decide the default view
    navigate(`/projects/${project.id}/tasks`);
  };

  return (
    <Card
      className={`hover:shadow-md transition-shadow cursor-pointer focus:ring-2 focus:ring-primary outline-none border`}
      onClick={handleProjectClick}
      tabIndex={isFocused ? 0 : -1}
      ref={ref}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-medium">{project.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Active badge when tasks are running */}
            {!tasksLoading && taskStats.hasActivity && (
              <Badge variant="default" className="text-xs px-2 py-0.5 h-auto">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                {t('card.active')}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('card.menu.viewProject')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenInIDE();
                  }}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {t('card.menu.openInIDE')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('card.menu.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id, project.name);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('card.menu.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="flex flex-col gap-1 text-xs mt-1.5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              {/* Last Activity - Show if tasks exist */}
              {!tasksLoading && taskStats.total > 0 && (() => {
                const lastActivity = getLastActivityDate(tasks);
                return lastActivity ? (
                  <span className="flex items-center text-muted-foreground">
                    <Calendar className="mr-1.5 h-3 w-3" />
                    {t('card.lastActive', { time: formatRelativeTime(lastActivity) })}
                  </span>
                ) : null;
              })()}
              {/* Created Date */}
              <span className="flex items-center text-muted-foreground">
                <Calendar className="mr-1.5 h-3 w-3" />
                {t('card.createdAgo', { time: formatRelativeTime(project.created_at) })}
              </span>
            </div>
            {!tasksLoading && taskStats.total > 0 && (
              <span className="text-muted-foreground font-normal">
                {taskStats.total} {taskStats.total === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default ProjectCard;
