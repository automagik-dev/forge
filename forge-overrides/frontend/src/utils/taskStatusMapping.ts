import { Sparkles, Hammer, Target, CheckCircle2, XCircle } from 'lucide-react';
import { TaskStatus } from '@/shared/types';

// Map TaskStatus to display names
export const COLUMN_DISPLAY_NAMES: Record<TaskStatus, string> = {
  todo: 'Wish',
  inprogress: 'Forge',
  inreview: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

// Map TaskStatus to genie IDs
export const COLUMN_STATUS_TO_GENIE: Record<TaskStatus, 'wishh' | 'forge' | 'review' | null> = {
  todo: 'wishh',
  inprogress: 'forge',
  inreview: 'review',
  done: null,
  cancelled: null,
};

// Map TaskStatus to icons
export const COLUMN_ICONS: Record<TaskStatus, React.ComponentType<any>> = {
  todo: Sparkles,
  inprogress: Hammer,
  inreview: Target,
  done: CheckCircle2,
  cancelled: XCircle,
};

// Check if a task should be filtered out (agent status)
export const isAgentStatus = (status: any): boolean => {
  return status === 'agent';
};
