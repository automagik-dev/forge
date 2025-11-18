import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TaskWithAttemptStatus } from 'shared/types';
import { ChevronDown } from 'lucide-react';
import { PhaseSection } from './PhaseSection';
import { getPhaseFromStatus, type Phase } from './tasks.config';

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
  onArchive?: (task: Task) => void;
  onNewAttempt?: (task: Task) => void;
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
  onArchive,
  onNewAttempt,
}: TasksListViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<Phase, boolean>>({
    wish: true,
    forge: true,
    review: true,
    done: true,
    archived: false,
  });

  const togglePhase = (phase: Phase) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  const groupedTasks = useMemo(() => {
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

  const phasesOrder: Phase[] = ['wish', 'forge', 'review', 'done', 'archived'];

  return (
    <div className={cn('flex flex-col gap-0 pb-24', className)}>
      {projectName && (
        <button
          data-testid="mobile-project-header"
          onClick={onProjectClick}
          className="sticky top-0 z-20 px-4 py-3 bg-[#1A1625]/95 backdrop-blur-sm border-b border-white/10 hover:bg-white/5 transition-colors"
        >
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
        </button>
      )}

      {phasesOrder.map((phase) => (
        <PhaseSection
          key={phase}
          phase={phase}
          tasks={groupedTasks[phase]}
          expanded={expandedPhases[phase]}
          onToggle={() => togglePhase(phase)}
          selectedTaskId={selectedTaskId}
          onTaskClick={onTaskClick}
          onViewDiff={onViewDiff}
          onViewPreview={onViewPreview}
          onArchive={onArchive}
          onNewAttempt={onNewAttempt}
        />
      ))}

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
