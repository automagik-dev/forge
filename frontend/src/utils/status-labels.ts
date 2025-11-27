import { TaskStatus } from 'shared/types';

export const statusBoardColors: Record<TaskStatus, string> = {
  todo: '--neutral-foreground',
  inprogress: '--info',
  inreview: '--warning',
  done: '--success',
  cancelled: '--destructive',
  archived: '--neutral-foreground',
  agent: '--purple-500',
};
