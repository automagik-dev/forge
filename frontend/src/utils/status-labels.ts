import { TaskStatus } from 'shared/types';

export const statusBoardColors: Record<TaskStatus, string> = {
  todo: '--neutral-foreground',
  inprogress: '--info',
  inreview: '--warning',
  done: '--success',
  archived: '--destructive',
  agent: '--purple-500',
};
