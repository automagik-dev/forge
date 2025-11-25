import { useMemo } from 'react';
import { ApproveButton } from './ApproveButton';
import { CreatePRButton } from './CreatePRButton';
import { PushToPRButton } from './PushToPRButton';
import { ViewPRButton } from './ViewPRButton';
import { UpdateNeededBadge } from './UpdateNeededBadge';
import type { TaskWithAttemptStatus, TaskAttempt, BranchStatus } from 'shared/types';

interface GitActionsGroupProps {
  task: TaskWithAttemptStatus;
  attempt: TaskAttempt;
  branchStatus: BranchStatus | null;
  projectId: string;
}

export function GitActionsGroup({
  task,
  attempt,
  branchStatus,
  projectId,
}: GitActionsGroupProps) {
  // Check if there's an open PR
  const prInfo = useMemo(() => {
    if (!branchStatus?.merges) return null;

    const openPR = branchStatus.merges.find(
      (m) => m.type === 'pr' && m.pr_info?.status === 'open'
    );

    const mergedPR = branchStatus.merges.find(
      (m) => m.type === 'pr' && m.pr_info?.status === 'merged'
    );

    return {
      hasOpenPR: !!openPR,
      hasMergedPR: !!mergedPR,
      openPR,
    };
  }, [branchStatus?.merges]);

  // If PR is merged, don't show any git actions
  if (prInfo?.hasMergedPR) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Update Needed Badge - always show if base branch is behind */}
      <UpdateNeededBadge branchStatus={branchStatus} />

      {prInfo?.hasOpenPR ? (
        // PR Workflow: Show Push to PR and View PR buttons
        <>
          <PushToPRButton attempt={attempt} branchStatus={branchStatus} />
          {prInfo.openPR?.pr_info?.url && prInfo.openPR?.pr_info?.number && (
            <ViewPRButton
              prUrl={prInfo.openPR.pr_info.url}
              prNumber={prInfo.openPR.pr_info.number}
            />
          )}
        </>
      ) : (
        // Direct Merge Workflow: Show Create PR and Approve & Merge buttons
        <>
          <CreatePRButton
            task={task}
            attempt={attempt}
            branchStatus={branchStatus}
            projectId={projectId}
          />
          <ApproveButton
            task={task}
            attempt={attempt}
            branchStatus={branchStatus}
            projectId={projectId}
          />
        </>
      )}
    </div>
  );
}
