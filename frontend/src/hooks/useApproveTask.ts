import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, attemptsApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface ApproveTaskParams {
  taskId: string;
  attemptId: string;
  shouldMerge: boolean;
  projectId: string;
  title: string;
  description: string | null;
  parentTaskAttempt: string | null;
}

interface ApproveTaskError {
  message: string;
  type: 'merge_failed' | 'update_failed' | 'verification_failed' | 'unknown';
  originalError?: unknown;
}

export function useApproveTask() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation<void, ApproveTaskError, ApproveTaskParams>({
    mutationFn: async ({
      taskId,
      attemptId,
      shouldMerge,
      title,
      description,
      parentTaskAttempt,
    }: ApproveTaskParams) => {
      try {
        // If code changes, merge first
        if (shouldMerge) {
          try {
            await attemptsApi.merge(attemptId);
          } catch (mergeError: any) {
            // Extract user-friendly error message from API error
            const errorMessage = mergeError?.message || 'Failed to merge branch';

            throw {
              message: errorMessage,
              type: 'merge_failed',
              originalError: mergeError,
            } as ApproveTaskError;
          }

          // Verify merge succeeded by checking branch status
          try {
            const branchStatus = await attemptsApi.getBranchStatus(attemptId);

            // If there are still commits ahead, merge didn't complete properly
            if ((branchStatus.commits_ahead ?? 0) > 0) {
              throw {
                message: 'Merge completed but branch still has uncommitted changes. Please verify the merge status.',
                type: 'verification_failed',
              } as ApproveTaskError;
            }

            // If merge conflicts were created, fail the operation
            if (branchStatus.conflicted_files && branchStatus.conflicted_files.length > 0) {
              throw {
                message: `Merge created ${branchStatus.conflicted_files.length} conflict(s). Please resolve conflicts manually.`,
                type: 'merge_failed',
              } as ApproveTaskError;
            }
          } catch (verifyError: any) {
            // If verification itself failed (not a merge verification issue)
            if (verifyError.type !== 'verification_failed' && verifyError.type !== 'merge_failed') {
              throw {
                message: 'Failed to verify merge status. The merge may have succeeded but could not be verified.',
                type: 'verification_failed',
                originalError: verifyError,
              } as ApproveTaskError;
            }
            // Re-throw if it's already a typed error
            throw verifyError;
          }
        }

        // Then mark complete, preserving existing field values
        // Note: We only update status to 'done', preserving all other fields
        // Using type assertion since we intentionally omit image_ids to preserve existing images
        try {
          await tasksApi.update(taskId, {
            title,
            description,
            status: 'done',
            parent_task_attempt: parentTaskAttempt,
          } as Parameters<typeof tasksApi.update>[1]);
        } catch (updateError: any) {
          // Extract user-friendly error message from API error
          const errorMessage = updateError?.message || 'Failed to update task status';

          throw {
            message: errorMessage,
            type: 'update_failed',
            originalError: updateError,
          } as ApproveTaskError;
        }
      } catch (error: any) {
        // If it's already a typed ApproveTaskError, re-throw it
        if (error.type) {
          throw error;
        }

        // Otherwise wrap unknown errors
        throw {
          message: error?.message || 'An unexpected error occurred during approval',
          type: 'unknown',
          originalError: error,
        } as ApproveTaskError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['attempts', variables.attemptId] });
      queryClient.invalidateQueries({ queryKey: ['branchStatus', variables.attemptId] });

      // Navigate to kanban view on success
      navigate(`/projects/${variables.projectId}/tasks`);
    },
    onError: (error) => {
      // Log detailed error for debugging
      console.error('[Approve Task Error]', {
        type: error.type,
        message: error.message,
        originalError: error.originalError,
        timestamp: new Date().toISOString(),
      });
    },
  });

  return {
    approve: (params: ApproveTaskParams) => mutation.mutate(params),
    isApproving: mutation.isPending,
    error: mutation.error,
  };
}
