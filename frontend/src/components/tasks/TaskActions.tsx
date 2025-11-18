import { useCallback, useState } from 'react';
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
  Copy,
  Play,
  Archive,
  GitCompareArrows,
  Eye,
  FileText,
  Trash2,
  Edit,
} from 'lucide-react';
import type { TaskWithAttemptStatus } from 'shared/types';
import { useOpenInEditor } from '@/hooks/useOpenInEditor';
import NiceModal from '@ebay/nice-modal-react';
import { useProject } from '@/contexts/project-context';
import { openTaskForm } from '@/lib/openTaskForm';
import { cn } from '@/lib/utils';

interface TaskActionsProps {
  task: TaskWithAttemptStatus;
  /** Optional attempt ID for attempt-specific actions */
  attemptId?: string | null;
  /** Show quick actions (Play, Archive) outside the menu on hover/always */
  showQuickActions?: boolean;
  /** Always show quick actions (mobile) vs on hover (desktop) */
  alwaysShowQuickActions?: boolean;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Callbacks for view actions */
  onViewDiff?: (task: TaskWithAttemptStatus) => void;
  onViewPreview?: (task: TaskWithAttemptStatus) => void;
  onViewDetails?: (task: TaskWithAttemptStatus) => void;
}

export function TaskActions({
  task,
  attemptId,
  showQuickActions = false,
  alwaysShowQuickActions = false,
  compact = false,
  onViewDiff,
  onViewPreview,
  onViewDetails,
}: TaskActionsProps) {
  const { t } = useTranslation('tasks');
  const { projectId } = useProject();
  const [isHovered, setIsHovered] = useState(false);
  const openInEditor = useOpenInEditor(attemptId || undefined);

  const showQuickActionButtons = showQuickActions && (alwaysShowQuickActions || isHovered);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!projectId) return;
      openTaskForm({ projectId, task });
    },
    [projectId, task]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!projectId) return;
      openTaskForm({ projectId, initialTask: task });
    },
    [projectId, task]
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!projectId) return;
      try {
        await NiceModal.show('delete-task-confirmation', {
          task,
          projectId,
        });
      } catch {
        // User cancelled or error occurred
      }
    },
    [projectId, task]
  );

  const handleOpenInEditor = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!attemptId) return;
      openInEditor();
    },
    [attemptId, openInEditor]
  );

  const handleViewProcesses = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!attemptId) return;
      NiceModal.show('view-processes', { attemptId });
    },
    [attemptId]
  );

  const handleCreateNewAttempt = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      NiceModal.show('create-attempt', {
        taskId: task.id,
        latestAttempt: null,
      });
    },
    [task.id]
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      NiceModal.show('archive-task-confirmation', {
        task,
      });
    },
    [task]
  );

  const handleGitActions = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!attemptId) return;
      NiceModal.show('git-actions', {
        attemptId,
        task,
        projectId,
      });
    },
    [attemptId, task, projectId]
  );

  const handleViewDiff = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewDiff?.(task);
    },
    [task, onViewDiff]
  );

  const handleViewPreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewPreview?.(task);
    },
    [task, onViewPreview]
  );

  const handleViewDetailsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onViewDetails?.(task);
    },
    [task, onViewDetails]
  );

  return (
    <div
      className="flex items-center gap-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quick Action Buttons - Show on hover (desktop) or always (mobile) */}
      {showQuickActionButtons && !task.executor && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            data-testid="task-action-quick-play"
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className={cn(compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0')}
            onClick={handleCreateNewAttempt}
            aria-label="Start new attempt"
          >
            <Play className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
          </Button>
        </div>
      )}

      {showQuickActionButtons && task.status !== 'archived' && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            data-testid="task-action-quick-archive"
            variant="ghost"
            size={compact ? 'sm' : 'default'}
            className={cn(compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0')}
            onClick={handleArchive}
            aria-label="Archive task"
          >
            <Archive className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
          </Button>
        </div>
      )}

      {/* Actions Dropdown Menu */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="task-actions-menu-trigger"
              variant="icon"
              size={compact ? 'sm' : 'default'}
              aria-label="More actions"
              aria-haspopup="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent data-testid="task-actions-menu" align="end">
            {/* View Actions */}
            <DropdownMenuLabel>{t('actionsMenu.view')}</DropdownMenuLabel>
            {onViewDetails && (
              <DropdownMenuItem onClick={handleViewDetailsClick}>
                <FileText className="h-4 w-4 mr-2" />
                {t('actionsMenu.viewDetails')}
              </DropdownMenuItem>
            )}
            {onViewDiff && (
              <DropdownMenuItem onClick={handleViewDiff}>
                <GitCompareArrows className="h-4 w-4 mr-2" />
                {t('actionsMenu.viewDiff')}
              </DropdownMenuItem>
            )}
            {onViewPreview && (
              <DropdownMenuItem onClick={handleViewPreview}>
                <Eye className="h-4 w-4 mr-2" />
                {t('actionsMenu.viewPreview')}
              </DropdownMenuItem>
            )}

            {/* Attempt Actions */}
            {attemptId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('actionsMenu.attempt')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleOpenInEditor}>
                  {t('actionsMenu.openInIde')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewProcesses}>
                  {t('actionsMenu.viewProcesses')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGitActions}>
                  {t('actionsMenu.gitActions')}
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem onClick={handleCreateNewAttempt}>
              <Play className="h-4 w-4 mr-2" />
              {t('actionsMenu.createNewAttempt')}
            </DropdownMenuItem>

            {/* Task Actions */}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('actionsMenu.task')}</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common:buttons.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              {t('actionsMenu.duplicate')}
            </DropdownMenuItem>

            {task.status !== 'archived' && (
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {t('actionsMenu.archive')}
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common:buttons.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
