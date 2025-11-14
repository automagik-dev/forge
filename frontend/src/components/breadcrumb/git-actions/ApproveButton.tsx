import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useApproveTask } from '@/hooks/useApproveTask';
import type { TaskWithAttemptStatus, TaskAttempt, BranchStatus } from 'shared/types';
import { useTranslation } from 'react-i18next';

interface ApproveButtonProps {
  task: TaskWithAttemptStatus;
  attempt: TaskAttempt;
  branchStatus: BranchStatus | null;
  projectId: string;
}

export function ApproveButton({
  task,
  attempt,
  branchStatus,
  projectId,
}: ApproveButtonProps) {
  const { t } = useTranslation('tasks');
  const { approve, isApproving } = useApproveTask();

  const hasCodeChanges = (branchStatus?.commits_ahead ?? 0) > 0;
  const hasConflicts = (branchStatus?.conflicted_files?.length ?? 0) > 0;

  // Only show Approve button when task is in review status
  // Don't show while agent is working (inprogress, agent) or when already done
  const canApprove = task.status === 'inreview';

  // Don't show button if task is not in review
  if (!canApprove) return null;

  const handleClick = () => {
    approve({
      taskId: task.id,
      attemptId: attempt.id,
      shouldMerge: hasCodeChanges,
      projectId,
    });
  };

  // Determine button state
  const isDisabled = hasConflicts || isApproving;

  // Button label with commit count upfront
  const commitCount = branchStatus?.commits_ahead ?? 0;
  let label: string;
  if (isApproving) {
    label = hasCodeChanges ? t('git.states.mergingAndCompleting') : t('git.states.completing');
  } else if (hasConflicts) {
    label = t('git.states.resolveConflicts');
  } else if (hasCodeChanges) {
    // Show count upfront: "↑3 Approve & Merge"
    label = `↑${commitCount} ${t('git.states.approveMerge')}`;
  } else {
    label = t('git.states.approve');
  }

  // Tooltip content
  let tooltipContent: string;
  if (hasConflicts) {
    const fileCount = branchStatus?.conflicted_files?.length ?? 0;
    tooltipContent = t('git.tooltips.resolveConflicts', {
      count: fileCount,
      files: branchStatus?.conflicted_files?.slice(0, 3).join(', ') ?? '',
    });
  } else if (hasCodeChanges) {
    tooltipContent = t('git.tooltips.approveMerge', {
      count: branchStatus?.commits_ahead ?? 0,
      branch: attempt.target_branch,
    });
  } else {
    tooltipContent = t('git.tooltips.approve');
  }

  // Determine color classes based on state
  const colorClasses = hasConflicts
    ? 'bg-red-100/60 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-200/60 dark:hover:bg-red-800/40'
    : hasCodeChanges
    ? 'bg-emerald-100/70 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-800/40'
    : 'bg-blue-100/70 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200/70 dark:hover:bg-blue-800/40';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            disabled={isDisabled}
            onClick={handleClick}
            className={`inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${colorClasses} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isApproving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : hasConflicts ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            <span className="text-[10px]">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p>{tooltipContent}</p>
          {hasCodeChanges && !hasConflicts && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('git.tooltips.technical.merge')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
