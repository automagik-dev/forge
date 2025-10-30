import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, Loader2, Send, SquarePlus, History, Ellipsis, Maximize } from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';
import { useProject } from '@/contexts/project-context';
import { useUserSystem } from '@/components/config-provider';
import { projectsApi } from '@/lib/api';
import { subGenieApi, Neuron } from '@/services/subGenieApi';
import type { Task, TaskAttempt, TaskWithAttemptStatus, ExecutorProfileId, GitBranch } from 'shared/types';
import { BaseCodingAgent } from 'shared/types';
import BranchSelector from '@/components/tasks/BranchSelector';
import VirtualizedList from '@/components/logs/VirtualizedList';
import { TaskFollowUpSection } from '@/components/tasks/TaskFollowUpSection';
import { EntriesProvider } from '@/contexts/EntriesContext';
import { RetryUiProvider } from '@/contexts/RetryUiContext';
import { ExecutionProcessesProvider } from '@/contexts/ExecutionProcessesContext';
import { ReviewProvider } from '@/contexts/ReviewProvider';
import { ClickedElementsProvider } from '@/contexts/ClickedElementsProvider';

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
  const { t } = useTranslation('common');
  const [isHovering, setIsHovering] = useState(false);
  const { projectId } = useProject();
  const { config } = useUserSystem();
  const [masterGenie, setMasterGenie] = useState<{
    task: Task;
    attempt?: TaskAttempt;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'master' | 'wish' | 'forge' | 'review'>('master');
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [creatingNeuron, setCreatingNeuron] = useState<'wish' | 'forge' | 'review' | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [allAttempts, setAllAttempts] = useState<TaskAttempt[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [showExecutorDialog, setShowExecutorDialog] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useState<ExecutorProfileId | null>(null);
  const [isChangingExecutor, setIsChangingExecutor] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
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

  // Load branches when widget opens
  useEffect(() => {
    if (!projectId || !isOpen) return;

    projectsApi
      .getBranches(projectId)
      .then((result) => {
        setBranches(result);
        const current = result.find((b) => b.is_current)?.name || null;
        setCurrentBranch(current);
        setSelectedBranch(current); // Initialize selected branch
      })
      .catch((err) => {
        console.error('Failed to load branches:', err);
      });
  }, [projectId, isOpen]);

  // Load Master Genie task when widget is opened (don't auto-create attempt)
  useEffect(() => {
    if (!projectId || !isOpen) return;
    // Skip if already loaded
    if (masterGenie) return;

    const loadMasterGenie = async () => {
      console.log('[GenieMaster] Loading Master Genie...');
      setIsLoading(true);
      setError(null);
      try {
        const genie = await subGenieApi.ensureMasterGenie(projectId);
        console.log('[GenieMaster] Master Genie loaded:', genie);
        setMasterGenie(genie);
      } catch (err) {
        console.error('Error loading Master Genie:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Master Genie');
      } finally {
        setIsLoading(false);
      }
    };

    loadMasterGenie();
  }, [projectId, isOpen]);

  // Load neurons when Master Genie has an active attempt
  useEffect(() => {
    if (!masterGenie?.attempt) return;

    subGenieApi
      .getNeurons(masterGenie.attempt.id)
      .then((loadedNeurons) => {
        setNeurons(loadedNeurons);
      })
      .catch((err) => {
        console.error('Failed to load neurons:', err);
      });
  }, [masterGenie?.attempt?.id]);

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

  // Click-outside detection to auto-close (ignore Portal elements like dropdowns)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if widget ref contains the target
      if (widgetRef.current && !widgetRef.current.contains(target)) {
        // Check if click is inside a Radix UI Portal (dropdown menu)
        // Portals are rendered with data-radix-portal attribute
        const isInPortal = (target as Element).closest('[data-radix-popper-content-wrapper]') !== null ||
                          (target as Element).closest('[role="dialog"]') !== null ||
                          (target as Element).closest('[data-radix-portal]') !== null;

        // Only close if not clicking inside a portal
        if (!isInPortal) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);


  // Ensure a neuron task exists (doesn't create attempt until user sends message)
  const ensureNeuron = async (
    neuronType: 'wish' | 'forge' | 'review'
  ): Promise<Neuron | null> => {
    if (!projectId) return null;

    setCreatingNeuron(neuronType);
    setError(null);

    try {
      // Check if neuron already exists in state
      const existingNeuron = neurons.find((n) => n.type === neuronType);
      if (existingNeuron) {
        return existingNeuron;
      }

      // Check if neuron agent exists in backend (just the agent, not attempt)
      const agentResponse = await fetch(`/api/forge/agents?project_id=${projectId}&agent_type=${neuronType}`);
      if (!agentResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentResponse.status}`);
      }
      const { data: agents } = await agentResponse.json();

      let neuronTask: Task;
      if (agents.length === 0) {
        // Create agent entry (which creates the task)
        const createResponse = await fetch('/api/forge/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            agent_type: neuronType,
          }),
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create ${neuronType} agent: ${createResponse.status}`);
        }

        const { data: agent } = await createResponse.json();

        // Fetch the task
        const taskResponse = await fetch(`/api/tasks/${agent.task_id}`);
        if (!taskResponse.ok) {
          throw new Error(`Failed to fetch task: ${taskResponse.status}`);
        }
        const { data: task } = await taskResponse.json();
        neuronTask = task;
      } else {
        // Fetch existing task
        const taskResponse = await fetch(`/api/tasks/${agents[0].task_id}`);
        if (!taskResponse.ok) {
          throw new Error(`Failed to fetch task: ${taskResponse.status}`);
        }
        const { data: task } = await taskResponse.json();
        neuronTask = task;
      }

      // Check if neuron has an active attempt
      const attempts = await subGenieApi.getTaskAttempts(projectId);
      const neuronAttempt = attempts
        .filter((a) => a.task_id === neuronTask.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

      // Create neuron object (with or without attempt)
      const neuron: Neuron = {
        type: neuronType,
        task: neuronTask,
        attempt: neuronAttempt,
      };

      // Update neurons state
      setNeurons((prev) => {
        const filtered = prev.filter((n) => n.type !== neuronType);
        return [...filtered, neuron];
      });

      return neuron;
    } catch (err) {
      console.error(`Error ensuring ${neuronType} neuron:`, err);
      setError(err instanceof Error ? err.message : `Failed to load ${neuronType} neuron`);
      return null;
    } finally {
      setCreatingNeuron(null);
    }
  };

  // Handle tab change with neuron creation
  const handleTabChange = async (tab: 'master' | 'wish' | 'forge' | 'review') => {
    setActiveTab(tab);

    // If switching to a neuron tab, ensure it exists (but don't create attempt yet)
    if (tab !== 'master') {
      const neuron = neurons.find((n) => n.type === tab);
      if (!neuron) {
        await ensureNeuron(tab);
      }
    }
  };

  // Handle new session creation
  // Show new session dialog
  const handleShowNewSessionDialog = () => {
    setNewSessionTitle('');
    setShowNewSessionDialog(true);
  };

  // Create new session with optional title
  const handleNewSession = async (title?: string) => {
    if (!masterGenie || !projectId) return;

    // Get current branch and executor
    const baseBranch = currentBranch || 'main';
    const executorProfile = config?.executor_profile || {
      executor: BaseCodingAgent.CLAUDE_CODE as BaseCodingAgent,
      variant: activeTab === 'master' ? null : activeTab,
    };

    setIsCreatingSession(true);
    setError(null);

    try {
      // Create new attempt for current agent
      const newAttempt = await subGenieApi.createMasterGenieAttempt(
        masterGenie.task.id,
        baseBranch,
        executorProfile
      );

      // If title was provided, update the task
      if (title && title.trim()) {
        try {
          await fetch(`/api/tasks/${masterGenie.task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: title.trim(),
              description: null,
              status: null,
              parent_task_attempt: null,
              image_ids: null,
            }),
          });

          // Update local state with new title
          setMasterGenie({
            task: { ...masterGenie.task, title: title.trim() },
            attempt: newAttempt,
          });
        } catch (titleErr) {
          console.warn('Failed to update task title:', titleErr);
          // Still update with new attempt even if title update fails
          setMasterGenie({ ...masterGenie, attempt: newAttempt });
        }
      } else {
        // Update state with new attempt
        setMasterGenie({ ...masterGenie, attempt: newAttempt });
      }

      setInitialMessage('');
      setShowNewSessionDialog(false);
      setNewSessionTitle('');
    } catch (err) {
      console.error('Failed to create new session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create new session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle new session dialog confirmation
  const handleConfirmNewSession = () => {
    handleNewSession(newSessionTitle);
  };

  // Handle maximize to full view
  const handleMaximize = () => {
    if (!masterGenie?.attempt || !projectId) return;

    const url = `/projects/${projectId}/tasks/${masterGenie.task.id}/attempts/${masterGenie.attempt.id}?view=diffs`;
    window.location.href = url;
    onClose();
  };

  // Load history when dropdown opens
  const handleLoadHistory = async () => {
    if (!masterGenie?.task || !projectId) return;

    setIsLoadingHistory(true);
    try {
      // Fetch all attempts for this task
      const attempts = await subGenieApi.getTaskAttempts(projectId);
      const taskAttempts = attempts
        .filter((a) => a.task_id === masterGenie.task.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      setAllAttempts(taskAttempts);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Switch to a different attempt
  const handleSwitchAttempt = (attemptId: string) => {
    if (!masterGenie) return;

    const selectedAttempt = allAttempts.find((a) => a.id === attemptId);
    if (!selectedAttempt) return;

    setMasterGenie({ ...masterGenie, attempt: selectedAttempt });
  };

  // Format relative time for history display
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle export chat as markdown
  const handleExportChat = () => {
    if (!masterGenie?.attempt) return;

    const sessionTitle = masterGenie.task.title !== 'Master Genie'
      ? masterGenie.task.title
      : `Genie Session ${new Date().toLocaleDateString()}`;

    // Build markdown content with metadata
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const header = `# ${sessionTitle}\n\n**Exported**: ${formattedDate}\n**Executor**: ${masterGenie.attempt.executor}\n**Branch**: ${currentBranch || 'main'}\n**Session ID**: ${masterGenie.attempt.id}\n\n---\n\n`;

    const footer = '\n\n---\n\n*Exported from Automagik Forge - Genie Widget*\n';

    const content = header +
      '## Chat History\n\n' +
      '*Note: To view the full conversation history with all details, please open this session in the main application.*\n\n' +
      `You can access this session at: \`/projects/${projectId}/tasks/${masterGenie.task.id}/attempts/${masterGenie.attempt.id}?view=diffs\`\n` +
      footer;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = sessionTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'genie-chat';
    a.download = `${filename}-${now.toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle clear chat (create new session)
  const handleClearChat = () => {
    // Since we don't have an API to clear messages, we create a new session
    handleShowNewSessionDialog();
  };

  // Show change executor dialog
  const handleShowExecutorDialog = () => {
    if (!masterGenie?.attempt) return;

    // Set current executor as selected
    setSelectedExecutor({
      executor: masterGenie.attempt.executor as BaseCodingAgent,
      variant: activeTab === 'master' ? null : activeTab,
    });
    setShowExecutorDialog(true);
  };

  // Change executor for current session
  const handleChangeExecutor = async () => {
    if (!masterGenie?.attempt || !selectedExecutor || !projectId) return;

    setIsChangingExecutor(true);
    setError(null);

    try {
      // Create new attempt with new executor
      const newAttempt = await subGenieApi.createMasterGenieAttempt(
        masterGenie.task.id,
        currentBranch || 'main',
        selectedExecutor
      );

      // Update state with new attempt
      setMasterGenie({ ...masterGenie, attempt: newAttempt });
      setShowExecutorDialog(false);
    } catch (err) {
      console.error('Failed to change executor:', err);
      setError(err instanceof Error ? err.message : 'Failed to change executor');
    } finally {
      setIsChangingExecutor(false);
    }
  };

  // Show settings dialog
  const handleShowSettingsDialog = () => {
    setSelectedBranch(currentBranch); // Reset to current branch
    setShowSettingsDialog(true);
  };

  // Save settings (update default branch)
  const handleSaveSettings = () => {
    if (selectedBranch) {
      setCurrentBranch(selectedBranch);
    }
    setShowSettingsDialog(false);
  };

  // Delete current session and create new one (transparent to user)
  const handleDeleteSession = async () => {
    if (!masterGenie?.attempt || !projectId || allAttempts.length <= 1) return;

    setIsCreatingSession(true);
    setError(null);

    try {
      // Step 1: Create new session first
      const baseBranch = currentBranch || 'main';
      const executorProfile = config?.executor_profile || {
        executor: BaseCodingAgent.CLAUDE_CODE as BaseCodingAgent,
        variant: activeTab === 'master' ? null : activeTab,
      };

      const newAttempt = await subGenieApi.createMasterGenieAttempt(
        masterGenie.task.id,
        baseBranch,
        executorProfile
      );

      // Step 2: Switch to new attempt
      setMasterGenie({ ...masterGenie, attempt: newAttempt });
      setInitialMessage('');

      // Step 3: Delete the old attempt's draft (optional cleanup)
      try {
        await fetch(`/api/task-attempts/${masterGenie.attempt.id}/draft`, {
          method: 'DELETE',
        });
      } catch (draftErr) {
        console.warn('Failed to delete old draft:', draftErr);
        // Not critical - continue anyway
      }

      // Refresh history to show new attempt
      await handleLoadHistory();
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle sending the initial message (creates attempt)
  const handleSendInitialMessage = async () => {
    if (!masterGenie || !projectId || !initialMessage.trim()) return;

    // Get current branch (fallback to 'main' if not detected)
    const baseBranch = currentBranch || 'main';

    // Get user's executor profile (fallback to CLAUDE_CODE)
    const executorProfile = config?.executor_profile || {
      executor: BaseCodingAgent.CLAUDE_CODE as BaseCodingAgent,
      variant: null,
    };

    setIsSending(true);
    setError(null);

    try {
      // Create the task attempt with detected branch and user's executor
      const attempt = await subGenieApi.createMasterGenieAttempt(
        masterGenie.task.id,
        baseBranch,
        executorProfile
      );

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
          aria-label={t('genie.aria.open')}
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lamp className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-sm font-semibold">{t('genie.title')}</CardTitle>
          </div>

          {/* Action buttons - only show when Master Genie has an active attempt */}
          {masterGenie?.attempt && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowNewSessionDialog}
                disabled={isCreatingSession}
                className="h-7 w-7 p-0"
                title={t('genie.actions.newSession')}
              >
                {isCreatingSession ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SquarePlus className="h-4 w-4" />
                )}
              </Button>

              <DropdownMenu onOpenChange={(open) => open && handleLoadHistory()}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoadingHistory}
                    className="h-7 w-7 p-0"
                    title="History"
                  >
                    {isLoadingHistory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <History className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Session History</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allAttempts.length === 0 ? (
                    <DropdownMenuItem disabled>
                      <span className="text-muted-foreground text-sm">No previous sessions</span>
                    </DropdownMenuItem>
                  ) : (
                    allAttempts.map((attempt, idx) => {
                      const displayTitle = masterGenie.task.title &&
                                         masterGenie.task.title !== 'Master Genie'
                        ? masterGenie.task.title
                        : t('genie.history.session', { number: allAttempts.length - idx });

                      return (
                        <DropdownMenuItem
                          key={attempt.id}
                          onClick={() => handleSwitchAttempt(attempt.id)}
                          className={attempt.id === masterGenie.attempt?.id ? 'bg-accent' : ''}
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate max-w-[180px]">
                                {displayTitle}
                              </span>
                              {attempt.id === masterGenie.attempt?.id && (
                                <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                                  {t('genie.history.current')}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(attempt.created_at)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Options"
                  >
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShowExecutorDialog}>
                    🔧 {t('genie.actions.changeExecutor')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteSession}
                    disabled={allAttempts.length <= 1 || isCreatingSession}
                  >
                    🗑️ {t('genie.actions.deleteSession')}
                    {allAttempts.length <= 1 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t('genie.history.lastSession')}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShowSettingsDialog}>
                    ⚙️ {t('genie.actions.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportChat}>
                    📥 {t('genie.actions.exportChat')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearChat}>
                    🔄 {t('genie.actions.clearChat')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleMaximize}
                disabled={!masterGenie?.attempt}
                className="h-7 w-7 p-0"
                title="Open in Full View"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
            aria-label={t('genie.aria.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs - only show when Master Genie has an active attempt */}
        {masterGenie?.attempt && (
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => handleTabChange('master')}
              disabled={creatingNeuron !== null}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'master'
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t('genie.tabs.genie')}
            </button>
            <button
              onClick={() => handleTabChange('wish')}
              disabled={creatingNeuron !== null}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'wish'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${creatingNeuron === 'wish' ? 'opacity-50' : ''}`}
            >
              {creatingNeuron === 'wish' ? (
                <>
                  <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                  {t('genie.tabs.wish')}
                </>
              ) : (
                t('genie.tabs.wish')
              )}
            </button>
            <button
              onClick={() => handleTabChange('forge')}
              disabled={creatingNeuron !== null}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'forge'
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${creatingNeuron === 'forge' ? 'opacity-50' : ''}`}
            >
              {creatingNeuron === 'forge' ? (
                <>
                  <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                  {t('genie.tabs.forge')}
                </>
              ) : (
                t('genie.tabs.forge')
              )}
            </button>
            <button
              onClick={() => handleTabChange('review')}
              disabled={creatingNeuron !== null}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${creatingNeuron === 'review' ? 'opacity-50' : ''}`}
            >
              {creatingNeuron === 'review' ? (
                <>
                  <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                  {t('genie.tabs.review')}
                </>
              ) : (
                t('genie.tabs.review')
              )}
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-muted-foreground">{t('genie.states.loading')}</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-destructive">
              <p className="font-semibold">{t('genie.messages.errorLoading')}</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        ) : !masterGenie ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <Lamp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold">{t('genie.messages.noGenieAvailable')}</p>
              <p className="text-sm mt-1">{t('genie.messages.selectProjectToActivate')}</p>
            </div>
          </div>
        ) : !masterGenie.attempt ? (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 flex flex-col items-center justify-center">
              <Lamp className="h-12 w-12 mb-3 text-blue-500" />
              <p className="font-semibold text-lg text-center">{t('genie.states.ready')}</p>
              <p className="text-sm mt-2 text-center text-muted-foreground">
                {t('genie.messages.sendMessageToStart')}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Textarea
                value={initialMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setInitialMessage(e.target.value)
                }
                placeholder={t('genie.messages.placeholder')}
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
                    {t('genie.states.starting')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('buttons.send')}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Render Master Genie tab */}
            {activeTab === 'master' && (() => {
              // Show empty state with chat input when master genie has no attempt
              if (!masterGenie.attempt) {
                return (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                      <Lamp className="h-12 w-12 mb-3 text-blue-500" />
                      <p className="font-semibold text-lg text-center">{t('genie.title')}</p>
                      <p className="text-sm mt-2 text-center text-muted-foreground">
                        {t('genie.description')}
                      </p>
                      <p className="text-xs mt-2 text-center text-muted-foreground">
                        {t('genie.messages.sendMessageToStart')}
                      </p>
                    </div>

                    {/* Chat input for starting master genie */}
                    <div className="shrink-0 border-t p-4">
                      <div className="flex gap-2">
                        <Textarea
                          value={initialMessage}
                          onChange={(e) => setInitialMessage(e.target.value)}
                          placeholder={t('genie.messages.enterMessage')}
                          className="flex-1 min-h-[60px] resize-none"
                          disabled={isSending}
                        />
                        <Button
                          size="icon"
                          onClick={async () => {
                            if (!initialMessage.trim() || !currentBranch || !config) return;

                            setIsSending(true);
                            try {
                              // Create attempt for master genie
                              const attempt = await subGenieApi.createMasterGenieAttempt(
                                masterGenie.task.id,
                                currentBranch,
                                {
                                  executor: config.executor as BaseCodingAgent,
                                  variant: null,
                                }
                              );

                              // Send the initial message as follow-up
                              await subGenieApi.sendFollowUp(attempt.id, initialMessage);

                              // Update master genie with new attempt
                              setMasterGenie({ task: masterGenie.task, attempt });

                              setInitialMessage('');
                            } catch (err) {
                              console.error('Failed to start master genie:', err);
                              setError(err instanceof Error ? err.message : 'Failed to start master genie');
                            } finally {
                              setIsSending(false);
                            }
                          }}
                          disabled={!initialMessage.trim() || isSending}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
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
              );
            })()}

            {/* Render Wish neuron tab */}
            {activeTab === 'wish' && (() => {
              const wishNeuron = neurons.find((n) => n.type === 'wish');

              // Show loading state while neuron is being created
              if (!wishNeuron) {
                return (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-purple-500" />
                      <p className="font-semibold">
                        {t('genie.states.loadingNeuron', { neuron: t('genie.neurons.wish.name') })}
                      </p>
                      <p className="text-xs mt-1">{t('genie.neurons.wish.description')}</p>
                    </div>
                  </div>
                );
              }

              // Show empty state with chat input when neuron exists but has no attempt
              if (!wishNeuron.attempt) {
                return (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                      <Lamp className="h-12 w-12 mb-3 text-purple-500" />
                      <p className="font-semibold text-lg text-center">{t('genie.neurons.wish.name')}</p>
                      <p className="text-sm mt-2 text-center text-muted-foreground">
                        {t('genie.neurons.wish.description')}
                      </p>
                      <p className="text-xs mt-2 text-center text-muted-foreground">
                        {t('genie.messages.sendMessageToStart')}
                      </p>
                    </div>

                    {/* Chat input for starting neuron */}
                    <div className="shrink-0 border-t p-4">
                      <div className="flex gap-2">
                        <Textarea
                          value={initialMessage}
                          onChange={(e) => setInitialMessage(e.target.value)}
                          placeholder={t('genie.messages.enterMessage')}
                          className="flex-1 min-h-[60px] resize-none"
                          disabled={isSending || creatingNeuron === 'wish'}
                        />
                        <Button
                          size="icon"
                          onClick={async () => {
                            if (!initialMessage.trim() || !currentBranch || !config) return;

                            setIsSending(true);
                            try {
                              // Create attempt for this neuron
                              const attempt = await subGenieApi.createMasterGenieAttempt(
                                wishNeuron.task.id,
                                currentBranch,
                                {
                                  executor: config.executor as BaseCodingAgent,
                                  variant: 'wish',
                                }
                              );

                              // Send the initial message as follow-up
                              await subGenieApi.sendFollowUp(attempt.id, initialMessage);

                              // Refresh neurons to get the new attempt
                              if (masterGenie?.attempt) {
                                const updatedNeurons = await subGenieApi.getNeurons(masterGenie.attempt.id);
                                setNeurons(updatedNeurons);
                              }

                              setInitialMessage('');
                            } catch (err) {
                              console.error('Failed to start wish neuron:', err);
                              setError(err instanceof Error ? err.message : 'Failed to start wish neuron');
                            } finally {
                              setIsSending(false);
                            }
                          }}
                          disabled={!initialMessage.trim() || isSending || creatingNeuron === 'wish'}
                        >
                          {isSending || creatingNeuron === 'wish' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              const wishTaskWithStatus: TaskWithAttemptStatus = {
                ...wishNeuron.task,
                has_in_progress_attempt: !!wishNeuron.attempt,
                has_merged_attempt: false,
                last_attempt_failed: false,
                executor: wishNeuron.attempt?.executor || '',
              };

              return (
                <ClickedElementsProvider attempt={wishNeuron.attempt}>
                  <ReviewProvider key={wishNeuron.attempt.id}>
                    <ExecutionProcessesProvider
                      key={wishNeuron.attempt.id}
                      attemptId={wishNeuron.attempt.id}
                    >
                      <EntriesProvider key={wishNeuron.attempt.id}>
                        <RetryUiProvider attemptId={wishNeuron.attempt.id}>
                          {/* Logs area */}
                          <div className="flex-1 min-h-0 overflow-auto">
                            <VirtualizedList
                              key={wishNeuron.attempt.id}
                              attempt={wishNeuron.attempt}
                            />
                          </div>

                          {/* Chat input area */}
                          <div className="shrink-0 border-t">
                            <TaskFollowUpSection
                              task={wishTaskWithStatus}
                              selectedAttemptId={wishNeuron.attempt.id}
                              jumpToLogsTab={() => {}}
                            />
                          </div>
                        </RetryUiProvider>
                      </EntriesProvider>
                    </ExecutionProcessesProvider>
                  </ReviewProvider>
                </ClickedElementsProvider>
              );
            })()}

            {/* Render Forge neuron tab */}
            {activeTab === 'forge' && (() => {
              const forgeNeuron = neurons.find((n) => n.type === 'forge');

              // Show loading state while neuron is being created
              if (!forgeNeuron) {
                return (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-orange-500" />
                      <p className="font-semibold">
                        {t('genie.states.loadingNeuron', { neuron: t('genie.neurons.forge.name') })}
                      </p>
                      <p className="text-xs mt-1">{t('genie.neurons.forge.description')}</p>
                    </div>
                  </div>
                );
              }

              // Show empty state with chat input when neuron exists but has no attempt
              if (!forgeNeuron.attempt) {
                return (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                      <Lamp className="h-12 w-12 mb-3 text-orange-500" />
                      <p className="font-semibold text-lg text-center">{t('genie.neurons.forge.name')}</p>
                      <p className="text-sm mt-2 text-center text-muted-foreground">
                        {t('genie.neurons.forge.description')}
                      </p>
                      <p className="text-xs mt-2 text-center text-muted-foreground">
                        {t('genie.messages.sendMessageToStart')}
                      </p>
                    </div>

                    {/* Chat input for starting neuron */}
                    <div className="shrink-0 border-t p-4">
                      <div className="flex gap-2">
                        <Textarea
                          value={initialMessage}
                          onChange={(e) => setInitialMessage(e.target.value)}
                          placeholder={t('genie.messages.enterMessage')}
                          className="flex-1 min-h-[60px] resize-none"
                          disabled={isSending || creatingNeuron === 'forge'}
                        />
                        <Button
                          size="icon"
                          onClick={async () => {
                            if (!initialMessage.trim() || !currentBranch || !config) return;

                            setIsSending(true);
                            try {
                              // Create attempt for this neuron
                              const attempt = await subGenieApi.createMasterGenieAttempt(
                                forgeNeuron.task.id,
                                currentBranch,
                                {
                                  executor: config.executor as BaseCodingAgent,
                                  variant: 'forge',
                                }
                              );

                              // Send the initial message as follow-up
                              await subGenieApi.sendFollowUp(attempt.id, initialMessage);

                              // Refresh neurons to get the new attempt
                              if (masterGenie?.attempt) {
                                const updatedNeurons = await subGenieApi.getNeurons(masterGenie.attempt.id);
                                setNeurons(updatedNeurons);
                              }

                              setInitialMessage('');
                            } catch (err) {
                              console.error('Failed to start forge neuron:', err);
                              setError(err instanceof Error ? err.message : 'Failed to start forge neuron');
                            } finally {
                              setIsSending(false);
                            }
                          }}
                          disabled={!initialMessage.trim() || isSending || creatingNeuron === 'forge'}
                        >
                          {isSending || creatingNeuron === 'forge' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              const forgeTaskWithStatus: TaskWithAttemptStatus = {
                ...forgeNeuron.task,
                has_in_progress_attempt: !!forgeNeuron.attempt,
                has_merged_attempt: false,
                last_attempt_failed: false,
                executor: forgeNeuron.attempt?.executor || '',
              };

              return (
                <ClickedElementsProvider attempt={forgeNeuron.attempt}>
                  <ReviewProvider key={forgeNeuron.attempt.id}>
                    <ExecutionProcessesProvider
                      key={forgeNeuron.attempt.id}
                      attemptId={forgeNeuron.attempt.id}
                    >
                      <EntriesProvider key={forgeNeuron.attempt.id}>
                        <RetryUiProvider attemptId={forgeNeuron.attempt.id}>
                          {/* Logs area */}
                          <div className="flex-1 min-h-0 overflow-auto">
                            <VirtualizedList
                              key={forgeNeuron.attempt.id}
                              attempt={forgeNeuron.attempt}
                            />
                          </div>

                          {/* Chat input area */}
                          <div className="shrink-0 border-t">
                            <TaskFollowUpSection
                              task={forgeTaskWithStatus}
                              selectedAttemptId={forgeNeuron.attempt.id}
                              jumpToLogsTab={() => {}}
                            />
                          </div>
                        </RetryUiProvider>
                      </EntriesProvider>
                    </ExecutionProcessesProvider>
                  </ReviewProvider>
                </ClickedElementsProvider>
              );
            })()}

            {/* Render Review neuron tab */}
            {activeTab === 'review' && (() => {
              const reviewNeuron = neurons.find((n) => n.type === 'review');

              // Show loading state while neuron is being created
              if (!reviewNeuron) {
                return (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-600" />
                      <p className="font-semibold">
                        {t('genie.states.loadingNeuron', { neuron: t('genie.neurons.review.name') })}
                      </p>
                      <p className="text-xs mt-1">{t('genie.neurons.review.description')}</p>
                    </div>
                  </div>
                );
              }

              // Show empty state when neuron exists but has no attempt
              if (!reviewNeuron.attempt) {
                return (
                  <div className="flex-1 flex flex-col p-4">
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <Lamp className="h-12 w-12 mb-3 text-blue-600" />
                      <p className="font-semibold text-lg text-center">{t('genie.neurons.review.name')}</p>
                      <p className="text-sm mt-2 text-center text-muted-foreground">
                        {t('genie.neurons.review.description')}
                      </p>
                      <p className="text-xs mt-2 text-center text-muted-foreground">
                        {t('genie.messages.sendMessageToStart')}
                      </p>
                    </div>
                  </div>
                );
              }

              const reviewTaskWithStatus: TaskWithAttemptStatus = {
                ...reviewNeuron.task,
                has_in_progress_attempt: !!reviewNeuron.attempt,
                has_merged_attempt: false,
                last_attempt_failed: false,
                executor: reviewNeuron.attempt?.executor || '',
              };

              return (
                <ClickedElementsProvider attempt={reviewNeuron.attempt}>
                  <ReviewProvider key={reviewNeuron.attempt.id}>
                    <ExecutionProcessesProvider
                      key={reviewNeuron.attempt.id}
                      attemptId={reviewNeuron.attempt.id}
                    >
                      <EntriesProvider key={reviewNeuron.attempt.id}>
                        <RetryUiProvider attemptId={reviewNeuron.attempt.id}>
                          {/* Logs area */}
                          <div className="flex-1 min-h-0 overflow-auto">
                            <VirtualizedList
                              key={reviewNeuron.attempt.id}
                              attempt={reviewNeuron.attempt}
                            />
                          </div>

                          {/* Chat input area */}
                          <div className="shrink-0 border-t">
                            <TaskFollowUpSection
                              task={reviewTaskWithStatus}
                              selectedAttemptId={reviewNeuron.attempt.id}
                              jumpToLogsTab={() => {}}
                            />
                          </div>
                        </RetryUiProvider>
                      </EntriesProvider>
                    </ExecutionProcessesProvider>
                  </ReviewProvider>
                </ClickedElementsProvider>
              );
            })()}
          </>
        )}
      </CardContent>

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('genie.newSession.title')}</DialogTitle>
            <DialogDescription>
              {t('genie.newSession.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('genie.newSession.placeholder')}
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreatingSession) {
                  handleConfirmNewSession();
                }
              }}
              disabled={isCreatingSession}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewSessionDialog(false)}
              disabled={isCreatingSession}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              onClick={handleConfirmNewSession}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('states.loading')}
                </>
              ) : (
                t('genie.newSession.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Executor Dialog */}
      <Dialog open={showExecutorDialog} onOpenChange={setShowExecutorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('genie.changeExecutor.title')}</DialogTitle>
            <DialogDescription>
              {t('genie.changeExecutor.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedExecutor && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Executor
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={isChangingExecutor}
                    >
                      {selectedExecutor.executor}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {Object.values(BaseCodingAgent).map((executor) => (
                      <DropdownMenuItem
                        key={executor}
                        onClick={() => setSelectedExecutor({
                          executor,
                          variant: activeTab === 'master' ? null : activeTab
                        })}
                      >
                        {executor}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-muted-foreground">
                  Profile: <span className="font-medium">{activeTab === 'master' ? 'default' : activeTab}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExecutorDialog(false)}
              disabled={isChangingExecutor}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              onClick={handleChangeExecutor}
              disabled={isChangingExecutor}
            >
              {isChangingExecutor ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('states.loading')}
                </>
              ) : (
                t('genie.changeExecutor.confirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('genie.settings.title')}</DialogTitle>
            <DialogDescription>
              {t('genie.settings.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('genie.settings.branchLabel')}
                </label>
                {branches.length > 0 && selectedBranch && (
                  <BranchSelector
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onBranchSelect={setSelectedBranch}
                    placeholder={t('branchSelector.placeholder')}
                  />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
            >
              {t('buttons.cancel')}
            </Button>
            <Button onClick={handleSaveSettings}>
              {t('genie.settings.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
