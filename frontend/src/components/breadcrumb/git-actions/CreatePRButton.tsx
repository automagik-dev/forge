import { GitPullRequest } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import NiceModal from '@ebay/nice-modal-react';
import type { TaskWithAttemptStatus, TaskAttempt, BranchStatus } from 'shared/types';
import { useTranslation } from 'react-i18next';

interface CreatePRButtonProps {
  task: TaskWithAttemptStatus;
  attempt: TaskAttempt;
  branchStatus: BranchStatus | null;
  projectId: string;
}

export function CreatePRButton({
  task,
  attempt,
  branchStatus,
  projectId,
}: CreatePRButtonProps) {
  const { t } = useTranslation('tasks');

  const hasCommits = (branchStatus?.commits_ahead ?? 0) > 0;
  const hasConflicts = (branchStatus?.conflicted_files?.length ?? 0) > 0;

  // Don't show if no commits to create PR for
  if (!hasCommits) return null;

  const handleClick = () => {
    NiceModal.show('create-pr', {
      attempt,
      task,
      projectId,
    });
  };

  const tooltipContent = hasConflicts
    ? t('git.tooltips.createPr.conflictWarning')
    : t('git.tooltips.createPr.simple');

  const colorClasses = 'bg-blue-100/70 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200/70 dark:hover:bg-blue-800/40';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            disabled={hasConflicts}
            onClick={handleClick}
            className={`inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${colorClasses} ${hasConflicts ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <GitPullRequest className="h-3 w-3" />
            <span className="text-[10px]">{t('git.states.createPr')}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p>{tooltipContent}</p>
          {!hasConflicts && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('git.tooltips.createPr.description')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
