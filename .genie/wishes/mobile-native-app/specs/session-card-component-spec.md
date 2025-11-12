# Task Card Component Specification (Forge Workflow)

**Component:** TaskCard  
**Purpose:** Display Forge tasks in a vertical list with Forge workflow status (WISH → FORGE → REVIEW → DONE)  
**Status:** Planning Complete  
**Last Updated:** 2025-11-11

---

## Overview

The Task Card component displays each Forge task in a vertical scrollable list, similar to ChatGPT, Claude, and Manus mobile apps. This design pattern is more intuitive for mobile users than traditional horizontal Kanban columns.

### Design Philosophy

**Why Task Cards (Not Kanban Columns)?**
- Users are already familiar with this pattern from AI assistants
- Vertical scrolling is natural on mobile (vs horizontal column switching)
- Each task card shows its current Forge workflow status (WISH, FORGE, REVIEW, DONE)
- Progress indicators show TaskAttempt execution progress in FORGE phase
- Status icons provide instant visual feedback with animations

**Inspiration:**
- ChatGPT mobile app (conversation list)
- Claude mobile app (chat history)
- Manus app (task list with progress indicators)
- Linear mobile app (issue list)
- Notion mobile app (page list)

**Forge Workflow:**
- **WISH** (`status: "todo"`): Planning phase - human and AI interact until task is ready and approved
- **FORGE** (`status: "inprogress"`): Execution phase - TaskAttempts are created and run
- **REVIEW** (`status: "inreview"`): Validation phase - results are reviewed and approved
- **DONE** (`status: "done"`): Task completed

---

## Component Structure

### Visual Layout

```
┌─────────────────────────────────────────────────┐
│ ┌────┐  Task Title                      4/12 ▶ │
│ │ 🔨 │  FORGE • Running                  │
│ └────┘  Description preview...            │
│         ⏱️ 2h ago • Approve to Review     │
└─────────────────────────────────────────────────┘
```
*Note: 🔨 represents the Lucide `Hammer` icon*

### Component Hierarchy

```
TaskCard
├── StatusIcon (left)
│   ├── Static icon (WISH, REVIEW, DONE)
│   └── Animated icon (FORGE - spinning when running)
├── Content (center)
│   ├── Title
│   ├── Status Badge (WISH, FORGE, REVIEW, DONE)
│   ├── Description/Preview
│   └── Metadata (time, approval state, tags)
└── Progress (right)
    ├── Step counter (FORGE only: "4/12" ExecutionProcesses)
    └── Chevron icon
```

---

## Status Icons (Forge Workflow)

### Icon Mapping

```typescript
import { Sparkles, Hammer, Target, CheckCircle2, XCircle, AlertTriangle, type LucideIcon } from 'lucide-react';

export const ForgeTaskStatusIcons: Record<TaskStatus, {
  icon: LucideIcon;
  color: string;
  animation: 'spin' | 'pulse' | 'checkmark' | null;
  label: string;
  description: string;
}> = {
  // WISH Phase (Planning) - status: "todo"
  todo: {
    icon: Sparkles,
    color: '#4A9EFF', // Blue
    animation: null,
    label: 'WISH',
    description: 'Planning phase - human and AI interact until approved',
  },
  
  // FORGE Phase (Execution) - status: "inprogress"
  inprogress: {
    icon: Hammer,
    color: '#00D9FF', // Cyan
    animation: 'spin', // Rotating hammer when TaskAttempt is running
    label: 'FORGE',
    description: 'Execution phase - TaskAttempts are running',
  },
  
  // REVIEW Phase (Validation) - status: "inreview"
  inreview: {
    icon: Target,
    color: '#FFD700', // Yellow
    animation: null,
    label: 'REVIEW',
    description: 'Validation phase - results are reviewed and approved',
  },
  
  // DONE (Completed) - status: "done"
  done: {
    icon: CheckCircle2,
    color: '#00FF88', // Green
    animation: 'checkmark', // Scale-in animation on completion
    label: 'DONE',
    description: 'Task completed',
  },
  
  // Cancelled - status: "cancelled"
  cancelled: {
    icon: XCircle,
    color: '#A8A8B8', // Gray
    animation: null,
    label: 'CANCELLED',
    description: 'Task cancelled',
  },
  
  // Agent - status: "agent" (background execution)
  agent: {
    icon: Sparkles,
    color: '#9D4EDD', // Purple
    animation: 'pulse',
    label: 'AGENT',
    description: 'Background agent execution',
  },
};

// Blocked/Error state (overlays on any status when errors exist)
export const BlockedStatusIcon = {
  icon: AlertTriangle,
  color: '#FF4D6A', // Red
  animation: 'pulse' as const,
  label: 'BLOCKED',
  description: 'Task has errors or blockers',
};
```

### Icon Animations

**FORGE (Running Hammer):**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-icon-forge {
  animation: spin 2s linear infinite;
}
```
*Applied to `Hammer` icon when TaskAttempt is running*

**Blocked (Pulsing Alert):**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.status-icon-blocked {
  animation: pulse 1.5s ease-in-out infinite;
}
```
*Applied to `AlertTriangle` icon when task has errors*

**DONE (Checkmark Scale-In):**
```css
@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.status-icon-done {
  animation: checkmark 0.4s ease-out;
}
```
*Applied to `CheckCircle2` icon on task completion*

---

## Component Implementation

### TypeScript Interface

```typescript
export interface TaskSessionCardProps {
  task: TaskWithAttemptStatus;
  onTap: (task: TaskWithAttemptStatus) => void;
  onSwipeLeft?: (task: TaskWithAttemptStatus) => void;
  onLongPress?: (task: TaskWithAttemptStatus) => void;
  showProgress?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export interface TaskSessionCardData {
  id: string;
  title: string;
  description?: string;
  lastMessage?: string;
  status: 'wish' | 'forge' | 'review' | 'completed' | 'blocked' | 'paused';
  progress: {
    current: number;
    total: number;
  };
  metadata: {
    updatedAt: Date;
    executor?: string;
    tags?: string[];
  };
  hasUnread?: boolean;
  isPinned?: boolean;
}
```

### React Component

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';
import { TaskStatusIcons } from './TaskStatusIcons';
import { formatDistanceToNow } from 'date-fns';

export function TaskSessionCard({
  task,
  onTap,
  onSwipeLeft,
  onLongPress,
  showProgress = true,
  showMetadata = true,
  className
}: TaskSessionCardProps) {
  const statusConfig = TaskStatusIcons[task.status];
  const isRunning = task.status === 'forge' && task.has_in_progress_attempt;
  
  const handleTap = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    onTap(task);
  };
  
  const handleLongPress = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    onLongPress?.(task);
  };
  
  return (
    <div
      onClick={handleTap}
      onContextMenu={(e) => {
        e.preventDefault();
        handleLongPress();
      }}
      className={cn(
        'flex items-start gap-3 p-4',
        'bg-surface-primary border-b border-border-primary',
        'active:bg-surface-secondary transition-colors',
        'cursor-pointer',
        task.hasUnread && 'bg-surface-secondary',
        className
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
        <div
          className={cn(
            'text-3xl',
            isRunning && 'animate-spin',
            task.status === 'blocked' && 'animate-pulse'
          )}
          style={{ color: statusConfig.color }}
        >
          {statusConfig.icon}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3 className={cn(
          'text-base font-semibold text-text-primary',
          'truncate mb-1',
          task.hasUnread && 'font-bold'
        )}>
          {task.title}
        </h3>
        
        {/* Description/Preview */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-2">
          {task.lastMessage || task.description || 'No description'}
        </p>
        
        {/* Metadata */}
        {showMetadata && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            {/* Time */}
            <span className="flex items-center gap-1">
              ⏱️ {formatDistanceToNow(new Date(task.updated_at), { addSuffix: true })}
            </span>
            
            {/* Status Label */}
            <span className="flex items-center gap-1">
              📊 {statusConfig.label}
            </span>
            
            {/* Executor */}
            {task.metadata?.executor && (
              <span className="flex items-center gap-1">
                🤖 {task.metadata.executor}
              </span>
            )}
            
            {/* Tags */}
            {task.metadata?.tags && task.metadata.tags.length > 0 && (
              <span className="flex items-center gap-1">
                🏷️ {task.metadata.tags[0]}
                {task.metadata.tags.length > 1 && ` +${task.metadata.tags.length - 1}`}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Progress & Chevron */}
      <div className="flex-shrink-0 flex flex-col items-end justify-center gap-1">
        {/* Progress Counter */}
        {showProgress && task.progress && (
          <div className={cn(
            'text-sm font-medium',
            isRunning ? 'text-brand-cyan-primary' : 'text-text-secondary'
          )}>
            {task.progress.current}/{task.progress.total}
          </div>
        )}
        
        {/* Chevron */}
        <div className="text-text-tertiary">
          ▶
        </div>
        
        {/* Unread Indicator */}
        {task.hasUnread && (
          <div className="w-2 h-2 rounded-full bg-brand-cyan-primary" />
        )}
      </div>
    </div>
  );
}
```

---

## List View Implementation

### Session List Component

```typescript
import React, { useState } from 'react';
import { TaskSessionCard } from './TaskSessionCard';
import { VirtualizedList } from '@/components/VirtualizedList';
import { cn } from '@/lib/utils';

export interface TaskSessionListProps {
  tasks: TaskWithAttemptStatus[];
  onTaskTap: (task: TaskWithAttemptStatus) => void;
  onTaskDelete?: (task: TaskWithAttemptStatus) => void;
  onTaskMenu?: (task: TaskWithAttemptStatus) => void;
  filter?: 'all' | 'favorites' | 'scheduled';
  className?: string;
}

export function TaskSessionList({
  tasks,
  onTaskTap,
  onTaskDelete,
  onTaskMenu,
  filter = 'all',
  className
}: TaskSessionListProps) {
  const [activeFilter, setActiveFilter] = useState(filter);
  
  const filteredTasks = tasks.filter(task => {
    switch (activeFilter) {
      case 'favorites':
        return task.isPinned;
      case 'scheduled':
        return task.scheduledAt !== null;
      default:
        return true;
    }
  });
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-primary">
        <FilterTab
          label="All"
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        <FilterTab
          label="Favorites"
          active={activeFilter === 'favorites'}
          onClick={() => setActiveFilter('favorites')}
        />
        <FilterTab
          label="Scheduled"
          active={activeFilter === 'scheduled'}
          onClick={() => setActiveFilter('scheduled')}
        />
      </div>
      
      {/* Session Cards List */}
      <VirtualizedList
        items={filteredTasks}
        renderItem={(task) => (
          <TaskSessionCard
            key={task.id}
            task={task}
            onTap={onTaskTap}
            onSwipeLeft={onTaskDelete}
            onLongPress={onTaskMenu}
          />
        )}
        estimatedItemSize={96}
        className="flex-1"
      />
      
      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No tasks yet
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            Create your first task to get started
          </p>
          <button
            onClick={() => {/* Open task creation */}}
            className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium"
          >
            Create Task
          </button>
        </div>
      )}
    </div>
  );
}

function FilterTab({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-colors',
        'touch-target',
        active
          ? 'bg-surface-primary text-text-primary'
          : 'bg-transparent text-text-secondary'
      )}
    >
      {label}
    </button>
  );
}
```

---

## Swipe Gestures

### Swipe-to-Delete Implementation

```typescript
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  
  const bind = useGesture({
    onDrag: ({ down, movement: [mx], direction: [xDir], cancel }) => {
      // Swipe left (delete)
      if (mx < -100 && !down) {
        onSwipeLeft?.();
        cancel();
      }
      // Swipe right (archive/pin)
      else if (mx > 100 && !down) {
        onSwipeRight?.();
        cancel();
      }
      
      api.start({
        x: down ? mx : 0,
        immediate: down,
      });
    },
  });
  
  return { bind, x };
}

// Usage in TaskSessionCard
export function TaskSessionCard({ task, onSwipeLeft, onSwipeRight }: TaskSessionCardProps) {
  const { bind, x } = useSwipeGesture(
    () => onSwipeLeft?.(task),
    () => onSwipeRight?.(task)
  );
  
  return (
    <animated.div
      {...bind()}
      style={{ x }}
      className="relative"
    >
      {/* Delete action (revealed on swipe left) */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-error flex items-center justify-center">
        <span className="text-white text-2xl">🗑️</span>
      </div>
      
      {/* Card content */}
      <div className="bg-surface-primary">
        {/* ... card content ... */}
      </div>
    </animated.div>
  );
}
```

---

## Progress Indicators

### Progress Counter Logic

```typescript
export function calculateTaskProgress(task: TaskWithAttemptStatus): {
  current: number;
  total: number;
} {
  // If task has attempts, count execution processes
  if (task.attempts && task.attempts.length > 0) {
    const lastAttempt = task.attempts[task.attempts.length - 1];
    const processes = lastAttempt.execution_processes || [];
    
    const completed = processes.filter(p => 
      p.status === 'completed' || p.status === 'success'
    ).length;
    
    const total = processes.length;
    
    return { current: completed, total };
  }
  
  // If no attempts, show 0/1 (not started)
  return { current: 0, total: 1 };
}
```

### Progress Animation

```typescript
export function ProgressCounter({ current, total, isRunning }: {
  current: number;
  total: number;
  isRunning: boolean;
}) {
  return (
    <div className={cn(
      'text-sm font-medium tabular-nums',
      isRunning && 'animate-pulse text-brand-cyan-primary'
    )}>
      {current}/{total}
    </div>
  );
}
```

---

## Accessibility

### ARIA Labels

```typescript
<div
  role="button"
  aria-label={`Task: ${task.title}. Status: ${statusConfig.label}. Progress: ${task.progress.current} of ${task.progress.total} steps.`}
  aria-pressed={task.hasUnread}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleTap();
    }
  }}
>
  {/* Card content */}
</div>
```

### Screen Reader Support

- Status icons have text alternatives
- Progress counters are announced
- Swipe actions have keyboard alternatives
- Focus management for navigation

---

## Performance Optimization

### Virtualization

Use `react-virtuoso` for efficient rendering of large task lists:

```typescript
import { Virtuoso } from 'react-virtuoso';

export function TaskSessionList({ tasks }: TaskSessionListProps) {
  return (
    <Virtuoso
      data={tasks}
      itemContent={(index, task) => (
        <TaskSessionCard key={task.id} task={task} />
      )}
      overscan={5}
      increaseViewportBy={{ top: 200, bottom: 200 }}
    />
  );
}
```

### Memoization

```typescript
export const TaskSessionCard = React.memo(
  TaskSessionCardComponent,
  (prev, next) => {
    return (
      prev.task.id === next.task.id &&
      prev.task.updated_at === next.task.updated_at &&
      prev.task.has_in_progress_attempt === next.task.has_in_progress_attempt
    );
  }
);
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('TaskSessionCard', () => {
  it('renders task title and description', () => {
    const task = createMockTask({ title: 'Test Task' });
    render(<TaskSessionCard task={task} onTap={jest.fn()} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('shows running animation for forge status', () => {
    const task = createMockTask({ status: 'forge', has_in_progress_attempt: true });
    const { container } = render(<TaskSessionCard task={task} onTap={jest.fn()} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
  
  it('displays progress counter', () => {
    const task = createMockTask({ progress: { current: 5, total: 10 } });
    render(<TaskSessionCard task={task} onTap={jest.fn()} />);
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });
  
  it('calls onTap when clicked', () => {
    const onTap = jest.fn();
    const task = createMockTask();
    render(<TaskSessionCard task={task} onTap={onTap} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledWith(task);
  });
});
```

### E2E Tests

```typescript
describe('Task Session List', () => {
  it('allows filtering tasks by status', async () => {
    await page.goto('/tasks');
    await page.click('[data-testid="filter-favorites"]');
    const cards = await page.$$('[data-testid="task-session-card"]');
    expect(cards.length).toBeGreaterThan(0);
  });
  
  it('supports swipe-to-delete gesture', async () => {
    await page.goto('/tasks');
    const card = await page.$('[data-testid="task-session-card"]:first-child');
    await card.swipe('left', 200);
    await page.waitForSelector('[data-testid="delete-confirmation"]');
  });
});
```

---

## Migration from Kanban Columns

### Phase 1: Dual View Support

```typescript
export function TasksView() {
  const { isNative } = usePlatform();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(
    isNative ? 'list' : 'kanban'
  );
  
  return (
    <div>
      {/* View toggle (desktop only) */}
      {!isNative && (
        <ViewToggle value={viewMode} onChange={setViewMode} />
      )}
      
      {/* Render appropriate view */}
      {viewMode === 'list' ? (
        <TaskSessionList tasks={tasks} />
      ) : (
        <TaskKanbanBoard tasks={tasks} />
      )}
    </div>
  );
}
```

### Phase 2: Mobile-Only List View

```typescript
export function TasksView() {
  const { isNative, isWeb } = usePlatform();
  
  // Mobile: Always use list view
  if (isNative || window.innerWidth < 768) {
    return <TaskSessionList tasks={tasks} />;
  }
  
  // Desktop: Use kanban board
  return <TaskKanbanBoard tasks={tasks} />;
}
```

---

## Design Tokens

### Session Card Tokens

```typescript
export const sessionCardTokens = {
  // Spacing
  padding: spacing[4], // 16px
  gap: spacing[3], // 12px
  iconSize: 48, // 48px
  
  // Typography
  titleSize: typeScale.body.large.fontSize, // 17px
  titleWeight: typeScale.body.large.fontWeight, // 600
  descriptionSize: typeScale.body.small.fontSize, // 13px
  metadataSize: typeScale.label.small.fontSize, // 11px
  
  // Colors
  background: darkTheme.surface.primary,
  backgroundActive: darkTheme.surface.secondary,
  backgroundUnread: darkTheme.surface.secondary,
  border: darkTheme.border.primary,
  
  // Animations
  tapDuration: duration.fast, // 200ms
  swipeDuration: duration.normal, // 300ms
  iconSpinDuration: 2000, // 2s
  pulseDuration: 1500, // 1.5s
};
```

---

## Future Enhancements

### Phase 3 Additions

1. **Smart Grouping**
   - Group by date (Today, Yesterday, This Week)
   - Group by status
   - Group by project

2. **Batch Actions**
   - Multi-select mode
   - Bulk delete/archive
   - Bulk status change

3. **Search & Filter**
   - Full-text search
   - Advanced filters (executor, tags, date range)
   - Saved filter presets

4. **Customization**
   - Reorderable cards (drag-to-reorder)
   - Custom card layouts
   - Density options (compact, comfortable, spacious)

---

## Related Documentation

- [Phase 2: Core Views Technical Spec](./phase-2-core-views-technical-spec.md)
- [Design System & Branding Spec](./design-system-and-branding-spec.md)
- [UX Best Practices & Engagement Spec](./ux-best-practices-and-engagement-spec.md)
- [Component API Contracts](./component-api-contracts.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Ready for Implementation
