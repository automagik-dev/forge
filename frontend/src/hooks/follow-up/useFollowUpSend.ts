import { useCallback, useState } from 'react';
import { attemptsApi } from '@/lib/api';
import type { ImageResponse, TaskWithAttemptStatus, ExecutorProfileId } from 'shared/types';

type Args = {
  attemptId?: string;
  task?: TaskWithAttemptStatus | null;
  currentProfile?: Record<string, any> | null;
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
};

export function useFollowUpSend({
  attemptId,
  task,
  currentProfile,
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
}: Args) {
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const onSendFollowUp = useCallback(async () => {
    if (!attemptId) return;

    // Detect if we're sending to an agent task without an attempt
    // In this case, attemptId is actually the task ID
    const isAgentTaskWithoutAttempt =
      task && attemptId === task.id && task.status === 'agent';

    let actualAttemptId = attemptId;

    // If this is an agent task without an attempt, create the attempt first
    if (isAgentTaskWithoutAttempt) {
      if (!currentProfile || Object.keys(currentProfile).length === 0) {
        setFollowUpError(
          'Cannot create attempt: No executor profile available'
        );
        return;
      }

      // Get the first available profile variant
      const firstVariantKey = Object.keys(currentProfile)[0];
      const executorProfileId = currentProfile[firstVariantKey];

      try {
        console.log('[Master Genie] Creating attempt before sending follow-up', {
          task_id: task.id,
          executor_profile_id: executorProfileId,
        });

        const newAttempt = await attemptsApi.create({
          task_id: task.id,
          executor_profile_id: executorProfileId as ExecutorProfileId,
          base_branch: 'HEAD', // Use HEAD to represent current branch
          use_worktree: false, // Master Genie runs without worktree
        });

        actualAttemptId = newAttempt.id;
        console.log('[Master Genie] Attempt created:', newAttempt.id);
      } catch (error: unknown) {
        const err = error as { message?: string };
        setFollowUpError(
          `Failed to create attempt: ${err.message ?? 'Unknown error'}`
        );
        setIsSendingFollowUp(false);
        return;
      }
    }

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
  ]);

  return {
    isSendingFollowUp,
    followUpError,
    setFollowUpError,
    onSendFollowUp,
  } as const;
}
