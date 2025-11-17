import { AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BranchStatus } from 'shared/types';

interface UpdateNeededBadgeProps {
  branchStatus: BranchStatus | null;
}

export function UpdateNeededBadge({ branchStatus }: UpdateNeededBadgeProps) {
  // Check if base branch needs update (remote has more commits)
  const needsUpdate = (branchStatus?.remote_commits_behind ?? 0) > 0;

  if (!needsUpdate) return null;

  const commitCount = branchStatus?.remote_commits_behind ?? 0;

  return (
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
            Base branch has {commitCount} new{' '}
            {commitCount === 1 ? 'commit' : 'commits'}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
