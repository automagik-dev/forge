import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { History, Plus, Download, Check } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useEntries } from '@/contexts/EntriesContext';
import {
  exportChatToMarkdown,
  downloadMarkdownFile,
  copyToClipboard,
  generateExportFilename,
} from '@/utils/exportChat';

interface ChatPanelActionsProps {
  attempt: TaskAttempt | undefined;
  task: TaskWithAttemptStatus | null;
}

export function ChatPanelActions({ attempt, task }: ChatPanelActionsProps) {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const { data: attempts = [] } = useTaskAttempts(taskId);
  const { t } = useTranslation('tasks');
  const queryClient = useQueryClient();
  const [isCreatingAttempt, setIsCreatingAttempt] = useState(false);
  const { entries } = useEntries();
  const [copySuccess, setCopySuccess] = useState(false);

  if (!projectId || !taskId) {
    return null;
  }

  const handleCreateNewAttempt = async () => {
    if (isCreatingAttempt) return;

    setIsCreatingAttempt(true);
    try {
      // Navigate to task without attempt ID
      // ChatPanel will create the attempt when first message is sent
      navigate(`/projects/${projectId}/tasks/${taskId}?view=chat`);

      // Invalidate attempts query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['task-attempts', taskId] });
    } catch (error) {
      console.error('Failed to navigate to new session:', error);
      // TODO: Show error toast
    } finally {
      setIsCreatingAttempt(false);
    }
  };

  const handleCreateNewSubtask = () => {
    // TODO: Implement subtask creation (needs separate form/modal)
    console.log('Create new subtask - not yet implemented');
  };

  const handleExportDownload = () => {
    if (!entries.length) return;

    const markdown = exportChatToMarkdown(entries, {
      task,
      attempt,
      projectId,
    });
    const filename = generateExportFilename({ task, attempt, projectId });
    downloadMarkdownFile(markdown, filename);
  };

  const handleExportCopy = async () => {
    if (!entries.length) return;

    const markdown = exportChatToMarkdown(entries, {
      task,
      attempt,
      projectId,
    });
    const success = await copyToClipboard(markdown);

    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
      {/* Export dropdown - download or copy chat */}
      {entries.length > 0 && (
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {copySuccess ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Export Chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            <DropdownMenuItem onClick={handleExportDownload}>
              Download as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCopy}>
              {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

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
