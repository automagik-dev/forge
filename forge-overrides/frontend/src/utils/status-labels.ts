// FORGE CUSTOMIZATION: Use Genie-themed column names (Wish, Forge, Review)
// This file overrides upstream/frontend/src/utils/status-labels.ts
import { TaskStatus } from 'shared/types';
import { COLUMN_DISPLAY_NAMES } from './taskStatusMapping';

// Use Genie column names: todo→Wish, inprogress→Forge, inreview→Review
export const statusLabels: Record<TaskStatus, string> = COLUMN_DISPLAY_NAMES;

export const statusBoardColors: Record<TaskStatus, string> = {
  todo: '--neutral-foreground',
  inprogress: '--info',
  inreview: '--warning',
  done: '--success',
  cancelled: '--destructive',
};
