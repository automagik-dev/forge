import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { attemptsApi } from '@/lib/api';
import type {
  TaskAttempt,
  TaskRelationships,
  TaskWithAttemptStatus,
} from 'shared/types';
import { cn } from '@/lib/utils';

interface TaskRelationshipBreadcrumbProps {
  selectedAttempt: TaskAttempt | null;
  currentTask: TaskWithAttemptStatus | null;
  onNavigateToTask?: (taskId: string) => void;
}

export function TaskRelationshipBreadcrumb({
  selectedAttempt,
  currentTask,
  onNavigateToTask,
}: TaskRelationshipBreadcrumbProps) {
  const [relationships, setRelationships] = useState<TaskRelationships | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedAttempt?.id) {
      setRelationships(null);
      return;
    }

    const fetchRelationships = async () => {
      setLoading(true);
      try {
        const relationshipData = await attemptsApi.getChildren(
          selectedAttempt.id
        );
        setRelationships(relationshipData);
      } catch (err) {
        console.error('Failed to fetch task relationships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [selectedAttempt?.id]);

  const hasParent = relationships?.parent_task !== null;

  if (loading || !hasParent || !relationships?.parent_task) {
    return null;
  }

  const truncate = (text: string, maxLength: number = 40) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-4 py-2 bg-muted/30 border-b">
      <button
        onClick={() => onNavigateToTask?.(relationships.parent_task!.id)}
        className={cn(
          'hover:text-foreground transition-colors truncate max-w-[200px]',
          'font-medium'
        )}
        title={relationships.parent_task.title}
      >
        {truncate(relationships.parent_task.title)}
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <span className="text-foreground font-medium truncate">
        {truncate(currentTask?.title || 'Current Task')}
      </span>
    </div>
  );
}
