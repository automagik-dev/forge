import { useCallback, useState } from 'react';
import { useSubGenie } from '@/context/SubGenieContext';
import { ChatMessage } from '@/components/genie-widgets';
import { subGenieApi } from '@/services/subGenieApi';

export const useSubGenieWidget = (
  genieId: 'wishh' | 'forge' | 'review',
  columnStatus: string
) => {
  const { widgets, toggleWidget, closeWidget, addMessage, toggleSkill } =
    useSubGenie();
  const [isLoading, setIsLoading] = useState(false);

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

      // Send to API
      setIsLoading(true);
      try {
        const result = await subGenieApi.sendMessage(
          genieId,
          message,
          columnStatus
        );

        // Add response
        addMessage(genieId, {
          id: `msg-${Date.now() + 1}`,
          sender: genieId,
          content: result.response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [genieId, columnStatus, addMessage]
  );

  const handleWorkflowClick = useCallback(
    async (workflowId: string) => {
      setIsLoading(true);
      try {
        const result = await subGenieApi.triggerWorkflow(
          genieId,
          workflowId,
          columnStatus
        );

        addMessage(genieId, {
          id: `msg-${Date.now()}`,
          sender: genieId,
          content: `Workflow "${workflowId}" ${result.status}. ${
            result.result ? result.result : ''
          }`,
          timestamp: new Date().toISOString(),
          metadata: { workflowId, status: result.status as any },
        });
      } catch (error) {
        console.error('Error triggering workflow:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [genieId, columnStatus, addMessage]
  );

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

  return {
    isOpen: widgets[genieId].isOpen,
    chatHistory: widgets[genieId].chatHistory,
    skillsState: widgets[genieId].skillsEnabled,
    isLoading,
    toggleWidget: () => toggleWidget(genieId),
    closeWidget: () => closeWidget(genieId),
    onSendMessage: handleSendMessage,
    onWorkflowClick: handleWorkflowClick,
    onSkillToggle: handleSkillToggle,
  };
};
