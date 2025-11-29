import { useEffect, useState } from 'react';
import { GitFork } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const childCount = relationships?.children?.length || 0;

  if (loading || childCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 shrink-0">
        {/* Children badge - icon + count with dropdown */}
        {childCount > 0 && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center gap-0.5 h-6 px-1.5 text-xs border border-border rounded-md bg-background cursor-pointer hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-colors"
                    aria-label={`${childCount} child ${childCount === 1 ? 'task' : 'tasks'}`}
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium">
                      {childCount}
                    </span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {childCount} {childCount === 1 ? 'Child' : 'Children'}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-80">
              <div className="px-2 py-1.5 text-sm font-medium">
                Child Tasks ({childCount})
              </div>
              {relationships?.children?.map((child) => (
                <DropdownMenuItem
                  key={child.id}
                  onClick={() => onNavigateToTask?.(child.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <div className="font-medium truncate">{child.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: {child.status}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
}
