import { useState } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePush } from '@/hooks/usePush';
import type { TaskAttempt, BranchStatus } from 'shared/types';
import { useTranslation } from 'react-i18next';

interface PushToPRButtonProps {
  attempt: TaskAttempt;
  branchStatus: BranchStatus | null;
}

export function PushToPRButton({ attempt, branchStatus }: PushToPRButtonProps) {
  const { t } = useTranslation('tasks');
  const pushMutation = usePush(attempt.id);
  const [pushSuccess, setPushSuccess] = useState(false);

  const commitCount = (branchStatus?.remote_commits_ahead ?? 0) || (branchStatus?.commits_ahead ?? 0);
  const hasNewCommits = commitCount > 0;
  const pushing = pushMutation.isPending;

  // Don't show if no new commits and not in a pushing/success state
  if (!hasNewCommits && !pushing && !pushSuccess) {
    return null;
  }

  const handlePush = async () => {
    try {
      await pushMutation.mutateAsync();
      setPushSuccess(true);
      setTimeout(() => setPushSuccess(false), 2000);
    } catch (error) {
      // Error handled by mutation
      console.error('Push failed:', error);
    }
  };

  // Button label and icon with commit count
  let label: string;
  let icon: React.ReactNode;

  if (pushSuccess) {
    label = t('git.states.pushed');
    icon = <Check className="h-3 w-3" />;
  } else if (pushing) {
    label = t('git.states.pushing');
    icon = <Loader2 className="h-3 w-3 animate-spin" />;
  } else {
    label = `↑${commitCount} ${t('git.states.push')}`;
    icon = <Upload className="h-3 w-3" />;
  }

  const tooltipContent = pushSuccess
    ? t('git.tooltips.push.success')
    : pushing
    ? t('git.tooltips.push.inProgress')
    : t('git.tooltips.push.simple');

  const colorClasses = pushSuccess
    ? 'bg-emerald-100/70 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
    : 'bg-blue-100/70 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200/70 dark:hover:bg-blue-800/40';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            disabled={pushing || pushSuccess}
            onClick={handlePush}
            className={`inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${colorClasses} ${pushing || pushSuccess ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {icon}
            <span className="text-[10px]">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
