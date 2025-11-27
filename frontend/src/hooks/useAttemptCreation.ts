import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TaskAttempt, ExecutorProfileId } from 'shared/types';

type CreateAttemptArgs = {
  profile: ExecutorProfileId;
  baseBranch: string;
  useWorktree?: boolean;
};

type UseAttemptCreationArgs = {
  taskId: string;
  onSuccess?: (attempt: TaskAttempt) => void;
};

export function useAttemptCreation({
  taskId,
  onSuccess,
}: UseAttemptCreationArgs) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      profile,
      baseBranch,
      useWorktree = true,
    }: CreateAttemptArgs) =>
      attemptsApi.create({
        task_id: taskId,
        executor_profile_id: profile,
        base_branch: baseBranch,
        use_worktree: useWorktree, // Use isolated worktree by default (Genie Lamp uses false for main workspace)
      }),
    onSuccess: (newAttempt: TaskAttempt) => {
      queryClient.setQueryData(
        queryKeys.taskAttempts.byTask(taskId),
        (old: TaskAttempt[] = []) => [newAttempt, ...old]
      );
      onSuccess?.(newAttempt);
    },
  });

  return {
    createAttempt: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
