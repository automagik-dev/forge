import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lamp } from '@/components/icons/Lamp';
import { useProject } from '@/contexts/project-context';
import { subGenieApi } from '@/services/subGenieApi';
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
   * 2. Navigate to chat view (with existing attempt if available)
   * 3. ChatPanel will create new attempt on first message if none exists
   */
  const handleOpenChat = async () => {
    if (!projectId || isLoading) return;

    setIsLoading(true);

    try {
      // Step 1: Ensure Master Genie task exists
      const { task, attempt: existingAttempt } =
        await subGenieApi.ensureMasterGenie(projectId);

      // Step 2: Navigate to chat view
      // If existing attempt, navigate to it; otherwise navigate to task and let ChatPanel create attempt on first message
      if (existingAttempt) {
        navigate(
          `/projects/${projectId}/tasks/${task.id}/attempts/${existingAttempt.id}?view=chat`
        );
      } else {
        navigate(`/projects/${projectId}/tasks/${task.id}?view=chat`);
      }
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
  // Fixed hover zone prevents flicker when lamp slides in
  return (
    <div
      className="fixed z-50"
      style={{
        bottom: '46px', // 30px up from bottom-4
        right: 0,
        width: '80px', // Stable hover detection zone
        height: '60px',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="absolute transition-all duration-300"
        style={{
          right: isHovering ? '20px' : '-20px',
          top: 0,
        }}
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
            <Lamp className="h-10 w-10 text-zinc-700 dark:text-foreground drop-shadow-lg" />
          )}
        </button>
      </div>
    </div>
  );
};
