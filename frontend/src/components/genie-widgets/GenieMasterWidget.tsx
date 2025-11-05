import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lamp } from '@/components/icons/Lamp';
import { useProject } from '@/contexts/project-context';
import { useUserSystem } from '@/components/config-provider';
import { subGenieApi } from '@/services/subGenieApi';
import { BaseCodingAgent } from 'shared/types';
import { Loader2 } from 'lucide-react';

interface GenieMasterWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * GenieMasterWidget - Minimalistic lamp button that opens Master Genie chat
 *
 * Architecture:
 * - Each project has ONE Master Genie task (agent_type='master')
 * - Master Genie runs on current branch WITHOUT worktree (use_worktree=false)
 * - Clicking the lamp navigates to the full chat view
 * - Chat view URL: /projects/{projectId}/tasks/{taskId}/attempts/{attemptId}?view=chat
 */
export const GenieMasterWidget: React.FC<GenieMasterWidgetProps> = () => {
  const navigate = useNavigate();
  const { projectId } = useProject();
  const { config } = useUserSystem();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ESC key listener to hide button when hovering
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isHovering) {
        setIsHovering(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isHovering]);

  /**
   * Opens Master Genie chat view
   *
   * Flow:
   * 1. Ensure Master Genie task exists (or create it)
   * 2. Navigate to task with chat view (attempt will be created on first message)
   */
  const handleOpenChat = async () => {
    if (!projectId || !config) return;

    setIsLoading(true);

    try {
      // Step 1: Ensure Master Genie task exists
      const { task, attempt: existingAttempt } = await subGenieApi.ensureMasterGenie(projectId);

      // Step 2: Get current branch for attempt creation
      let currentBranch = 'main';
      try {
        const branchResponse = await fetch(`/api/projects/${projectId}/git/status`);
        if (branchResponse.ok && branchResponse.headers.get('content-type')?.includes('application/json')) {
          const { data } = await branchResponse.json();
          currentBranch = data?.current_branch || 'main';
        }
      } catch (error) {
        console.warn('Failed to get current branch, using default:', error);
      }

      // Step 3: Create attempt if it doesn't exist
      let attemptToUse = existingAttempt;
      if (!attemptToUse) {
        const executorProfile = config.executor_profile || {
          executor: BaseCodingAgent.CLAUDE_CODE,
          variant: null,
        };
        attemptToUse = await subGenieApi.createMasterGenieAttempt(
          task.id,
          currentBranch,
          { ...executorProfile, variant: 'MASTER' }
        );
      }

      // Step 4: Navigate to chat view with attempt
      navigate(`/projects/${projectId}/tasks/${task.id}/attempts/${attemptToUse.id}?view=chat`);
    } catch (error) {
      console.error('Failed to open Master Genie:', error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not in a project context
  if (!projectId) {
    return null;
  }

  // Lamp button - hidden at edge, slides in on hover from right
  return (
    <div
      className="fixed z-50 transition-all duration-300"
      style={{
        bottom: '46px', // 30px up from bottom-4
        right: isHovering ? '20px' : '-20px',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <button
        onClick={isLoading ? undefined : handleOpenChat}
        disabled={isLoading}
        className="p-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Open Master Genie"
        title="Master Genie - AI Assistant"
      >
        {isLoading ? (
          <Loader2 className="h-10 w-10 text-foreground drop-shadow-lg animate-spin" />
        ) : (
          <Lamp className="h-10 w-10 text-foreground drop-shadow-lg" />
        )}
      </button>
    </div>
  );
};
