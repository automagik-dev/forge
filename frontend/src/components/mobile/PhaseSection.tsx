import { cn } from '@/lib/utils';
import type { TaskWithAttemptStatus } from 'shared/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { phaseConfigs, type Phase } from './tasks.config';

type Task = TaskWithAttemptStatus;

export interface PhaseSectionProps {
  phase: Phase;
  tasks: Task[];
  expanded: boolean;
  onToggle: () => void;
  selectedTaskId?: string;
  onTaskClick: (task: Task) => void;
  onViewDiff?: (task: Task) => void;
  onViewPreview?: (task: Task) => void;
  onArchive?: (task: Task) => void;
  onNewAttempt?: (task: Task) => void;
}

export function PhaseSection({
  phase,
  tasks,
  expanded,
  onToggle,
  selectedTaskId,
  onTaskClick,
  onViewDiff,
  onViewPreview,
  onArchive,
  onNewAttempt
}: PhaseSectionProps) {
  if (tasks.length === 0) return null;

  const config = phaseConfigs[phase];

  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
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
            ({tasks.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              phase={phase}
              onClick={() => onTaskClick(task)}
              isSelected={task.id === selectedTaskId}
              onViewDiff={onViewDiff}
              onViewPreview={onViewPreview}
              onArchive={onArchive}
              onNewAttempt={onNewAttempt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
