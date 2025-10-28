import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { X, Maximize2, Loader2, Send } from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';
import { useProject } from '@/contexts/project-context';
import { subGenieApi } from '@/services/subGenieApi';
import type { Task, TaskAttempt, TaskWithAttemptStatus } from 'shared/types';
import VirtualizedList from '@/components/logs/VirtualizedList';
import { TaskFollowUpSection } from '@/components/tasks/TaskFollowUpSection';
import { EntriesProvider } from '@/contexts/EntriesContext';
import { RetryUiProvider } from '@/contexts/RetryUiContext';
import { ExecutionProcessesProvider } from '@/contexts/ExecutionProcessesContext';
import { ReviewProvider } from '@/contexts/ReviewProvider';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';
import { paths } from '@/lib/paths';

interface GenieMasterWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const GenieMasterWidget: React.FC<GenieMasterWidgetProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useProject();
  const [masterGenie, setMasterGenie] = useState<{
    task: Task;
    attempt?: TaskAttempt;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Convert Task to TaskWithAttemptStatus for components that need it
  const taskWithStatus: TaskWithAttemptStatus | null = masterGenie
    ? {
        ...masterGenie.task,
        has_in_progress_attempt: !!masterGenie.attempt,
        has_merged_attempt: false,
        last_attempt_failed: false,
        executor: masterGenie.attempt?.executor || '',
      }
    : null;

  // Load Master Genie task when widget is opened
  useEffect(() => {
    if (!projectId || !isOpen) return;

    const loadMasterGenie = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const genie = await subGenieApi.ensureMasterGenie(projectId);
        setMasterGenie(genie);
      } catch (err) {
        console.error('Error loading Master Genie:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Master Genie');
      } finally {
        setIsLoading(false);
      }
    };

    // Only load if not already loaded
    if (!masterGenie) {
      loadMasterGenie();
    }
  }, [projectId, isOpen]);

  // ESC key listener to close widget or hide button
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isOpen) {
          onClose();
        } else if (isHovering) {
          setIsHovering(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isHovering, onClose]);

  // Click-outside detection to auto-close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Navigate to diffs view when maximizing
  const handleMaximize = () => {
    if (!projectId || !masterGenie || !masterGenie.attempt) return;
    navigate(
      `${paths.attempt(projectId, masterGenie.task.id, masterGenie.attempt.id)}?view=diffs`
    );
  };

  // Handle sending the initial message (creates attempt)
  const handleSendInitialMessage = async () => {
    if (!masterGenie || !projectId || !initialMessage.trim()) return;

    setIsSending(true);
    setError(null);

    try {
      // Create the task attempt
      const attempt = await subGenieApi.createMasterGenieAttempt(masterGenie.task.id);

      // Send the initial message as a follow-up
      await subGenieApi.sendFollowUp(attempt.id, initialMessage.trim());

      // Update state with the new attempt
      setMasterGenie({ ...masterGenie, attempt });
      setInitialMessage('');
    } catch (err) {
      console.error('Error starting Master Genie:', err);
      setError(err instanceof Error ? err.message : 'Failed to start Master Genie');
    } finally {
      setIsSending(false);
    }
  };

  // Don't render widget if not in a project context
  if (!projectId) {
    return null;
  }

  if (!isOpen) {
    // Edge sliding lamp button - hidden at edge, slides in on hover from right
    return (
      <div
        className="fixed z-50 transition-all duration-300"
        style={{
          bottom: '46px', // 30px up from original bottom-4 (16px)
          right: isHovering ? '20px' : '-20px',
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <button
          onClick={onToggle}
          className="p-2 transition-all hover:scale-110"
          aria-label="Open Genie chat"
        >
          <Lamp className="h-10 w-10 text-foreground drop-shadow-lg" />
        </button>
      </div>
    );
  }

  // Full chat widget with logs (bottom-right)
  return (
    <Card ref={widgetRef} className="fixed bottom-4 right-4 w-[600px] h-[600px] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lamp className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-semibold">Genie Master</CardTitle>
            {masterGenie && (
              <Badge variant="outline" className="ml-2">
                {masterGenie.task.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaximize}
              className="h-6 w-6 p-0"
              aria-label="Maximize to full screen"
              disabled={!masterGenie || !masterGenie.attempt}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-muted-foreground">Loading Master Genie...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-destructive">
              <p className="font-semibold">Error loading Master Genie</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : !masterGenie ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <Lamp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold">No Master Genie available</p>
              <p className="text-sm mt-1">Select a project to activate Genie</p>
            </div>
          </div>
        ) : !masterGenie.attempt ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 flex flex-col items-center justify-center">
              <Lamp className="h-12 w-12 mb-3 text-blue-500" />
              <p className="font-semibold text-lg text-center">Master Genie Ready</p>
              <p className="text-sm mt-2 text-center text-muted-foreground">
                Send a message to start your first session
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Textarea
                value={initialMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setInitialMessage(e.target.value)
                }
                placeholder="Type your message to Genie..."
                className="min-h-[100px] resize-none"
                disabled={isSending}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendInitialMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendInitialMessage}
                disabled={!initialMessage.trim() || isSending}
                className="self-end"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <ClickedElementsProvider attempt={masterGenie.attempt}>
            <ReviewProvider key={masterGenie.attempt.id}>
              <ExecutionProcessesProvider
                key={masterGenie.attempt.id}
                attemptId={masterGenie.attempt.id}
              >
                <EntriesProvider key={masterGenie.attempt.id}>
                  <RetryUiProvider attemptId={masterGenie.attempt.id}>
                    {/* Logs area */}
                    <div className="flex-1 min-h-0 overflow-auto">
                      <VirtualizedList
                        key={masterGenie.attempt.id}
                        attempt={masterGenie.attempt}
                      />
                    </div>

                    {/* Chat input area */}
                    {taskWithStatus && (
                      <div className="shrink-0 border-t">
                        <TaskFollowUpSection
                          task={taskWithStatus}
                          selectedAttemptId={masterGenie.attempt.id}
                          jumpToLogsTab={() => {}}
                        />
                      </div>
                    )}
                  </RetryUiProvider>
                </EntriesProvider>
              </ExecutionProcessesProvider>
            </ReviewProvider>
          </ClickedElementsProvider>
        )}
      </CardContent>
    </Card>
  );
};
