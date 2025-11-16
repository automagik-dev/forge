import type { ReactNode } from 'react';
import {
  Hammer,
  CheckCircle2,
  Archive,
  Target
} from 'lucide-react';
import { Lamp } from '@/components/icons/Lamp';

export type Phase = 'wish' | 'forge' | 'review' | 'done' | 'archived';

export interface PhaseConfig {
  label: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
}

export const phaseConfigs: Record<Phase, PhaseConfig> = {
  wish: {
    label: 'Wish',
    icon: <Lamp size={20} />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  forge: {
    label: 'Forge',
    icon: <Hammer className="w-5 h-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  review: {
    label: 'Review',
    icon: <Target className="w-5 h-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  done: {
    label: 'Done',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  archived: {
    label: 'Archived',
    icon: <Archive className="w-5 h-5" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
};

export function getPhaseFromStatus(status: string): Phase {
  switch (status.toLowerCase()) {
    case 'todo':
      return 'wish';
    case 'inprogress':
    case 'agent':
      return 'forge';
    case 'inreview':
      return 'review';
    case 'done':
      return 'done';
    case 'cancelled':
      return 'archived';
    default:
      return 'wish';
  }
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} hr`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
}
