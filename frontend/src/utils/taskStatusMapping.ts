import { Sparkles, Hammer, Target, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import { TaskStatus } from 'shared/types';

// Map TaskStatus to display names
export const COLUMN_DISPLAY_NAMES: Record<TaskStatus, string> = {
  todo: 'Wish',
  inprogress: 'Forge',
  inreview: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
  agent: 'Agent', // Background agent execution tasks
};

// Map TaskStatus to genie IDs
export const COLUMN_STATUS_TO_GENIE: Record<TaskStatus, 'wish' | 'forge' | 'review' | null> = {
  todo: 'wish',
  inprogress: 'forge',
  inreview: 'review',
  done: null,
  cancelled: null,
  agent: null, // Agent tasks don't map to main Kanban columns
};

// Map TaskStatus to icons
export const COLUMN_ICONS: Record<TaskStatus, LucideIcon> = {
  todo: Sparkles,
  inprogress: Hammer,
  inreview: Target,
  done: CheckCircle2,
  cancelled: XCircle,
  agent: Sparkles, // Use Sparkles for agent tasks (magical execution)
};

// Check if a task should be filtered out (agent status)
export const isAgentStatus = (status: string): boolean => {
  return status === 'agent';
};
