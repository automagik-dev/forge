import {
  GitBranch as GitBranchIcon,
  GitPullRequest,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { useMemo, useState } from 'react';
import type {
  BranchStatus,
  GitBranch,
  TaskAttempt,
  TaskWithAttemptStatus,
} from 'shared/types';
import { useRebase } from '@/hooks/useRebase';
import { useMerge } from '@/hooks/useMerge';
import { usePush } from '@/hooks/usePush';
import NiceModal from '@ebay/nice-modal-react';
import { Err } from '@/lib/api';
import type { GitOperationError } from 'shared/types';
import { showModal } from '@/lib/modals';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GitOperationsProps {
  selectedAttempt: TaskAttempt;
  task: TaskWithAttemptStatus;
  projectId: string;
  branchStatus: BranchStatus | null;
  branches: GitBranch[];
  isAttemptRunning: boolean;
  setError: (error: string | null) => void;
  selectedBranch: string | null;
  layout?: 'horizontal' | 'vertical';
}

export type GitOperationsInputs = Omit<GitOperationsProps, 'selectedAttempt'>;

function GitOperations({
  selectedAttempt,
  task,
  projectId,
  branchStatus,
  branches,
  isAttemptRunning,
  setError,
}: GitOperationsProps) {
  const { t } = useTranslation('tasks');

  // Git operation hooks
  const rebaseMutation = useRebase(selectedAttempt.id, projectId);
  const mergeMutation = useMerge(selectedAttempt.id);
  const pushMutation = usePush(selectedAttempt.id);

  // Git status calculations
  const hasConflictsCalculated = useMemo(
    () => Boolean((branchStatus?.conflicted_files?.length ?? 0) > 0),
    [branchStatus?.conflicted_files]
  );

  // Local state for git operations
  const [merging, setMerging] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [rebasing, setRebasing] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);

  // Target branch change handlers

  // Memoize merge status information to avoid repeated calculations
  const mergeInfo = useMemo(() => {
    if (!branchStatus?.merges)
      return {
        hasOpenPR: false,
        openPR: null,
        hasMergedPR: false,
        mergedPR: null,
        hasMerged: false,
        latestMerge: null,
      };

    const openPR = branchStatus.merges.find(
      (m: any) => m.type === 'pr' && m.pr_info.status === 'open'
    );

    const mergedPR = branchStatus.merges.find(
      (m: any) => m.type === 'pr' && m.pr_info.status === 'merged'
    );

    const merges = branchStatus.merges.filter(
      (m: any) =>
        m.type === 'direct' ||
        (m.type === 'pr' && m.pr_info.status === 'merged')
    );

    return {
      hasOpenPR: !!openPR,
      openPR,
      hasMergedPR: !!mergedPR,
      mergedPR,
      hasMerged: merges.length > 0,
      latestMerge: branchStatus.merges[0] || null, // Most recent merge
    };
  }, [branchStatus?.merges]);

  const mergeButtonLabel = useMemo(() => {
    if (mergeSuccess) return t('git.states.merged');
    if (merging) return t('git.states.merging');
    return t('git.states.merge');
  }, [mergeSuccess, merging, t]);

  const rebaseButtonLabel = useMemo(() => {
    if (rebasing) return t('git.states.rebasing');
    return t('git.states.rebase');
  }, [rebasing, t]);

  const prButtonLabel = useMemo(() => {
    if (mergeInfo.hasOpenPR) {
      return pushSuccess
        ? t('git.states.pushed')
        : pushing
          ? t('git.states.pushing')
          : t('git.states.push');
    }
    return t('git.states.createPr');
  }, [mergeInfo.hasOpenPR, pushSuccess, pushing, t]);

  const getMergeDisabledReason = useMemo(() => {
    if (mergeInfo.hasOpenPR) return 'PR already exists for this branch';
    if (merging) return 'Merge in progress';
    if (hasConflictsCalculated) return 'Merge conflicts present';
    if (isAttemptRunning) return 'Attempt is still running';
    if ((branchStatus?.commits_ahead ?? 0) === 0 && !pushSuccess && !mergeSuccess) {
      return 'No commits ahead of base branch';
    }
    return null;
  }, [mergeInfo.hasOpenPR, merging, hasConflictsCalculated, isAttemptRunning, branchStatus?.commits_ahead, pushSuccess, mergeSuccess]);

  const getPRDisabledReason = useMemo(() => {
    if (pushing) return 'Push in progress';
    if (isAttemptRunning) return 'Attempt is still running';
    if (hasConflictsCalculated) return 'Merge conflicts present';
    if (mergeInfo.hasOpenPR && branchStatus?.remote_commits_ahead === 0) {
      return 'No new commits to push to PR';
    }
    if (
      (branchStatus?.commits_ahead ?? 0) === 0 &&
      (branchStatus?.remote_commits_ahead ?? 0) === 0 &&
      !pushSuccess &&
      !mergeSuccess
    ) {
      return 'No commits to create PR';
    }
    return null;
  }, [pushing, isAttemptRunning, hasConflictsCalculated, mergeInfo.hasOpenPR, branchStatus?.remote_commits_ahead, branchStatus?.commits_ahead, pushSuccess, mergeSuccess]);

  const getRebaseDisabledReason = useMemo(() => {
    if (rebasing) return 'Rebase in progress';
    if (isAttemptRunning) return 'Attempt is still running';
    if (hasConflictsCalculated) return 'Merge conflicts present';
    return null;
  }, [rebasing, isAttemptRunning, hasConflictsCalculated]);

  const handleMergeClick = async () => {
    // Directly perform merge without checking branch status
    await performMerge();
  };

  const handlePushClick = async () => {
    try {
      setPushing(true);
      await pushMutation.mutateAsync();
      setError(null); // Clear any previous errors on success
      setPushSuccess(true);
      setTimeout(() => setPushSuccess(false), 2000);
    } catch (error: any) {
      setError(error.message || t('git.errors.pushChanges'));
    } finally {
      setPushing(false);
    }
  };

  const performMerge = async () => {
    try {
      setMerging(true);
      await mergeMutation.mutateAsync();
      setError(null); // Clear any previous errors on success
      setMergeSuccess(true);
      setTimeout(() => setMergeSuccess(false), 2000);
    } catch (error) {
      // @ts-expect-error it is type ApiError
      setError(error.message || t('git.errors.mergeChanges'));
    } finally {
      setMerging(false);
    }
  };

  const handleRebaseWithNewBranchAndUpstream = async (
    newBaseBranch: string,
    selectedUpstream: string
  ) => {
    setRebasing(true);
    await rebaseMutation
      .mutateAsync({
        newBaseBranch: newBaseBranch,
        oldBaseBranch: selectedUpstream,
      })
      .then(() => setError(null))
      .catch((err: Err<GitOperationError>) => {
        const data = err?.error;
        const isConflict =
          data?.type === 'merge_conflicts' ||
          data?.type === 'rebase_in_progress';
        if (!isConflict) setError(err.message || t('git.errors.rebaseBranch'));
      });
    setRebasing(false);
  };

  const handleRebaseDialogOpen = async () => {
    try {
      const defaultTargetBranch = selectedAttempt.target_branch;
      const result = await showModal<{
        action: 'confirmed' | 'canceled';
        branchName?: string;
        upstreamBranch?: string;
      }>('rebase-dialog', {
        branches,
        isRebasing: rebasing,
        initialTargetBranch: defaultTargetBranch,
        initialUpstreamBranch: defaultTargetBranch,
      });
      if (
        result.action === 'confirmed' &&
        result.branchName &&
        result.upstreamBranch
      ) {
        await handleRebaseWithNewBranchAndUpstream(
          result.branchName,
          result.upstreamBranch
        );
      }
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  const handlePRButtonClick = async () => {
    // If PR already exists, push to it
    if (mergeInfo.hasOpenPR) {
      await handlePushClick();
      return;
    }

    NiceModal.show('create-pr', {
      attempt: selectedAttempt,
      task,
      projectId,
    });
  };

  // Hide entire panel only if PR is merged
  if (mergeInfo.hasMergedPR) {
    return null;
  }

  const actionsClasses = 'flex flex-wrap items-center gap-2';

  const mergeDisabled = getMergeDisabledReason !== null;
  const prDisabled = getPRDisabledReason !== null;
  const rebaseDisabled = getRebaseDisabledReason !== null;

  return (
    <div className="w-full border-b py-2 px-3">
      {/* Actions only - branch info and status moved to breadcrumb */}
      {branchStatus && (
        <div className={actionsClasses}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleMergeClick}
                  disabled={mergeDisabled}
                  variant="outline"
                  size="xs"
                  className="border-success text-success hover:bg-success gap-1 shrink-0"
                  aria-label={mergeButtonLabel}
                >
                  <GitBranchIcon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[10ch]">{mergeButtonLabel}</span>
                </Button>
              </TooltipTrigger>
              {getMergeDisabledReason && (
                <TooltipContent side="bottom">
                  {getMergeDisabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handlePRButtonClick}
                  disabled={prDisabled}
                  variant="outline"
                  size="xs"
                  className="border-info text-info hover:bg-info gap-1 shrink-0"
                  aria-label={prButtonLabel}
                >
                  <GitPullRequest className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[10ch]">{prButtonLabel}</span>
                </Button>
              </TooltipTrigger>
              {getPRDisabledReason && (
                <TooltipContent side="bottom">
                  {getPRDisabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleRebaseDialogOpen}
                  disabled={rebaseDisabled}
                  variant="outline"
                  size="xs"
                  className="border-warning text-warning hover:bg-warning gap-1 shrink-0"
                  aria-label={rebaseButtonLabel}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${rebasing ? 'animate-spin' : ''}`}
                  />
                  <span className="truncate max-w-[10ch]">{rebaseButtonLabel}</span>
                </Button>
              </TooltipTrigger>
              {getRebaseDisabledReason && (
                <TooltipContent side="bottom">
                  {getRebaseDisabledReason}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}

export default GitOperations;
