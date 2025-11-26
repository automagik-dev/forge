import { TaskStatus } from 'shared/types';

export const statusBoardColors: Record<TaskStatus, string> = {
  todo: '--neutral-foreground',
  inprogress: '--info',
  inreview: '--warning',
  done: '--success',
  cancelled: '--orange-500',
  archived: '--destructive',
  agent: '--purple-500',
};
