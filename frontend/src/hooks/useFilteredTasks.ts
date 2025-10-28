import { useMemo } from 'react';
import { Task, TaskStatus } from 'shared/types';
import { isAgentStatus } from '@/utils/taskStatusMapping';

export const useFilteredTasks = (
  tasks: Task[],
  status: TaskStatus
): Task[] => {
  return useMemo(() => {
    return tasks.filter((task) => {
      // Only show tasks with the specified status
      if (task.status !== status) return false;

      // Filter out agent task attempts
      if (isAgentStatus(task.status)) return false;

      return true;
    });
  }, [tasks, status]);
};
