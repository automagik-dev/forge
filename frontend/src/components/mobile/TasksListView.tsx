import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TaskWithAttemptStatus, GitBranch } from 'shared/types';
import {
  Hammer,
  CheckCircle2,
  Archive,
  GitMerge,
  Bell,
  ChevronDown,
  ChevronUp,
  Target,
} from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';
import { TaskActions } from '@/components/tasks/TaskActions';

type Task = TaskWithAttemptStatus;

interface TasksListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
  className?: string;
  projectName?: string;
  onProjectClick?: () => void;
  onViewDiff?: (task: Task) => void;
  onViewPreview?: (task: Task) => void;
  branches?: GitBranch[];
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
  projectName,
  onProjectClick,
  onViewDiff,
  onViewPreview,
  branches,
}: TasksListViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<Phase, boolean>>({
    wish: true,
    forge: true,
    review: true,
    done: true,
    archived: false, // Collapsed by default
  });

  const togglePhase = (phase: Phase) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

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

  // Render active phases first, then archived at the end
  const phasesOrder: Phase[] = ['wish', 'forge', 'review', 'done', 'archived'];

  const renderPhaseGroup = (phase: Phase) => {
    const phaseTasks = groupedTasks[phase];
    if (phaseTasks.length === 0) return null;

    const config = phaseConfigs[phase];
    const isExpanded = expandedPhases[phase];

    return (
      <div key={phase} className="flex flex-col">
        <button
          onClick={() => togglePhase(phase)}
          className={cn(
            'sticky top-0 z-10 px-4 py-2 backdrop-blur-sm',
            'flex items-center justify-between gap-2',
            'border-b border-white/5',
            'hover:bg-white/5 transition-colors',
            config.bgColor
          )}
        >
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
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="flex flex-col">
            {phaseTasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                phase={phase}
                onClick={() => onTaskClick(task)}
                isSelected={task.id === selectedTaskId}
                onViewDiff={onViewDiff}
                onViewPreview={onViewPreview}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col gap-0 pb-24', className)}>
      {/* Project header - shows current project with click to navigate back to projects list */}
      {projectName && (
        <button
          onClick={onProjectClick}
          className="sticky top-0 z-20 px-4 py-3 bg-[#1A1625]/95 backdrop-blur-sm border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <div className="flex flex-col gap-2">
            {/* Top row: project name and task count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-muted-foreground rotate-90" />
                <span className="font-primary text-sm font-semibold text-foreground">
                  {projectName}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {/* Bottom row: git branch info */}
            {branches && branches.length > 0 && (
              <div className="flex items-center gap-2">
                {(() => {
                  const currentBranch = branches.find((b) => b.is_current);
                  if (!currentBranch) return null;

                  return (
                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-secondary/70 text-secondary-foreground text-xs">
                        <span className="text-[10px]">⎇</span>
                        <span>{currentBranch.name}</span>
                      </div>
                      {/* TODO: Add commits ahead/behind badges when main workspace branch status API is available */}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </button>
      )}

      {phasesOrder.map((phase) => renderPhaseGroup(phase))}

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
  onViewDiff?: (task: Task) => void;
  onViewPreview?: (task: Task) => void;
}

function TaskListItem({
  task,
  phase,
  onClick,
  isSelected,
  onViewDiff,
  onViewPreview,
}: TaskListItemProps) {
  const config = phaseConfigs[phase];
  const timeAgo = formatTimeAgo(task.updated_at);
  const isRunning = task.has_in_progress_attempt;
  const hasApproved = task.has_merged_attempt;
  const hasFailed = task.last_attempt_failed;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
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
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full text-left px-4 py-3',
          'hover:bg-white/5',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'cursor-pointer'
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

            <div onClick={(e) => e.stopPropagation()}>
              <TaskActions
                task={task}
                showQuickActions={true}
                alwaysShowQuickActions={true}
                compact={true}
                onViewDiff={onViewDiff}
                onViewPreview={onViewPreview}
                onViewDetails={onClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
