# Task C: Kanban Board Integration & Task Filtering

**Phase**: 3 of 4
**Agent**: `specialists/implementor`
**Status**: 🔴 Pending
**Created**: 2025-10-23

---

## Overview

This task integrates the Sub-Genie widgets into the actual Kanban board, implements column renaming (To Do → Wish, In Progress → Forge, In Review → Review), and filters out task attempts with `status: "agent"`.

---

## Discovery

### Context
The Kanban board currently displays all tasks in each column. We need to:
1. Rename column titles to match sub-genie names
2. Add sub-genie icons to column headers
3. Integrate chat widgets from Task B
4. Filter out agent-status tasks (invisible to users)
5. Ensure Task Attempts with `status: "agent"` don't appear in the board

### Key Constraint
Task Attempts with `status: "agent"` represent internal agent orchestration records. They should NOT appear in the Kanban board (they're hidden by filtering at the API or component level).

---

## Implementation Plan

### Step 1: Update TaskStatus Mapping
**File**: `frontend-forge/src/utils/taskStatusMapping.ts` (NEW)

```typescript
import { TaskStatus } from '@/shared/types';

// Map TaskStatus to column display names and icons
export const COLUMN_DISPLAY_NAMES: Record<TaskStatus, string> = {
  todo: 'Wish',
  inprogress: 'Forge',
  inreview: 'Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const COLUMN_STATUS_TO_GENIE: Record<TaskStatus, 'wishh' | 'forge' | 'review' | null> = {
  todo: 'wishh',
  inprogress: 'forge',
  inreview: 'review',
  done: null,
  cancelled: null,
};

export const isAgentStatus = (status: any): boolean => {
  return status === 'agent';
};
```

### Step 2: Create Task Filtering Hook
**File**: `frontend-forge/src/hooks/useFilteredTasks.ts` (NEW)

```typescript
import { useMemo } from 'react';
import { Task, TaskStatus } from '@/shared/types';
import { isAgentStatus } from '@/utils/taskStatusMapping';

export const useFilteredTasks = (
  tasks: Task[],
  status: TaskStatus
): Task[] => {
  return useMemo(() => {
    return tasks.filter((task) => {
      // Only show tasks with the specified status
      if (task.status !== status) return false;

      // Filter out agent task attempts
      // Note: Task has a `parent_task_attempt` field; if this is an agent task attempt, exclude it
      // For now, we filter based on status. If there's an `agent_status` field, use that instead.
      if (isAgentStatus(task.status)) return false;

      return true;
    });
  }, [tasks, status]);
};
```

**Note**: If the backend doesn't explicitly mark agent tasks in the Task model, we may need to:
- Add a new field to Task (e.g., `is_agent_task: boolean`)
- Or create a separate API endpoint to fetch only user-facing tasks

### Step 3: Update Kanban Board Component
**File**: `frontend-forge/src/components/KanbanBoard.tsx` (UPDATE existing)

This step assumes the Kanban board component exists. We'll integrate the sub-genie widgets and apply column renamings.

```typescript
// Pseudo-code (adjust based on actual Kanban component structure)

import React from 'react';
import { Task, TaskStatus } from '@/shared/types';
import { GENIE_CONFIGS } from '@/config/genie-configs';
import { COLUMN_DISPLAY_NAMES, COLUMN_STATUS_TO_GENIE } from '@/utils/taskStatusMapping';
import { ColumnWithWidget } from '@/components/genie-widgets';
import { useFilteredTasks } from '@/hooks/useFilteredTasks';
import { SubGenieProvider } from '@/context/SubGenieContext';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate?: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskUpdate }) => {
  const columnStatuses: TaskStatus[] = ['todo', 'inprogress', 'inreview', 'done', 'cancelled'];

  return (
    <SubGenieProvider>
      <div className="grid grid-cols-5 gap-4 p-4 bg-gray-100 h-screen overflow-hidden">
        {columnStatuses.map((status) => {
          const genieId = COLUMN_STATUS_TO_GENIE[status];
          const filteredTasks = useFilteredTasks(tasks, status);
          const config = genieId ? GENIE_CONFIGS[genieId] : null;

          return (
            <div key={status} className="flex flex-col bg-white rounded-lg shadow">
              {config ? (
                <ColumnWithWidget config={config} taskCount={filteredTasks.length}>
                  {/* Render tasks */}
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={onTaskUpdate}
                    />
                  ))}
                </ColumnWithWidget>
              ) : (
                <>
                  {/* For Done/Cancelled columns (no genie) */}
                  <div className="px-4 py-2 font-semibold border-b">
                    {COLUMN_DISPLAY_NAMES[status]}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={onTaskUpdate}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </SubGenieProvider>
  );
};
```

### Step 4: Create Task Filtering API Query
**File**: `frontend-forge/src/hooks/useKanbanTasks.ts` (NEW)

If the backend doesn't filter agent tasks, we do it client-side:

```typescript
import { useQuery } from '@tanstack/react-query';
import { Task } from '@/shared/types';
import { isAgentStatus } from '@/utils/taskStatusMapping';

export const useKanbanTasks = (projectId: string) => {
  return useQuery({
    queryKey: ['kanban-tasks', projectId],
    queryFn: async () => {
      // Fetch all tasks for the project
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      const tasks: Task[] = await response.json();

      // Filter out agent tasks
      return tasks.filter((task) => !isAgentStatus(task.status));
    },
  });
};
```

### Step 5: Update Column Header Labels
**File**: `frontend-forge/src/components/genie-widgets/ColumnHeader.tsx` (UPDATE from Task A)

No changes needed; the component already uses `columnName` prop, which we now pass from the mapping.

### Step 6: Add Icon Rendering for Done/Cancelled Columns
**File**: `frontend-forge/src/components/KanbanBoard.tsx` (continuation)

```typescript
import { CheckCircle2, XCircle } from 'lucide-react';

// In the Done/Cancelled column header:
<div className="flex items-center gap-2 px-4 py-2 font-semibold border-b">
  {status === 'done' && <CheckCircle2 size={20} className="text-green-600" />}
  {status === 'cancelled' && <XCircle size={20} className="text-red-600" />}
  <span>{COLUMN_DISPLAY_NAMES[status]}</span>
  <span className="text-sm text-gray-500">({filteredTasks.length})</span>
</div>
```

### Step 7: Ensure Provider Wrapping
**File**: `frontend-forge/src/main.tsx` (UPDATE existing)

Make sure the SubGenieProvider is wrapped around the app:

```typescript
import { SubGenieProvider } from '@/context/SubGenieContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <Sentry.ErrorBoundary fallback={<p>Error</p>} showDialog>
          <SubGenieProvider>
            <AutomagikForgeWebCompanion />
            <App />
          </SubGenieProvider>
        </Sentry.ErrorBoundary>
      </PostHogProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## Verification

### Commands
```bash
# Type check
pnpm --filter frontend-forge exec tsc --noEmit

# Lint
pnpm --filter frontend-forge run lint

# Run dev server and manually test
pnpm run dev
```

### Manual Testing Checklist
- [ ] Kanban board loads without errors
- [ ] Column headers display new names (Wish, Forge, Review, Done, Cancelled)
- [ ] Icons appear in column headers (Sparkles, Hammer, Target, CheckCircle2, XCircle)
- [ ] Clicking column icon opens/closes chat widget
- [ ] Chat widget is interactive (send message, click workflow buttons, toggle skills)
- [ ] Agent tasks (if any) do not appear in the board
- [ ] Task count is accurate (reflects only user-facing tasks)
- [ ] Layout is responsive and doesn't break

### Visual Inspection
- [ ] Icons align properly with text
- [ ] Widget doesn't push tasks off-screen
- [ ] Colors match design (purple for Wishh, orange for Forge, blue for Review)
- [ ] No console errors

---

## Evidence Artifacts
Store in `.genie/wishes/genie-chat-widgets/qa/`:
- [ ] Screenshots of updated Kanban board
- [ ] Proof that agent tasks are filtered
- [ ] Test execution logs
- [ ] Browser console (no errors)

---

## Potential Issues & Mitigations

### Issue: Agent Task Status Not Clear
If the backend doesn't have a clear `agent_status` field:
- **Mitigation**: Coordinate with backend to add `is_agent_task: boolean` field to Task, or use a dedicated API endpoint for user-facing tasks

### Issue: Widget Layout Breaks Column
If the chat widget is too wide:
- **Mitigation**: Make widget collapsible/dismissible, or use a sidebar instead of inline expansion

### Issue: Performance (Many Tasks)
If there are hundreds of tasks:
- **Mitigation**: Implement virtual scrolling in task columns, use pagination

---

## Next Task
→ **Task D: QA & Polish** - Final testing, accessibility review, and performance optimization

