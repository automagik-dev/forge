import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, attemptsApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface ApproveTaskParams {
  taskId: string;
  attemptId: string;
  shouldMerge: boolean;
  projectId: string;
}

export function useApproveTask() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async ({
      taskId,
      attemptId,
      shouldMerge,
    }: ApproveTaskParams) => {
      // If code changes, merge first
      if (shouldMerge) {
        await attemptsApi.merge(attemptId);
      }

      // Then mark complete
      await tasksApi.update(taskId, {
        title: null,
        description: null,
        status: 'done',
        parent_task_attempt: null,
        image_ids: null,
      });
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
