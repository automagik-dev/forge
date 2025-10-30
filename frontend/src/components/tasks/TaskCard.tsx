import { useCallback, useEffect, useRef, useState } from 'react';
import { KanbanCard } from '@/components/ui/shadcn-io/kanban';
import { CheckCircle, Loader2, XCircle, Maximize2 } from 'lucide-react';
import type { TaskWithAttemptStatus } from 'shared/types';
import { ActionsDropdown } from '@/components/ui/ActionsDropdown';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/project-context';
import { paths } from '@/lib/paths';
import { Button } from '@/components/ui/button';

type Task = TaskWithAttemptStatus;

interface TaskCardProps {
  task: Task;
  index: number;
  status: string;
  onViewDetails: (task: Task) => void;
  isOpen?: boolean;
}

export function TaskCard({
  task,
  index,
  status,
  onViewDetails,
  isOpen,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useProject();

  const handleClick = useCallback(() => {
    onViewDetails(task);
  }, [task, onViewDetails]);

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!projectId || !task) return;
      navigate(`${paths.task(projectId, task.id)}/attempts/latest`);
    },
    [projectId, task, navigate]
  );

  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !localRef.current) return;
    const el = localRef.current;
    requestAnimationFrame(() => {
      el.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'smooth',
      });
    });
  }, [isOpen]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <KanbanCard
        key={task.id}
        id={task.id}
        name={task.title}
        index={index}
        parent={status}
        onClick={handleClick}
        isOpen={isOpen}
        forwardedRef={localRef}
      >
      <div className="flex flex-1 gap-2 items-center min-w-0">
        <h4 className="flex-1 min-w-0 line-clamp-2 font-light text-sm">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1">
          {/* In Progress Spinner */}
          {task.has_in_progress_attempt && (
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          )}
          {/* Merged Indicator */}
          {task.has_merged_attempt && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
          {/* Failed Indicator */}
          {task.last_attempt_failed && !task.has_merged_attempt && (
            <XCircle className="h-3 w-3 text-destructive" />
          )}
          {/* Maximize Button (on hover) */}
          {isHovered && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleMaximize}
                aria-label="Maximize"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {/* Actions Menu */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <ActionsDropdown task={task} />
          </div>
        </div>
      </div>
      {task.description && (
        <p className="flex-1 text-sm text-secondary-foreground break-words">
          {task.description.length > 130
            ? `${task.description.substring(0, 130)}...`
            : task.description}
        </p>
      )}
    </KanbanCard>
    </div>
  );
}
