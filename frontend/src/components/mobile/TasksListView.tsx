import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TaskWithAttemptStatus } from 'shared/types';
import { 
  Lightbulb,
  Hammer,
  Eye,
  CheckCircle2,
  Archive,
  GitMerge,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

type Task = TaskWithAttemptStatus;

interface TasksListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
  className?: string;
}

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
    icon: <Lightbulb className="w-5 h-5" />,
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
    icon: <Eye className="w-5 h-5" />,
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

function getPhaseFromStatus(status: string): Phase {
  switch (status.toLowerCase()) {
    case 'todo':
      return 'wish';
    case 'inprogress':
    case 'agent':
      return 'forge';
    case 'inreview':
      return 'review';
    case 'done':
      return 'done';
    case 'cancelled':
      return 'archived';
    default:
      return 'wish';
  }
}

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

export function TasksListView({
  tasks,
  onTaskClick,
  selectedTaskId,
  className,
}: TasksListViewProps) {
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const groupedTasks = React.useMemo(() => {
    const groups: Record<Phase, Task[]> = {
      wish: [],
      forge: [],
      review: [],
      done: [],
      archived: [],
    };

    tasks.forEach((task) => {
      const phase = getPhaseFromStatus(task.status);
      groups[phase].push(task);
    });

    return groups;
  }, [tasks]);

  const activePhases: Phase[] = ['wish', 'forge', 'review', 'done'];
  const hasArchivedTasks = groupedTasks.archived.length > 0;

  return (
    <div className={cn('flex flex-col gap-0 pb-24', className)}>
      {activePhases.map((phase) => {
        const phaseTasks = groupedTasks[phase];
        if (phaseTasks.length === 0) return null;

        const config = phaseConfigs[phase];

        return (
          <div key={phase} className="flex flex-col">
            <div className={cn(
              'sticky top-0 z-10 px-4 py-2 backdrop-blur-sm',
              'border-b border-white/5',
              config.bgColor
            )}>
              <div className="flex items-center gap-2">
                <span className={config.color}>{config.icon}</span>
                <h3 className={cn(
                  'font-primary text-sm font-semibold uppercase tracking-wide',
                  config.color
                )}>
                  {config.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({phaseTasks.length})
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              {phaseTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  phase={phase}
                  onClick={() => onTaskClick(task)}
                  isSelected={task.id === selectedTaskId}
                />
              ))}
            </div>
          </div>
        );
      })}

      {hasArchivedTasks && (
        <div className="flex flex-col border-t border-white/5 mt-2">
          <button
            onClick={() => setArchivedExpanded(!archivedExpanded)}
            className={cn(
              'sticky top-0 z-10 px-4 py-2 backdrop-blur-sm',
              'flex items-center justify-between gap-2',
              'hover:bg-white/5 transition-colors',
              phaseConfigs.archived.bgColor
            )}
          >
            <div className="flex items-center gap-2">
              <span className={phaseConfigs.archived.color}>
                {phaseConfigs.archived.icon}
              </span>
              <h3 className={cn(
                'font-primary text-sm font-semibold uppercase tracking-wide',
                phaseConfigs.archived.color
              )}>
                {phaseConfigs.archived.label}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({groupedTasks.archived.length})
              </span>
            </div>
            {archivedExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {archivedExpanded && (
            <div className="flex flex-col">
              {groupedTasks.archived.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  phase="archived"
                  onClick={() => onTaskClick(task)}
                  isSelected={task.id === selectedTaskId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <p className="text-muted-foreground font-secondary">
            No tasks yet. Tap the + button to create one.
          </p>
        </div>
      )}
    </div>
  );
}

interface TaskListItemProps {
  task: Task;
  phase: Phase;
  onClick: () => void;
  isSelected: boolean;
}

function TaskListItem({ task, phase, onClick, isSelected }: TaskListItemProps) {
  const config = phaseConfigs[phase];
  const timeAgo = formatTimeAgo(task.updated_at);
  const isRunning = task.has_in_progress_attempt;
  const hasApproved = task.has_merged_attempt;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3',
        'border-b border-white/5',
        'hover:bg-white/5',
        'transition-all duration-200',
        'focus:outline-none focus:bg-white/10',
        isSelected && 'bg-white/10'
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
          <h4 className="font-primary text-sm font-semibold text-foreground line-clamp-1 mb-0.5">
            {task.title}
          </h4>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            {hasApproved && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <GitMerge className="w-3 h-3" />
                  <span>approved</span>
                </div>
              </>
            )}
            {isRunning && (
              <>
                <span>•</span>
                <span className="text-blue-500">running</span>
              </>
            )}
          </div>
        </div>

        {task.last_attempt_failed && !hasApproved && (
          <div className="flex-shrink-0">
            <Bell className="w-4 h-4 text-yellow-500" />
          </div>
        )}
      </div>
    </button>
  );
}
