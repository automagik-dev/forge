import {
  AlertTriangle,
  GitBranch as GitBranchIcon,
  GitPullRequest,
  Info,
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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Git operation hooks
  const rebaseMutation = useRebase(selectedAttempt.id, projectId);
  const mergeMutation = useMerge(selectedAttempt.id, () => {
    // Navigate to kanban view on successful merge
    navigate(`/projects/${projectId}/tasks`);
  });
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

  const [showDetailedTooltips, setShowDetailedTooltips] = useState<{
    merge: boolean;
    pr: boolean;
    rebase: boolean;
  }>({
    merge: false,
    pr: false,
    rebase: false,
  });

  const conflictsLikely = useMemo(() => {
    if (!branchStatus) return false;

    const hasConflictedFiles = (branchStatus.conflicted_files?.length ?? 0) > 0;
    const hasBothModifications =
      (branchStatus.commits_ahead ?? 0) > 0 &&
      (branchStatus.commits_behind ?? 0) > 0;

    return hasConflictedFiles || hasBothModifications;
  }, [branchStatus]);

  const conflictedFilesList = useMemo(() => {
    if (
      !branchStatus?.conflicted_files ||
      branchStatus.conflicted_files.length === 0
    ) {
      return [];
    }
    return branchStatus.conflicted_files;
  }, [branchStatus?.conflicted_files]);

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
      (m) => m.type === 'pr' && m.pr_info.status === 'open'
    );

    const mergedPR = branchStatus.merges.find(
      (m) => m.type === 'pr' && m.pr_info.status === 'merged'
    );

    const merges = branchStatus.merges.filter(
      (m) =>
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
    if (
      (branchStatus?.commits_ahead ?? 0) === 0 &&
      !pushSuccess &&
      !mergeSuccess
    ) {
      return 'No commits ahead of base branch';
    }
    return null;
  }, [
    mergeInfo.hasOpenPR,
    merging,
    hasConflictsCalculated,
    isAttemptRunning,
    branchStatus?.commits_ahead,
    pushSuccess,
    mergeSuccess,
  ]);

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
  }, [
    pushing,
    isAttemptRunning,
    hasConflictsCalculated,
    mergeInfo.hasOpenPR,
    branchStatus?.remote_commits_ahead,
    branchStatus?.commits_ahead,
    pushSuccess,
    mergeSuccess,
  ]);

  const getRebaseDisabledReason = useMemo(() => {
    if (rebasing) return 'Rebase in progress';
    if (isAttemptRunning) return 'Attempt is still running';
    if (hasConflictsCalculated) return 'Merge conflicts present';
    if ((branchStatus?.commits_behind ?? 0) === 0) {
      return 'Branch is already up-to-date with base branch';
    }
    return null;
  }, [
    rebasing,
    isAttemptRunning,
    hasConflictsCalculated,
    branchStatus?.commits_behind,
  ]);

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
    } catch (error) {
      setError((error as Error).message || t('git.errors.pushChanges'));
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

  const renderMergeButton = () => {
    const simpleTooltip = t('git.tooltips.merge.simple');
    const detailedTooltip = (
      <div className="space-y-1.5">
        <p className="font-medium">{t('git.tooltips.merge.title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('git.tooltips.merge.description')}
        </p>
        {conflictsLikely && conflictedFilesList.length > 0 && (
          <p className="text-xs text-warning mt-1">
            ⚠️ {t('git.tooltips.merge.conflictWarning')}
          </p>
        )}
        <p className="text-xs text-muted-foreground opacity-70 mt-1">
          {t('git.tooltips.merge.technical')}
        </p>
      </div>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleMergeClick}
              disabled={mergeDisabled}
              variant="outline"
              size="xs"
              className={`gap-1 shrink-0 ${
                conflictsLikely && !mergeDisabled
                  ? 'border-warning text-warning hover:bg-warning'
                  : 'border-success text-success hover:bg-success'
              }`}
              aria-label={mergeButtonLabel}
            >
              {conflictsLikely && !mergeDisabled ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <GitBranchIcon className="h-3.5 w-3.5" />
              )}
              <span className="truncate max-w-[10ch]">{mergeButtonLabel}</span>
              {!merging && !mergeSuccess && !mergeDisabled && (
                <Info
                  className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailedTooltips((prev) => ({
                      ...prev,
                      merge: !prev.merge,
                    }));
                  }}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className={`max-w-xs ${conflictsLikely && 'border-warning'} ${
              showDetailedTooltips.merge && 'max-w-sm'
            }`}
          >
            {getMergeDisabledReason
              ? getMergeDisabledReason
              : showDetailedTooltips.merge
                ? detailedTooltip
                : simpleTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderPRButton = () => {
    const isCreatingPR = !mergeInfo.hasOpenPR;
    const simpleTooltip = isCreatingPR
      ? t('git.tooltips.createPr.simple')
      : t('git.tooltips.push.simple');

    const detailedTooltip = isCreatingPR ? (
      <div className="space-y-1.5">
        <p className="font-medium">{t('git.tooltips.createPr.title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('git.tooltips.createPr.description')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('git.tooltips.createPr.steps')}
        </p>
        {conflictsLikely && conflictedFilesList.length > 0 && (
          <p className="text-xs text-warning mt-1">
            ⚠️ {t('git.tooltips.createPr.conflictWarning')}
          </p>
        )}
        <p className="text-xs text-muted-foreground opacity-70 mt-1">
          {t('git.tooltips.createPr.technical')}
        </p>
      </div>
    ) : (
      <div className="space-y-1.5">
        <p className="font-medium">{t('git.tooltips.push.title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('git.tooltips.push.description')}
        </p>
        {conflictsLikely && conflictedFilesList.length > 0 && (
          <p className="text-xs text-warning mt-1">
            ⚠️ {t('git.tooltips.push.conflictWarning')}
          </p>
        )}
        <p className="text-xs text-muted-foreground opacity-70 mt-1">
          {t('git.tooltips.push.technical')}
        </p>
      </div>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handlePRButtonClick}
              disabled={prDisabled}
              variant="outline"
              size="xs"
              className={`gap-1 shrink-0 ${
                conflictsLikely && !prDisabled
                  ? 'border-warning text-warning hover:bg-warning'
                  : 'border-info text-info hover:bg-info'
              }`}
              aria-label={prButtonLabel}
            >
              {conflictsLikely && !prDisabled ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <GitPullRequest className="h-3.5 w-3.5" />
              )}
              <span className="truncate max-w-[10ch]">{prButtonLabel}</span>
              {!pushing && !pushSuccess && !prDisabled && (
                <Info
                  className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailedTooltips((prev) => ({
                      ...prev,
                      pr: !prev.pr,
                    }));
                  }}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className={`max-w-xs ${conflictsLikely && 'border-warning'} ${
              showDetailedTooltips.pr && 'max-w-sm'
            }`}
          >
            {getPRDisabledReason
              ? getPRDisabledReason
              : showDetailedTooltips.pr
                ? detailedTooltip
                : simpleTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderRebaseButton = () => {
    const simpleTooltip = t('git.tooltips.rebase.simple');
    const detailedTooltip = (
      <div className="space-y-1.5">
        <p className="font-medium">{t('git.tooltips.rebase.title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('git.tooltips.rebase.description')}
        </p>
        {conflictsLikely && conflictedFilesList.length > 0 && (
          <p className="text-xs text-warning mt-1">
            ⚠️ {t('git.tooltips.rebase.conflictWarning')}
          </p>
        )}
        <p className="text-xs text-muted-foreground opacity-70 mt-1">
          {t('git.tooltips.rebase.technical')}
        </p>
      </div>
    );

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleRebaseDialogOpen}
              disabled={rebaseDisabled}
              variant="outline"
              size="xs"
              className="gap-1 shrink-0 border-warning text-warning hover:bg-warning"
              aria-label={rebaseButtonLabel}
            >
              {conflictsLikely && !rebaseDisabled ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <RefreshCw
                  className={`h-3.5 w-3.5 ${rebasing ? 'animate-spin' : ''}`}
                />
              )}
              <span className="truncate max-w-[10ch]">{rebaseButtonLabel}</span>
              {!rebasing && !rebaseDisabled && (
                <Info
                  className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailedTooltips((prev) => ({
                      ...prev,
                      rebase: !prev.rebase,
                    }));
                  }}
                />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className={`max-w-xs ${conflictsLikely && 'border-warning'} ${
              showDetailedTooltips.rebase && 'max-w-sm'
            }`}
          >
            {getRebaseDisabledReason
              ? getRebaseDisabledReason
              : showDetailedTooltips.rebase
                ? detailedTooltip
                : simpleTooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full border-b py-2 px-3">
      {branchStatus && (
        <div className={actionsClasses}>
          {renderMergeButton()}
          {renderPRButton()}
          {renderRebaseButton()}
        </div>
      )}
    </div>
  );
}

export default GitOperations;
