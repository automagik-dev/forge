import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Maximize2,
  Copy,
  GitBranch,
  Archive,
  Tag,
  Clock,
} from 'lucide-react';
import type { TaskWithAttemptStatus, TaskAttempt } from 'shared/types';
import { useOpenInEditor } from '@/hooks/useOpenInEditor';
import NiceModal from '@ebay/nice-modal-react';
import { useProject } from '@/contexts/project-context';
import { openTaskForm } from '@/lib/openTaskForm';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/lib/paths';

interface ActionsDropdownProps {
  task?: TaskWithAttemptStatus | null;
  attempt?: TaskAttempt | null;
}

export function ActionsDropdown({ task, attempt }: ActionsDropdownProps) {
  const { t } = useTranslation('tasks');
  const { projectId } = useProject();
  const navigate = useNavigate();
  const openInEditor = useOpenInEditor(attempt?.id);

  const hasAttemptActions = Boolean(attempt);
  const hasTaskActions = Boolean(task);

  const handleEdit = () => {
    if (!projectId || !task) return;
    openTaskForm({ projectId, task });
  };

  const handleDuplicate = () => {
    if (!projectId || !task) return;
    openTaskForm({ projectId, initialTask: task });
  };

  const handleDelete = async () => {
    if (!projectId || !task) return;
    try {
      await NiceModal.show('delete-task-confirmation', {
        task,
        projectId,
      });
    } catch {
      // User cancelled or error occurred
    }
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task || !projectId) return;

    // Navigate to task details with latest attempt
    navigate(`${paths.task(projectId, task.id)}/attempts/latest`);
  };

  const handleOpenInEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    openInEditor();
  };

  const handleViewProcesses = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;
    NiceModal.show('view-processes', { attemptId: attempt.id });
  };

  const handleCreateNewAttempt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task?.id) return;
    NiceModal.show('create-attempt', {
      taskId: task.id,
      latestAttempt: null,
    });
  };

  const handleCreateSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !attempt) return;
    openTaskForm({
      projectId,
      parentTaskAttemptId: attempt.id,
      initialBaseBranch: attempt.branch || attempt.target_branch,
    });
  };

  const handleViewBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.branch) return;
    // TODO: Implement branch view functionality
    console.log('View branch:', attempt.branch);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task || !projectId) return;
    // TODO: Implement archive functionality
    console.log('Archive task:', task.id);
  };

  const handleAddLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task) return;
    // TODO: Implement add label functionality
    console.log('Add label to task:', task.id);
  };

  const handleViewHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task) return;
    // TODO: Implement view history functionality
    console.log('View history for task:', task.id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="icon"
            aria-label="Actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Quick Actions Section */}
          {hasTaskActions && (
            <>
              <DropdownMenuLabel>{t('actionsMenu.quickActions', 'Quick Actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleMaximize}>
                <Maximize2 className="h-4 w-4 mr-2" />
                {t('actionsMenu.maximize', 'Maximize')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Attempt Actions Section */}
          {hasAttemptActions && (
            <>
              <DropdownMenuLabel>{t('actionsMenu.attempt')}</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={!attempt?.id}
                onClick={handleOpenInEditor}
              >
                {t('actionsMenu.openInIde')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!attempt?.id}
                onClick={handleViewProcesses}
              >
                {t('actionsMenu.viewProcesses')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateNewAttempt}>
                {t('actionsMenu.createNewAttempt')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!projectId || !attempt}
                onClick={handleCreateSubtask}
              >
                {t('actionsMenu.createSubtask')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!attempt?.branch}
                onClick={handleViewBranch}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                {t('actionsMenu.viewBranch', 'View Branch')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Task Actions Section */}
          {hasTaskActions && (
            <>
              <DropdownMenuLabel>{t('actionsMenu.task')}</DropdownMenuLabel>
              <DropdownMenuItem disabled={!projectId} onClick={handleEdit}>
                {t('common:buttons.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!projectId} onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                {t('actionsMenu.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!task}
                onClick={handleAddLabel}
              >
                <Tag className="h-4 w-4 mr-2" />
                {t('actionsMenu.addLabel', 'Add Label')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!task}
                onClick={handleViewHistory}
              >
                <Clock className="h-4 w-4 mr-2" />
                {t('actionsMenu.viewHistory', 'View History')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!task}
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4 mr-2" />
                {t('actionsMenu.archive', 'Archive')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!projectId}
                onClick={handleDelete}
                className="text-destructive"
              >
                {t('common:buttons.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
