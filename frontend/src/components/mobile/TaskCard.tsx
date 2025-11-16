import type React from 'react';
import { cn } from '@/lib/utils';
import type { TaskWithAttemptStatus } from 'shared/types';
import {
  Hammer,
  CheckCircle2,
  Archive,
  GitMerge,
  Bell,
  Target,
  GitCompareArrows,
  Eye,
  Plus
} from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';

type Task = TaskWithAttemptStatus;
type Phase = 'wish' | 'forge' | 'review' | 'done' | 'archived';

interface PhaseConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const phaseConfigs: Record<Phase, PhaseConfig> = {
  wish: {
    label: 'Wish',
    icon: <Lamp size={20} />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  forge: {
    label: 'Forge',
    icon: <Hammer className="w-5 h-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  review: {
    label: 'Review',
    icon: <Target className="w-5 h-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  done: {
    label: 'Done',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  archived: {
    label: 'Archived',
    icon: <Archive className="w-5 h-5" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} hr`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
}

export interface TaskCardProps {
  task: Task;
  phase: Phase;
  onClick: () => void;
  isSelected: boolean;
  onViewDiff?: (task: Task) => void;
  onViewPreview?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onNewAttempt?: (task: Task) => void;
}

export function TaskCard({
  task,
  phase,
  onClick,
  isSelected,
  onViewDiff,
  onViewPreview,
  onArchive,
  onNewAttempt
}: TaskCardProps) {
  const config = phaseConfigs[phase];
  const timeAgo = formatTimeAgo(task.updated_at);
  const isRunning = task.has_in_progress_attempt;
  const hasApproved = task.has_merged_attempt;
  const hasFailed = task.last_attempt_failed;

  const handleAction = (e: React.MouseEvent, action: 'diff' | 'view' | 'archive' | 'new') => {
    e.stopPropagation();

    switch (action) {
      case 'diff':
        onViewDiff?.(task);
        break;
      case 'view':
        onViewPreview?.(task);
        break;
      case 'archive':
        onArchive?.(task);
        break;
      case 'new':
        onNewAttempt?.(task);
        break;
    }
  };

  return (
    <div
      className={cn(
        'w-full border-b border-white/5',
        'transition-all duration-200',
        isSelected && 'bg-white/10'
      )}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-4 py-3',
          'hover:bg-white/5',
          'transition-colors',
          'focus:outline-none'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            config.bgColor,
            isRunning && 'animate-pulse-ring'
          )}>
            <span className={config.color}>
              {config.icon}
            </span>
            {isRunning && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-primary text-sm font-semibold text-foreground line-clamp-2 mb-1">
              {task.title}
            </h4>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{timeAgo}</span>
              {hasApproved && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-green-500">
                    <GitMerge className="w-3 h-3" />
                    <span>approved</span>
                  </div>
                </>
              )}
              {isRunning && (
                <>
                  <span>•</span>
                  <span className="text-blue-500 font-medium">running</span>
                </>
              )}
              {hasFailed && !hasApproved && !isRunning && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Bell className="w-3 h-3" />
                    <span>failed</span>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleAction(e, 'diff')}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs"
                title="View diffs"
              >
                <GitCompareArrows className="w-3 h-3" />
                <span>Diff</span>
              </button>
              <button
                onClick={(e) => handleAction(e, 'view')}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs"
                title="View preview"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              {phase !== 'archived' && (
                <button
                  onClick={(e) => handleAction(e, 'archive')}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs"
                  title="Archive task"
                >
                  <Archive className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => handleAction(e, 'new')}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-xs text-blue-400"
                title="New attempt"
              >
                <Plus className="w-3 h-3" />
                <span>Attempt</span>
              </button>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
