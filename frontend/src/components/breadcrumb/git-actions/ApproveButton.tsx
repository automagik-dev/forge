import { Check, AlertTriangle, Loader2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const { approve, isApproving, error } = useApproveTask();
  const [, setShouldShake] = useState(false);
  const [showError, setShowError] = useState(false);

  // Show error when it occurs
  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const hasCodeChanges = (branchStatus?.commits_ahead ?? 0) > 0;
  const hasConflicts = (branchStatus?.conflicted_files?.length ?? 0) > 0;
  const needsRebase = (branchStatus?.commits_behind ?? 0) > 0 || (branchStatus?.remote_commits_behind ?? 0) > 0;
  const rebaseCommitCount = (branchStatus?.remote_commits_behind ?? branchStatus?.commits_behind ?? 0);

  // Only show Approve button when task is in review status
  // Don't show while agent is working (inprogress, agent) or when already done
  const canApprove = task.status === 'inreview';

  // Don't show button if task is not in review
  if (!canApprove) return null;

  const handleClick = () => {
    // If rebase is needed, shake the Update Needed badge/Rebase button to draw attention
    if (needsRebase) {
      setShouldShake(true);
      // Find and shake the rebase/update badge
      const rebaseButton = document.querySelector('[data-rebase-button]') as HTMLElement;
      if (rebaseButton) {
        rebaseButton.classList.add('animate-shake');
        setTimeout(() => {
          rebaseButton.classList.remove('animate-shake');
        }, 500);
      }
      return;
    }

    // Don't allow approval if has conflicts or is already approving
    if (hasConflicts || isApproving) {
      return;
    }

    approve({
      taskId: task.id,
      attemptId: attempt.id,
      shouldMerge: hasCodeChanges,
      projectId,
      title: task.title,
      description: task.description,
      parentTaskAttempt: task.parent_task_attempt,
    });
  };

  // Determine button state - also disable if needs rebase
  const isDisabled = hasConflicts || isApproving || needsRebase;

  // Button label with commit count upfront
  const commitCount = branchStatus?.commits_ahead ?? 0;
  let label: string;
  if (isApproving) {
    label = hasCodeChanges ? t('git.states.mergingAndCompleting') : t('git.states.completing');
  } else if (needsRebase) {
    label = t('git.states.rebaseRequired');
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
  if (needsRebase) {
    tooltipContent = `Please rebase with ${attempt.target_branch} first (${rebaseCommitCount} new ${rebaseCommitCount === 1 ? 'commit' : 'commits'})`;
  } else if (hasConflicts) {
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
  const colorClasses = needsRebase
    ? 'bg-amber-100/70 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-200/70 dark:hover:bg-amber-800/40'
    : hasConflicts
    ? 'bg-red-100/60 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-200/60 dark:hover:bg-red-800/40'
    : hasCodeChanges
    ? 'bg-emerald-100/70 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-800/40'
    : 'bg-blue-100/70 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200/70 dark:hover:bg-blue-800/40';

  return (
    <>
      {/* Error Alert */}
      {showError && error && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2">
          <Alert variant="destructive" className="pr-10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Approval Failed</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{error.message}</p>
              {error.type === 'merge_failed' && (
                <p className="text-xs opacity-90">
                  Try rebasing with the target branch or resolve any conflicts before approving.
                </p>
              )}
              {error.type === 'verification_failed' && (
                <p className="text-xs opacity-90">
                  Please check the branch status and try again.
                </p>
              )}
            </AlertDescription>
            <button
              onClick={() => setShowError(false)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/20 transition-colors"
              aria-label="Close error"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled={isDisabled}
              onClick={handleClick}
              className={`inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border text-xs font-medium transition-colors ${colorClasses} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isApproving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : needsRebase || hasConflicts ? (
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
    </>
  );
}
