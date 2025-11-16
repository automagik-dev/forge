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

export function useApproveTask() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async ({
      taskId,
      attemptId,
      shouldMerge,
      title,
      description,
      parentTaskAttempt,
    }: ApproveTaskParams) => {
      // If code changes, merge first
      if (shouldMerge) {
        await attemptsApi.merge(attemptId);
      }

      // Then mark complete, preserving existing field values
      // Note: We only update status to 'done', preserving all other fields
      // Using type assertion since we intentionally omit image_ids to preserve existing images
      await tasksApi.update(taskId, {
        title,
        description,
        status: 'done',
        parent_task_attempt: parentTaskAttempt,
      } as Parameters<typeof tasksApi.update>[1]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['attempts', variables.attemptId] });

      // Navigate to kanban view on success
      navigate(`/projects/${variables.projectId}/tasks`);
    },
  });

  return {
    approve: (params: ApproveTaskParams) => mutation.mutate(params),
    isApproving: mutation.isPending,
    error: mutation.error,
  };
}
