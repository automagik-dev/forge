import { useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Archive, Eye, EyeOff } from 'lucide-react';
import { useProject } from '@/contexts/project-context';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useBetaFeatures } from '@/contexts/beta-features-context';

export function ArchiveButton() {
  const { t } = useTranslation('tasks');
  const { projectId } = useProject();
  const { taskId } = useParams<{ taskId?: string }>();
  const { tasks } = useProjectTasks(projectId || '');
  const [searchParams, setSearchParams] = useSearchParams();

  // Beta feature check
  const { isEnabled } = useBetaFeatures();
  const taskArchivingEnabled = isEnabled('task_archiving');

  // Check if showing archived column
  const showArchived = searchParams.get('filter') === 'archived';

  // Count archived tasks
  const archivedCount = useMemo(() => {
    if (!taskArchivingEnabled) return 0;
    return tasks.filter((task) => task.status.toLowerCase() === 'archived')
      .length;
  }, [tasks, taskArchivingEnabled]);

  // Only show when beta is enabled and we have a project (board view only)
  const shouldShow = taskArchivingEnabled && projectId && !taskId;

  const handleClick = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    if (showArchived) {
      params.delete('filter');
    } else {
      params.set('filter', 'archived');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, showArchived, setSearchParams]);

  if (!shouldShow) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-pressed={showArchived}
      aria-label={
        showArchived
          ? t('archive.hideArchived', { defaultValue: 'Hide archived tasks' })
          : t('archive.showArchived', { defaultValue: 'Show archived tasks' })
      }
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Archive className="h-4 w-4" />
      <span>{t('archive.title', { defaultValue: 'Archived' })}</span>
      {archivedCount > 0 && (
        <span className="px-1.5 py-0.5 text-xs rounded-full bg-muted">
          {archivedCount}
        </span>
      )}
      {showArchived ? (
        <Eye className="h-3.5 w-3.5 ml-0.5" />
      ) : (
        <EyeOff className="h-3.5 w-3.5 ml-0.5" />
      )}
    </Button>
  );
}
