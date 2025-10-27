import { useCallback, useState } from 'react';
import { useSubGenie } from '@/context/SubGenieContext';
import { ChatMessage } from '@/components/genie-widgets';
import { subGenieApi, Neuron } from '@/services/subGenieApi';
import { Task } from 'shared/types';

/**
 * Hook for managing Genie widget state and API interactions.
 *
 * Handles workflow execution, chat messages, and skill toggling.
 * Integrates with backend task/attempt API.
 *
 * @param genieId - Widget identifier (wish, forge, review)
 * @param projectId - Current project UUID
 * @param columnStatus - Column status (for backward compatibility)
 * @returns Widget state and handlers
 */
export const useSubGenieWidget = (
  genieId: 'wish' | 'forge' | 'review',
  projectId: string,
  columnStatus?: string
) => {
  const { widgets, toggleWidget, closeWidget, addMessage, toggleSkill } =
    useSubGenie();
  const [isLoading, setIsLoading] = useState(false);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeNeuron, setActiveNeuron] = useState<Neuron | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [masterAttemptId, setMasterAttemptId] = useState<string | null>(null);

  /**
   * Executes a workflow by creating a task and starting a task attempt.
   * The task will be created with status="agent" and the appropriate variant.
   */
  const handleWorkflowClick = useCallback(
    async (workflowId: string, description?: string) => {
      setIsLoading(true);
      try {
        // Create task and start attempt with variant
        const result = await subGenieApi.executeWorkflow(
          genieId,
          workflowId,
          projectId,
          description || `Executing ${workflowId} workflow`
        );

        // Store attempt ID for follow-ups
        setActiveAttemptId(result.attemptId);

        // Add confirmation message
        addMessage(genieId, {
          id: `msg-${Date.now()}`,
          sender: genieId,
          content: `Started workflow "${workflowId}". Task ID: ${result.task.id.slice(0, 8)}...`,
          timestamp: new Date().toISOString(),
          metadata: {
            workflowId,
            taskId: result.task.id,
            attemptId: result.attemptId,
            status: 'started',
          },
        });
      } catch (error) {
        console.error('Error executing workflow:', error);

        // Add error message
        addMessage(genieId, {
          id: `msg-${Date.now()}`,
          sender: genieId,
          content: `Failed to start workflow "${workflowId}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          metadata: { workflowId, status: 'error' },
        });
      } finally {
        setIsLoading(false);
      }
    },
    [genieId, projectId, addMessage]
  );

  /**
   * Sends a message as a follow-up to the active task attempt,
   * or shows an error if no active attempt exists.
   */
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Add user message
      addMessage(genieId, {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      if (!activeAttemptId) {
        // No active attempt - show helper message
        addMessage(genieId, {
          id: `msg-${Date.now() + 1}`,
          sender: genieId,
          content:
            'No active task attempt. Please start a workflow first, or use the workflow buttons above.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Send follow-up to active attempt
      setIsLoading(true);
      try {
        await subGenieApi.sendFollowUp(activeAttemptId, message);

        // Add confirmation message
        addMessage(genieId, {
          id: `msg-${Date.now() + 1}`,
          sender: genieId,
          content: `Follow-up sent to task attempt ${activeAttemptId.slice(0, 8)}...`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error sending follow-up:', error);

        // Add error message
        addMessage(genieId, {
          id: `msg-${Date.now() + 1}`,
          sender: genieId,
          content: `Failed to send follow-up: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [genieId, activeAttemptId, addMessage]
  );

  /**
   * Toggles a skill on/off.
   * Note: Skill toggling is not yet fully implemented in the backend.
   */
  const handleSkillToggle = useCallback(
    async (skillId: string, enabled: boolean) => {
      try {
        await subGenieApi.toggleSkill(genieId, skillId, enabled);
        toggleSkill(genieId, skillId, enabled);

        addMessage(genieId, {
          id: `msg-${Date.now()}`,
          sender: genieId,
          content: `Skill "${skillId}" ${enabled ? 'enabled' : 'disabled'}.`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error toggling skill:', error);
      }
    },
    [genieId, toggleSkill, addMessage]
  );

  /**
   * Refreshes neuron data from the backend.
   *
   * Fetches the neuron for this widget's type and its subtasks.
   * Requires a master attempt ID to know which Master Genie to query.
   *
   * @param masterAttemptId - Master Genie attempt UUID (optional)
   */
  const refreshNeuronData = useCallback(
    async (masterAttemptId?: string) => {
      if (!masterAttemptId) return;

      try {
        // Fetch all neurons for this Master Genie
        const neurons = await subGenieApi.getNeurons(masterAttemptId);

        // Find the neuron matching this widget's type
        const neuron = neurons.find((n) => n.type === genieId);
        setActiveNeuron(neuron || null);

        // If neuron exists, fetch its subtasks
        if (neuron?.attempt) {
          const tasks = await subGenieApi.getSubtasks(neuron.attempt.id);
          setSubtasks(tasks);
        } else {
          setSubtasks([]);
        }
      } catch (error) {
        console.error('Error refreshing neuron data:', error);
        setActiveNeuron(null);
        setSubtasks([]);
      }
    },
    [genieId]
  );

  /**
   * Wrapper function that calls refreshNeuronData with stored masterAttemptId.
   */
  const handleRefresh = useCallback(async () => {
    if (masterAttemptId) {
      await refreshNeuronData(masterAttemptId);
    }
  }, [masterAttemptId, refreshNeuronData]);

  return {
    isOpen: widgets[genieId].isOpen,
    chatHistory: widgets[genieId].chatHistory,
    skillsState: widgets[genieId].skillsEnabled,
    isLoading,
    activeAttemptId,
    activeNeuron,
    subtasks,
    refreshNeuronData: handleRefresh,
    setMasterAttemptId, // Expose for setting master attempt ID
    toggleWidget: () => toggleWidget(genieId),
    closeWidget: () => closeWidget(genieId),
    onSendMessage: handleSendMessage,
    onWorkflowClick: handleWorkflowClick,
    onSkillToggle: handleSkillToggle,
  };
};
