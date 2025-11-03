import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { attemptsApi } from '@/lib/api';
import type {
  TaskAttempt,
  TaskRelationships,
  TaskWithAttemptStatus,
} from 'shared/types';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

  return (
    <div className="shrink-0 px-3 py-2 bg-muted/30 border-b">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="cursor-pointer max-w-[200px] truncate"
            >
              <button
                onClick={() => onNavigateToTask?.(relationships.parent_task!.id)}
                title={relationships.parent_task.title}
              >
                {relationships.parent_task.title}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[300px] truncate">
              {currentTask?.title || 'Current Task'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
