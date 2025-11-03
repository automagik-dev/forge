import { useNavigate, useParams } from 'react-router-dom';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTaskAttempts } from '@/hooks/useTaskAttempts';
import type { TaskAttempt, TaskWithAttemptStatus } from 'shared/types';
import { useTranslation } from 'react-i18next';

interface ChatPanelActionsProps {
  attempt: TaskAttempt | undefined;
  task: TaskWithAttemptStatus | null;
}

export function ChatPanelActions({ attempt, task }: ChatPanelActionsProps) {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const { data: attempts = [] } = useTaskAttempts(taskId);
  const { t } = useTranslation('tasks');

  if (!task || !projectId || !taskId) {
    return null;
  }

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
      {/* History dropdown - shows all attempts */}
      {attempts.length > 0 && (
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <History className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('attemptHeaderActions.history')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto bg-popover">
            {attempts.map((att, index) => {
              const isCurrentAttempt = att.id === attempt?.id;
              const attemptNumber = attempts.length - index;
              const attemptDate = new Date(att.created_at).toLocaleString();

              return (
                <DropdownMenuItem
                  key={att.id}
                  onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/attempts/${att.id}`)}
                  className={isCurrentAttempt ? 'bg-accent' : ''}
                >
                  <div className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Attempt #{attemptNumber}</span>
                      {isCurrentAttempt && (
                        <span className="text-xs text-muted-foreground">(current)</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {att.branch || 'No branch'}
                    </span>
                    <span className="text-xs text-muted-foreground">{attemptDate}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* + button dropdown - new attempt or new subtask */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Create new</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          <DropdownMenuItem
            onClick={() => {
              // TODO: Implement create new attempt
              console.log('Create new attempt');
            }}
          >
            New Attempt
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              // TODO: Implement create new subtask
              console.log('Create new subtask');
            }}
          >
            New Subtask
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
