import { useCallback, useState } from 'react';
import { attemptsApi, tasksApi } from '@/lib/api';
import type { ImageResponse, TaskWithAttemptStatus, ExecutorProfileId } from 'shared/types';

type Args = {
  attemptId?: string;
  task?: TaskWithAttemptStatus | null;
  currentProfile?: Record<string, any> | null;
  defaultExecutor?: string; // User's configured default executor (e.g., "CLAUDE_CODE")
  defaultBranch?: string | null; // User's configured default base branch
  message: string;
  conflictMarkdown: string | null;
  reviewMarkdown: string;
  clickedMarkdown?: string;
  selectedVariant: string | null;
  images: ImageResponse[];
  newlyUploadedImageIds: string[];
  clearComments: () => void;
  clearClickedElements?: () => void;
  jumpToLogsTab: () => void;
  onAfterSendCleanup: () => void;
  setMessage: (v: string) => void;
  projectId?: string; // For create-and-start when no attempt exists
  onNewTaskCreated?: (taskId: string, attemptId: string) => void; // Callback for navigation
};

export function useFollowUpSend({
  attemptId,
  task,
  currentProfile,
  defaultExecutor,
  defaultBranch,
  message,
  conflictMarkdown,
  reviewMarkdown,
  clickedMarkdown,
  selectedVariant,
  images,
  newlyUploadedImageIds,
  clearComments,
  clearClickedElements,
  jumpToLogsTab,
  onAfterSendCleanup,
  setMessage,
  projectId,
  onNewTaskCreated,
}: Args) {
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const onSendFollowUp = useCallback(async () => {
    console.log('[Master Genie] onSendFollowUp called with:', {
      attemptId,
      task_id: task?.id,
      task_status: task?.status,
      projectId,
      currentProfile,
    });

    // Detect if we're sending first message to Master Genie (no attempt exists)
    // We have projectId from URL, no attemptId, and task might still be loading
    // If task is loaded and has status='agent', OR if task is null but we have projectId (still loading),
    // treat this as first Genie message
    const isFirstGenieMessage =
      !attemptId && projectId && (!task || task.status === 'agent');

    console.log('[Master Genie] isFirstGenieMessage:', isFirstGenieMessage);

    let actualAttemptId = attemptId;

    // If this is first message to Genie, use create-and-start
    if (isFirstGenieMessage) {
      if (!currentProfile || Object.keys(currentProfile).length === 0) {
        setFollowUpError(
          'Cannot start Master Genie: No executor profile available'
        );
        return;
      }

      // For agent tasks, use the user's configured default executor
      const executorProfileId = {
        executor: defaultExecutor || 'CLAUDE_CODE', // Use configured default, fallback to CLAUDE_CODE
        variant: selectedVariant,
      };

      // Prepare the message content
      const extraMessage = message.trim();
      const firstMessage = [
        conflictMarkdown,
        clickedMarkdown?.trim(),
        reviewMarkdown?.trim(),
        extraMessage,
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!firstMessage) return;

      try {
        setIsSendingFollowUp(true);
        setFollowUpError(null);

        console.log('[Master Genie] Creating new task with create-and-start', {
          project_id: projectId,
          executor_profile_id: executorProfileId,
        });

        // Create task + attempt with user's first message
        const result = await tasksApi.createAndStart({
          task: {
            project_id: projectId,
            title: `Chat: ${firstMessage.substring(0, 50)}${firstMessage.length > 50 ? '...' : ''}`,
            description: firstMessage, // User's message goes here!
          },
          executor_profile_id: executorProfileId as ExecutorProfileId,
          base_branch: defaultBranch || 'dev', // Use configured default, fallback to 'dev'
          use_worktree: false, // CRITICAL: Genie uses current branch!
        } as any);

        console.log('[Master Genie] Task created:', result.id);

        // Get the attempt ID from the result
        // The API returns TaskWithAttemptStatus which has has_in_progress_attempt
        // We need to fetch the actual attempt
        const attempts = await attemptsApi.getAll(result.id);
        if (attempts.length > 0) {
          actualAttemptId = attempts[0].id;
          console.log('[Master Genie] Attempt ID:', actualAttemptId);

          // Notify parent component for navigation
          if (onNewTaskCreated) {
            onNewTaskCreated(result.id, actualAttemptId);
          }

          // Clean up UI
          setMessage('');
          clearComments();
          clearClickedElements?.();
          onAfterSendCleanup();
          jumpToLogsTab();
        }

        setIsSendingFollowUp(false);
        return; // Done!
      } catch (error: unknown) {
        const err = error as { message?: string };
        setFollowUpError(
          `Failed to start Master Genie: ${err.message ?? 'Unknown error'}`
        );
        setIsSendingFollowUp(false);
        return;
      }
    }

    // Normal follow-up flow (attempt exists)
    if (!actualAttemptId) return;

    const extraMessage = message.trim();
    const finalPrompt = [
      conflictMarkdown,
      clickedMarkdown?.trim(),
      reviewMarkdown?.trim(),
      extraMessage,
    ]
      .filter(Boolean)
      .join('\n\n');
    if (!finalPrompt) return;
    try {
      setIsSendingFollowUp(true);
      setFollowUpError(null);
      const image_ids =
        newlyUploadedImageIds.length > 0
          ? newlyUploadedImageIds
          : images.length > 0
            ? images.map((img) => img.id)
            : null;
      await attemptsApi.followUp(actualAttemptId, {
        prompt: finalPrompt,
        variant: selectedVariant,
        image_ids,
        retry_process_id: null,
        force_when_dirty: null,
        perform_git_reset: null,
      } as any);
      setMessage('');
      clearComments();
      clearClickedElements?.();
      onAfterSendCleanup();
      jumpToLogsTab();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setFollowUpError(
        `Failed to start follow-up execution: ${err.message ?? 'Unknown error'}`
      );
    } finally {
      setIsSendingFollowUp(false);
    }
  }, [
    attemptId,
    task,
    currentProfile,
    defaultExecutor,
    message,
    conflictMarkdown,
    reviewMarkdown,
    clickedMarkdown,
    newlyUploadedImageIds,
    images,
    selectedVariant,
    clearComments,
    clearClickedElements,
    jumpToLogsTab,
    onAfterSendCleanup,
    setMessage,
    projectId,
    onNewTaskCreated,
  ]);

  return {
    isSendingFollowUp,
    followUpError,
    setFollowUpError,
    onSendFollowUp,
  } as const;
}
