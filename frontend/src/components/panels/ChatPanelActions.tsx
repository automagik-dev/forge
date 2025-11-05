import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
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
import { useUserSystem } from '@/components/config-provider';
import { BaseCodingAgent } from 'shared/types';
import { subGenieApi } from '@/services/subGenieApi';
import { useQueryClient } from '@tanstack/react-query';

interface ChatPanelActionsProps {
  attempt: TaskAttempt | undefined;
  task: TaskWithAttemptStatus | null;
}

export function ChatPanelActions({ attempt }: ChatPanelActionsProps) {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const { data: attempts = [] } = useTaskAttempts(taskId);
  const { t } = useTranslation('tasks');
  const { config } = useUserSystem();
  const queryClient = useQueryClient();
  const [isCreatingAttempt, setIsCreatingAttempt] = useState(false);

  if (!projectId || !taskId) {
    return null;
  }

  const handleCreateNewAttempt = async () => {
    if (!config || isCreatingAttempt) return;

    setIsCreatingAttempt(true);
    try {
      // Get current branch from git status - MUST succeed
      let currentBranch: string | null = null;

      try {
        const branchResponse = await fetch(`/api/projects/${projectId}/git/status`);
        if (branchResponse.ok) {
          const contentType = branchResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const { data } = await branchResponse.json();
            currentBranch = data?.current_branch || null;
            console.log('[Branch Detection]', {
              projectId,
              detected: currentBranch,
              fullResponse: data
            });
          }
        }
      } catch (error) {
        console.error('Failed to get current branch:', error);
      }

      if (!currentBranch) {
        console.error('Cannot create attempt: current branch detection failed');
        alert('Cannot create session: Failed to detect current git branch. Make sure the project is a valid git repository.');
        return;
      }

      // Check if this is a Master Genie task (has MASTER variant)
      const isMasterGenie = attempt?.executor?.includes(':MASTER');

      // Create new attempt with appropriate variant
      const executorProfile = config.executor_profile || {
        executor: BaseCodingAgent.CLAUDE_CODE,
        variant: null,
      };

      const variant = isMasterGenie ? 'MASTER' : executorProfile.variant;

      const newAttempt = await subGenieApi.createMasterGenieAttempt(
        taskId,
        currentBranch,
        { ...executorProfile, variant }
      );

      // Invalidate all related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['task-attempts', taskId] });
      await queryClient.invalidateQueries({ queryKey: ['task-attempt', newAttempt.id] });
      await queryClient.invalidateQueries({ queryKey: ['execution-processes', newAttempt.id] });

      // Navigate to new attempt with chat view
      navigate(`/projects/${projectId}/tasks/${taskId}/attempts/${newAttempt.id}?view=chat`);
    } catch (error) {
      console.error('Failed to create new attempt:', error);
      // TODO: Show error toast
    } finally {
      setIsCreatingAttempt(false);
    }
  };

  const handleCreateNewSubtask = () => {
    // TODO: Implement subtask creation (needs separate form/modal)
    console.log('Create new subtask - not yet implemented');
  };

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
                  onClick={() => navigate(`/projects/${projectId}/tasks/${taskId}/attempts/${att.id}?view=chat`)}
                  className={isCurrentAttempt ? 'bg-accent' : ''}
                >
                  <div className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Session #{attemptNumber}</span>
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
            onClick={handleCreateNewAttempt}
            disabled={isCreatingAttempt}
          >
            {isCreatingAttempt ? 'Creating...' : 'New Session'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCreateNewSubtask}
            disabled
          >
            New Subtask (Coming Soon)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
