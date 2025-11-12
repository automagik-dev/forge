import React from 'react';
import { cn } from '@/lib/utils';
import type { TaskWithAttemptStatus } from 'shared/types';

type Task = TaskWithAttemptStatus;

interface MobileTasksListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string;
  className?: string;
}

/**
 * Mobile-optimized tasks list view
 * - Vertical list instead of kanban columns
 * - Progressive disclosure for task details
 * - Touch-optimized interactions
 * - Grouped by status
 */
export function MobileTasksList({
  tasks,
  onTaskClick,
  selectedTaskId,
  className,
}: MobileTasksListProps) {
  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      inprogress: [],
      inreview: [],
      done: [],
      cancelled: [],
    };

    tasks.forEach((task) => {
      const status = task.status.toLowerCase();
      if (groups[status]) {
        groups[status].push(task);
      } else {
        groups.todo.push(task);
      }
    });

    return groups;
  }, [tasks]);

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
  };

  const statusColors: Record<string, string> = {
    todo: 'text-muted-foreground',
    inprogress: 'text-blue-500',
    inreview: 'text-yellow-500',
    done: 'text-green-500',
    cancelled: 'text-gray-500',
  };

  return (
    <div className={cn('flex flex-col gap-4 p-4 pb-24', className)}>
      {Object.entries(groupedTasks).map(([status, statusTasks]) => {
        if (statusTasks.length === 0) return null;

        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2">
              <h3 className={cn(
                'font-primary text-sm font-semibold uppercase tracking-wide',
                statusColors[status]
              )}>
                {statusLabels[status]}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({statusTasks.length})
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {statusTasks.map((task) => (
                <MobileTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  isSelected={task.id === selectedTaskId}
                />
              ))}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground font-secondary">
            No tasks yet. Tap the + button to create one.
          </p>
        </div>
      )}
    </div>
  );
}

interface MobileTaskCardProps {
  task: Task;
  onClick: () => void;
  isSelected: boolean;
}

function MobileTaskCard({ task, onClick, isSelected }: MobileTaskCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg',
        'glass-light hover:glass-medium',
        'border border-white/10',
        'transition-all duration-200',
        'touch-target-comfortable',
        'focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:ring-offset-2',
        isSelected && 'ring-2 ring-brand-magenta glass-medium'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-primary text-base font-semibold text-foreground line-clamp-2 mb-1">
            {task.title}
          </h4>
          
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Status indicators */}
          {task.has_in_progress_attempt && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Running</span>
            </div>
          )}
          {task.has_merged_attempt && (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Merged</span>
            </div>
          )}
          {task.last_attempt_failed && !task.has_merged_attempt && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span>Failed</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
