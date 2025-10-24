# Backend Integration Status for Genie Chat Widgets

## Current State Analysis

### ✅ CONFIRMED: Backend Already Supports Agent Tasks

The backend **already has full support** for agent status tasks. Here's what exists:

**1. Database Schema (Migration 20251020000001)**
```sql
-- TaskStatus now includes 'agent'
status TEXT NOT NULL DEFAULT 'todo'
  CHECK (status IN ('todo','inprogress','done','cancelled','inreview','agent'))
```

**2. TypeScript Types**
- `shared/types.ts` needs regeneration to include 'agent' in TaskStatus enum
- Currently shows: `"todo" | "inprogress" | "inreview" | "done" | "cancelled"`
- After regeneration will show: `"todo" | "inprogress" | "inreview" | "done" | "cancelled" | "agent"`

**3. Task Attempt Creation (task_server.rs:654-718)**
```rust
#[tool(description = "Start working on a task by creating and launching a new task attempt.")]
async fn start_task_attempt(
    &self,
    Parameters(StartTaskAttemptRequest {
        task_id,
        executor,    // e.g., "CLAUDE_CODE"
        variant,     // e.g., Some("wish"), Some("forge"), Some("review")
        base_branch,
    }): Parameters<StartTaskAttemptRequest>,
) -> Result<CallToolResult, ErrorData> {
    // ...
    let executor_profile_id = ExecutorProfileId {
        executor: base_executor,
        variant,  // This is where "wish", "forge", "review" go
    };
    // ...
}
```

## Integration Requirements for Widgets

### What Frontend Needs to Do

**1. Regenerate TypeScript Types**
```bash
cargo run -p server --bin generate_types
```
This will update `shared/types.ts` to include "agent" in TaskStatus enum.

**2. Update Task Filtering Logic**
The widget should filter tasks where:
- `task.status === "agent"` AND
- `task_attempt.executor` matches the widget type

**Current Widget Mapping:**
- **Wishh Widget** → shows tasks where status="agent" + variant="wish"
- **Forge Widget** → shows tasks where status="agent" + variant="forge"
- **Review Widget** → shows tasks where status="agent" + variant="review"

**3. API Integration Pattern**

When user clicks workflow button in widget, create task attempt:

```typescript
// Example: User clicks "Analyze Dependencies" in Wishh widget
const response = await fetch('/api/task-attempts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_id: newTaskId, // Create task first or use existing
    executor_profile_id: {
      executor: "CLAUDE_CODE",  // Or current configured executor
      variant: "wish"           // Maps to widget: wish/forge/review
    },
    base_branch: "main"
  })
});
```

## Migration Path for Existing Frontend

### Step 1: Update Types (REQUIRED)
```bash
# Regenerate types to include 'agent' status
cargo run -p server --bin generate_types

# Verify shared/types.ts now shows:
# export type TaskStatus = "todo" | "inprogress" | "inreview" | "done" | "cancelled" | "agent";
```

### Step 2: Update Filtering (REQUIRED)
Modify `useFilteredTasks.ts`:

```typescript
export const useFilteredTasks = (tasks: Task[], status: TaskStatus): Task[] => {
  return useMemo(() => {
    return tasks.filter((task) => {
      // Match the status
      if (task.status !== status) return false;

      // IMPORTANT: Never show agent tasks in main Kanban columns
      // Agent tasks only appear in widget views
      if (task.status === 'agent') return false;

      return true;
    });
  }, [tasks, status]);
};
```

### Step 3: Add Widget Task Fetching (NEW)
Create `useAgentTasks.ts`:

```typescript
import { useMemo } from 'react';
import { Task, TaskAttempt } from '@/shared/types';

/**
 * Filters tasks that should appear in widget views
 * Shows tasks with status="agent" that match the widget's variant
 */
export const useAgentTasks = (
  tasks: Task[],
  taskAttempts: TaskAttempt[], // Need to fetch this from API
  variant: 'wish' | 'forge' | 'review'
): Task[] => {
  return useMemo(() => {
    // Get agent tasks
    const agentTasks = tasks.filter(task => task.status === 'agent');

    // Match with task attempts that have the correct variant
    return agentTasks.filter(task => {
      const attempt = taskAttempts.find(a => a.task_id === task.id);
      if (!attempt) return false;

      // Parse executor profile to check variant
      // TaskAttempt.executor is stored as string like "claude_code:wish"
      const [, attemptVariant] = attempt.executor.split(':');
      return attemptVariant === variant;
    });
  }, [tasks, taskAttempts, variant]);
};
```

### Step 4: Update Widget API (ENHANCED)
Modify `subGenieApi.ts`:

```typescript
export class SubGenieApiService {
  /**
   * Creates a task and starts execution with agent variant
   */
  async executeWorkflow(
    genieId: 'wishh' | 'forge' | 'review',
    workflowId: string,
    projectId: string,
    description: string
  ) {
    // 1. Create task
    const taskResponse = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        title: `${genieId}: ${workflowId}`,
        description: description,
      })
    });
    const { data: task } = await taskResponse.json();

    // 2. Start task attempt with variant
    const variantMap = { wishh: 'wish', forge: 'forge', review: 'review' };
    const attemptResponse = await fetch('/api/task-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: task.id,
        executor_profile_id: {
          executor: 'CLAUDE_CODE', // Get from config
          variant: variantMap[genieId]
        },
        base_branch: 'main' // Get from project settings
      })
    });

    return await attemptResponse.json();
  }

  /**
   * Fetch tasks with status="agent" for this widget
   */
  async getAgentTasks(
    projectId: string,
    variant: 'wish' | 'forge' | 'review'
  ): Promise<Task[]> {
    // Fetch all agent tasks
    const response = await fetch(
      `/api/tasks?project_id=${projectId}&status=agent`
    );
    const { data: tasks } = await response.json();

    // Fetch task attempts to filter by variant
    const attemptsResponse = await fetch(
      `/api/task-attempts?project_id=${projectId}`
    );
    const { data: attempts } = await attemptsResponse.json();

    // Filter tasks by variant
    return tasks.filter(task => {
      const attempt = attempts.find(a => a.task_id === task.id);
      if (!attempt) return false;

      const [, attemptVariant] = attempt.executor.split(':');
      return attemptVariant === variant;
    });
  }
}
```

## Executor Profile Variants

### How Variants Work

The backend supports **executor profiles** which combine:
1. **Base Executor** (enum): `CLAUDE_CODE`, `CODEX`, `GEMINI`, `CURSOR`, etc.
2. **Variant** (string): Custom identifier like `"wish"`, `"forge"`, `"review"`

### Storage Format

**TaskAttempt.executor field** stores the combined string:
```
"claude_code:wish"    // Wishh widget using Claude
"claude_code:forge"   // Forge widget using Claude
"claude_code:review"  // Review widget using Claude
"gemini:wish"         // Wishh widget using Gemini
```

### Creating Variants

The variants `wish`, `forge`, and `review` are **not pre-defined enums**.
They are **arbitrary strings** that can be passed as the `variant` parameter.

This means:
- ✅ No backend code changes needed
- ✅ Frontend can use "wish"/"forge"/"review" immediately
- ✅ Variants are just labels to differentiate execution contexts

## Required Changes Summary

### Backend Changes: ✅ NONE REQUIRED
- Migration already adds 'agent' status
- Task attempts already support variants
- API endpoints already accept variant parameter

### Frontend Changes: 📝 MINIMAL

1. **Regenerate types** (1 command)
   ```bash
   cargo run -p server --bin generate_types
   ```

2. **Update taskStatusMapping.ts**
   ```typescript
   // Add "agent" to TaskStatus type (will come from regeneration)
   export const isAgentStatus = (status: any): boolean => status === 'agent';
   ```

3. **Create useAgentTasks.ts hook** (new file, ~30 lines)

4. **Update subGenieApi.ts** (add 2 methods: executeWorkflow, getAgentTasks)

5. **Update SubGenieWidget.tsx** (use useAgentTasks instead of mock data)

## Testing Plan

### 1. Type Regeneration Test
```bash
cargo run -p server --bin generate_types
grep "agent" shared/types.ts  # Should show "agent" in TaskStatus
```

### 2. API Test
```bash
# Create a task with agent status and wish variant
curl -X POST http://localhost:PORT/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "title": "Test Wishh Task",
    "description": "Testing agent variant"
  }'

# Start task attempt with wish variant
curl -X POST http://localhost:PORT/api/task-attempts \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "TASK_ID_FROM_ABOVE",
    "executor_profile_id": {
      "executor": "CLAUDE_CODE",
      "variant": "wish"
    },
    "base_branch": "main"
  }'

# Verify task status changed to "agent"
curl http://localhost:PORT/api/tasks/TASK_ID
```

### 3. Frontend Integration Test
1. Start dev server
2. Click Wishh widget workflow button
3. Verify task appears in widget (not in main Kanban)
4. Verify task has status="agent" in database
5. Verify task_attempt.executor contains ":wish"

## Next Steps

1. ✅ **Understanding Complete** - This document
2. 📝 **Regenerate Types** - Run cargo command
3. 📝 **Implement useAgentTasks hook** - Filter agent tasks by variant
4. 📝 **Update Widget API** - Connect to real endpoints
5. 📝 **Update Widget UI** - Show real agent tasks
6. 📝 **Test End-to-End** - Create task → Execute → View in widget

---

## Key Insights

### User Was Correct ✅
> "i think we already got the agent field in status"

The user was absolutely right! The migration file `20251020000001_add_agent_task_status.sql` already added "agent" to the TaskStatus enum.

### Variants Are Simple ✅
> "about the agent = wish remember we did only a frontend rename for the profile"

The user clarified that `wish`/`forge`/`review` are just variant strings passed to the executor profile. They're not separate types or enums - just labels.

### Minimal Backend Work ✅
The backend is **100% ready**. All we need is:
- Type regeneration (1 command)
- Frontend API integration (use existing endpoints)
- Widget filtering logic (match variant)

## Conclusion

The Genie Chat Widgets are **ready to integrate with minimal changes**:

1. **Type regeneration** brings "agent" status to frontend
2. **Existing API endpoints** support variant parameter
3. **Frontend filtering** can use status="agent" + variant matching
4. **No backend code changes** required

Total implementation effort: **~2-3 hours** for full integration.
