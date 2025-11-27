import {
  Sparkles,
  Hammer,
  Target,
  CheckCircle2,
  XCircle,
  Ban,
  type LucideIcon,
} from 'lucide-react';
import { TaskStatus } from 'shared/types';

// Map TaskStatus to display names
export const COLUMN_DISPLAY_NAMES: Record<TaskStatus, string> = {
  todo: 'Wish',
  inprogress: 'Forge',
  inreview: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
  archived: 'Archived',
  agent: 'Agent', // Background agent execution tasks
};

// Map TaskStatus to icons
export const COLUMN_ICONS: Record<TaskStatus, LucideIcon> = {
  todo: Sparkles,
  inprogress: Hammer,
  inreview: Target,
  done: CheckCircle2,
  cancelled: Ban,
  archived: XCircle,
  agent: Sparkles, // Use Sparkles for agent tasks (magical execution)
};
