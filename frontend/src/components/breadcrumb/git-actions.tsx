import { GitPullRequest, AlertCircle } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import NiceModal from '@ebay/nice-modal-react';
import type { Task, TaskAttempt, BranchStatus, TaskWithAttemptStatus } from 'shared/types';

interface GitActionsGroupProps {
  task: Task;
  attempt: TaskAttempt;
  branchStatus: BranchStatus;
  projectId: string;
}

export function GitActionsGroup({
  task,
  attempt,
  branchStatus,
  projectId,
}: GitActionsGroupProps) {
  const { t } = useTranslation('tasks');

  // Check if PR can be created
  const canCreatePR = !attempt.worktree_deleted && !branchStatus.is_rebase_in_progress;

  // Check if base branch needs update (remote has more commits)
  const needsUpdate = (branchStatus.remote_commits_behind ?? 0) > 0;

  const handleCreatePR = useCallback(async () => {
    if (!canCreatePR) return;

    try {
      // Convert Task to TaskWithAttemptStatus for the dialog
      const taskWithStatus: TaskWithAttemptStatus = {
        ...task,
        has_in_progress_attempt: false,
        has_merged_attempt: false,
        last_attempt_failed: false,
        executor: attempt.executor,
      };

      await NiceModal.show('create-pr', {
        attempt,
        task: taskWithStatus,
        projectId,
      });
    } catch (error) {
      // User cancelled or error occurred
      console.error('Error creating PR:', error);
    }
  }, [canCreatePR, task, attempt, projectId]);

  return (
    <div className="flex items-center gap-2">
      {/* Update Needed Indicator */}
      {needsUpdate && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border text-xs font-medium cursor-default transition-colors bg-amber-100/70 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                data-state="closed"
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span className="text-[10px]">Update Needed</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="text-xs">
                Base branch has {branchStatus.remote_commits_behind} new{' '}
                {branchStatus.remote_commits_behind === 1 ? 'commit' : 'commits'}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Create PR Button */}
      {canCreatePR && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCreatePR}
                className="inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border text-xs font-medium cursor-pointer transition-colors bg-blue-100/70 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200/70 dark:hover:bg-blue-800/40"
                data-state="closed"
              >
                <GitPullRequest className="h-3 w-3" aria-hidden="true" />
                <span className="text-[10px]">Create PR</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="text-xs">Create a pull request on GitHub</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
