import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface KanbanHeaderWithWidgetProps {
  name: string;
  color: string;
  taskCount: number;
  widgetIcon: LucideIcon;
  isWidgetOpen: boolean;
  onWidgetToggle: () => void;
  onAddTask?: () => void;
}

/**
 * Kanban header with integrated widget icon button.
 * Matches the visual style of KanbanHeader exactly while adding widget functionality.
 */
export const KanbanHeaderWithWidget = ({
  name,
  color,
  taskCount,
  widgetIcon: WidgetIcon,
  isWidgetOpen,
  onWidgetToggle,
  onAddTask,
}: KanbanHeaderWithWidgetProps) => {
  const { t } = useTranslation('tasks');

  // Map color names to actual Tailwind colors
  const colorMap: Record<string, string> = {
    '--blue': 'rgb(59, 130, 246)', // blue-500
    '--amber': 'rgb(245, 158, 11)', // amber-500
    '--purple': 'rgb(168, 85, 247)', // purple-500
  };

  const iconColor = colorMap[color] || 'currentColor';

  return (
    <Card
      className={cn(
        'sticky top-0 z-20 flex shrink-0 items-center gap-2 p-3 border-b border-dashed',
        'bg-background'
      )}
      style={{
        backgroundImage: `linear-gradient(hsl(var(${color}) / 0.03), hsl(var(${color}) / 0.03))`,
      }}
    >
      {/* Widget icon button (left) */}
      <div
        className={cn(
          'p-1.5 rounded-lg transition-all hover:bg-muted cursor-pointer',
          isWidgetOpen && 'bg-primary/10'
        )}
        onClick={onWidgetToggle}
        role="button"
        aria-label={`Toggle ${name} widget`}
        title={`Click to chat with ${name} agent`}
        style={{ color: iconColor }}
      >
        <WidgetIcon className="h-4 w-4" />
      </div>

      {/* Column info (center) */}
      <span className="flex-1 flex items-center gap-2">
        <p className="m-0 text-sm">{name}</p>
        <span className="text-xs text-muted-foreground">({taskCount})</span>
      </span>

      {/* Add task button (right) */}
      {onAddTask && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="m-0 p-0 h-0 text-foreground/50 hover:text-foreground"
                onClick={onAddTask}
                aria-label={t('actions.addTask')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t('actions.addTask')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Card>
  );
};
