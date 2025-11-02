import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { attemptsApi } from '@/lib/api';
import type { TaskAttempt, TaskRelationships } from 'shared/types';

interface TaskRelationshipBadgesProps {
  selectedAttempt: TaskAttempt | null;
  onNavigateToTask?: (taskId: string) => void;
}

export function TaskRelationshipBadges({
  selectedAttempt,
  onNavigateToTask,
}: TaskRelationshipBadgesProps) {
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
  const childCount = relationships?.children?.length || 0;

  if (loading || (!hasParent && childCount === 0)) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {hasParent && relationships?.parent_task && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="h-6 px-2 py-0 text-xs cursor-pointer hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors"
                onClick={() => onNavigateToTask?.(relationships.parent_task!.id)}
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Parent
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="text-xs">
                <div className="font-medium">Parent Task</div>
                <div className="text-muted-foreground mt-0.5">
                  {relationships.parent_task.title}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {childCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="h-6 px-2 py-0 text-xs cursor-pointer hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-colors"
              >
                <ArrowDown className="w-3 h-3 mr-1" />
                {childCount} {childCount === 1 ? 'Child' : 'Children'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="text-xs">
                <div className="font-medium">Child Tasks ({childCount})</div>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  {relationships?.children?.slice(0, 3).map((child) => (
                    <li key={child.id} className="truncate">
                      • {child.title}
                    </li>
                  ))}
                  {childCount > 3 && (
                    <li className="italic">...and {childCount - 3} more</li>
                  )}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
