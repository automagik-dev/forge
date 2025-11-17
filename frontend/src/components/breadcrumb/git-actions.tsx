import { useTranslation } from 'react-i18next';
import { GitPullRequest, CheckCircle, Upload, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePush } from '@/hooks/usePush';
import { useApproveTask } from '@/hooks/useApproveTask';
import { useState } from 'react';
import { showModal } from '@/lib/modals';
import type { TaskWithAttemptStatus, TaskAttempt, BranchStatus } from 'shared/types';
import { projectsApi } from '@/lib/api';

interface GitActionsGroupProps {
  task: TaskWithAttemptStatus;
  attempt?: TaskAttempt;
  branchStatus?: BranchStatus;
  projectId: string;
  // For board view (project-level operations)
  isProjectLevel?: boolean;
}

export function GitActionsGroup({
  task,
  attempt,
  branchStatus,
  projectId,
  isProjectLevel = false,
}: GitActionsGroupProps) {
  const { t } = useTranslation('tasks');
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  // Attempt-level push mutation
  const pushMutation = usePush(
    attempt?.id,
    () => {},
    (err) => console.error('Push failed:', err)
  );

  // Approve task mutation
  const { approve, isApproving } = useApproveTask();

  // Project-level git pull operation
  const handleProjectPull = async () => {
    if (!projectId) return;

    setIsPulling(true);
    try {
      // TODO: Implement project-level pull API endpoint
      // await projectsApi.pull(projectId);
      console.log('Project pull not yet implemented');
    } catch (err) {
      console.error('Pull failed:', err);
    } finally {
      setIsPulling(false);
    }
  };

  // Project-level git push operation
  const handleProjectPush = async () => {
    if (!projectId) return;

    setIsPushing(true);
    try {
      // TODO: Implement project-level push API endpoint
      // await projectsApi.push(projectId);
      console.log('Project push not yet implemented');
    } catch (err) {
      console.error('Push failed:', err);
    } finally {
      setIsPushing(false);
    }
  };

  // Attempt-level push to PR
  const handlePushToPR = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id) return;

    setIsPushing(true);
    try {
      await pushMutation.mutateAsync();
    } finally {
      setIsPushing(false);
    }
  };

  // Create PR
  const handleCreatePR = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt || !task) return;

    try {
      await showModal('create-pr-dialog', {
        attemptId: attempt.id,
        task,
        projectId,
      });
    } catch (error) {
      // User cancelled
    }
  };

  // Approve task
  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!attempt?.id || !task?.id) return;

    try {
      // Show approval dialog to confirm merge decision
      const result = await showModal<{ shouldMerge: boolean }>('approve-task-dialog', {
        task,
        attempt,
      });

      if (result?.shouldMerge !== undefined) {
        approve({
          taskId: task.id,
          attemptId: attempt.id,
          shouldMerge: result.shouldMerge,
          projectId,
          title: task.title,
          description: task.description || null,
          parentTaskAttempt: task.parent_task_attempt || null,
        });
      }
    } catch (err) {
      // User cancelled or error occurred
    }
  };

  // For project-level (board view), show pull/push/refresh actions
  if (isProjectLevel) {
    return (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleProjectPull}
                disabled={isPulling}
                className="h-6 px-2"
                aria-label="Pull from remote"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Pull from remote
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleProjectPush}
                disabled={isPushing}
                className="h-6 px-2"
                aria-label="Push to remote"
              >
                <Upload className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Push to remote
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => window.location.reload()}
                className="h-6 px-2"
                aria-label="Refresh status"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Refresh status
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // For attempt-level (task view), show existing PR/approve actions
  if (!attempt || !branchStatus) {
    return null;
  }

  const hasCommits = (branchStatus.commits_ahead ?? 0) > 0;
  const hasPR = Boolean(attempt.pr_number);
  const isApproved = task.approval === 'approved';
  const canApprove = hasCommits && !isApproved;

  return (
    <div className="flex items-center gap-1">
      {/* Create PR or Push to PR */}
      {hasCommits && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={hasPR ? handlePushToPR : handleCreatePR}
                disabled={isPushing || pushMutation.isPending}
                className="h-6 px-2 text-xs"
                aria-label={hasPR ? 'Push to PR' : 'Create PR'}
              >
                {hasPR ? (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Push
                  </>
                ) : (
                  <>
                    <GitPullRequest className="h-3.5 w-3.5 mr-1" />
                    PR
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {hasPR ? 'Push changes to PR' : 'Create Pull Request'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Approve */}
      {canApprove && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleApprove}
                disabled={isApproving}
                className="h-6 px-2 text-xs"
                aria-label="Approve"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Approve task
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Approved badge */}
      {isApproved && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-green-100/60 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-medium">
                <CheckCircle className="h-3.5 w-3.5" />
                Approved
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Task has been approved
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
