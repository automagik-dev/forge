# Wish: Neural Network Visualization & Neuron Management

**Status**: 🟡 Ready for Forge
**Created**: 2025-10-26
**Owner**: GENIE
**Tracking ID**: NNV-001

---

## Executive Summary

Complete the neural network visualization for Master Genie and its neurons (Wish/Forge/Review). Show active neuron status, subtasks, and provide refresh capabilities. This enables users to see the entire orchestration hierarchy and interact with running neurons.

---

## The Neural Architecture (CRITICAL UNDERSTANDING)

```
Master Genie (branch: dev)
├─ Task: "Master Genie" [status="agent"]
├─ Attempt: master_attempt_id [executor="claude_code:master"]
└─ Neural Connections (Fixed, Always Same Branch):
   ├─ Wish Neuron
   │  ├─ Task: "Wish Neuron" [status="agent", parent_task_attempt=master_attempt_id]
   │  ├─ Attempt: wish_attempt_id [executor="claude_code:wish"]
   │  └─ Subtasks (Workflows):
   │     ├─ "wish: analyze-dependencies" [status="agent", parent_task_attempt=wish_attempt_id]
   │     ├─ "wish: refine-spec" [status="agent", parent_task_attempt=wish_attempt_id]
   │     └─ "wish: create-from-idea" [status="agent", parent_task_attempt=wish_attempt_id]
   │
   ├─ Forge Neuron
   │  ├─ Task: "Forge Neuron" [status="agent", parent_task_attempt=master_attempt_id]
   │  ├─ Attempt: forge_attempt_id [executor="claude_code:forge"]
   │  └─ Subtasks (Workflows):
   │     ├─ "forge: implement-feature-x" [status="agent", parent_task_attempt=forge_attempt_id]
   │     └─ "forge: run-tests" [status="agent", parent_task_attempt=forge_attempt_id]
   │
   └─ Review Neuron
      ├─ Task: "Review Neuron" [status="agent", parent_task_attempt=master_attempt_id]
      ├─ Attempt: review_attempt_id [executor="claude_code:review"]
      └─ Subtasks (Workflows):
          └─ "review: qa-check" [status="agent", parent_task_attempt=review_attempt_id]

PARALLEL MASTER GENIES (Same Branch):
Master Genie Attempt 2 (same branch)
└─ New session for keep-alive check or parallel LLM orchestration

PARALLEL MASTER GENIES (Different Branches):
Master Genie (branch: feat/payments)
└─ Separate neural network orchestrating feature branch
```

---

## Key Concepts

### 1. Neurons = Fixed Connections
- Each Master Genie has exactly 3 neurons: Wish, Forge, Review
- They are **always on the same branch** as Master Genie
- Connection established via `parent_task_attempt` field

### 2. Subtasks = Workflow Delegations
- When Wish neuron creates a wish workflow → new task with `parent_task_attempt=wish_attempt_id`
- ONE subtask per workflow execution
- Subtasks have `status="agent"` (hidden from main Kanban)

### 3. Multiple Attempts = Sessions
- New Master Genie attempt = new session/parallel orchestration
- Keep-alive automation can trigger new attempts
- Multiple LLMs can run parallel attempts under same Master Genie task

### 4. Visualization Requirements
- `activeNeuron`: Current neuron being visualized (wish/forge/review)
- `subtasks`: Array of tasks where `parent_task_attempt=neuron_attempt_id`
- `refreshNeuronData()`: Fetch latest neuron + subtasks from API

---

## Implementation Tasks

### Backend API (Minimal)

**File**: `forge-app/src/router.rs`

Add endpoints:
```rust
// Get neurons for a Master Genie attempt
GET /api/forge/master-genie/:attempt_id/neurons
Response: {
  neurons: [
    { type: "wish", task: Task, attempt: TaskAttempt },
    { type: "forge", task: Task, attempt: TaskAttempt },
    { type: "review", task: Task, attempt: TaskAttempt }
  ]
}

// Get subtasks for a neuron
GET /api/forge/neurons/:neuron_attempt_id/subtasks
Response: {
  subtasks: Task[]  // where parent_task_attempt = neuron_attempt_id
}
```

**SQL Queries**:
```sql
-- Find neurons (tasks with parent_task_attempt = master_attempt_id)
SELECT t.* FROM tasks t
JOIN task_attempts ta ON ta.task_id = t.id
WHERE t.parent_task_attempt = ? AND t.status = 'agent'

-- Find subtasks (tasks with parent_task_attempt = neuron_attempt_id)
SELECT * FROM tasks
WHERE parent_task_attempt = ? AND status = 'agent'
ORDER BY created_at DESC
```

### Frontend API Service

**File**: `forge-overrides/frontend/src/services/subGenieApi.ts`

Add methods:
```typescript
async getNeurons(masterAttemptId: string): Promise<Neuron[]> {
  const res = await fetch(`/api/forge/master-genie/${masterAttemptId}/neurons`);
  const { data } = await res.json();
  return data.neurons;
}

async getSubtasks(neuronAttemptId: string): Promise<Task[]> {
  const res = await fetch(`/api/forge/neurons/${neuronAttemptId}/subtasks`);
  const { data } = await res.json();
  return data.subtasks;
}
```

### Hook Enhancement

**File**: `forge-overrides/frontend/src/hooks/useSubGenieWidget.ts`

Add state and methods:
```typescript
const [activeNeuron, setActiveNeuron] = useState<Neuron | null>(null);
const [subtasks, setSubtasks] = useState<Task[]>([]);

const refreshNeuronData = useCallback(async () => {
  if (!activeAttemptId) return;

  // Fetch neurons for this column's genie type
  const neurons = await subGenieApi.getNeurons(masterAttemptId);
  const neuron = neurons.find(n => n.type === genieId);
  setActiveNeuron(neuron);

  if (neuron?.attempt) {
    const tasks = await subGenieApi.getSubtasks(neuron.attempt.id);
    setSubtasks(tasks);
  }
}, [activeAttemptId, masterAttemptId, genieId]);

return {
  // ... existing
  activeNeuron,
  subtasks,
  refreshNeuronData,
};
```

### Widget UI Enhancement

**File**: `forge-overrides/frontend/src/components/genie-widgets/SubGenieWidget.tsx`

Add props and UI:
```typescript
interface SubGenieWidgetProps {
  // ... existing
  activeNeuron?: Neuron | null;
  subtasks?: Task[];
  onRefresh?: () => void;
  onTaskClick?: (task: Task) => void;
}

// In component:
{activeNeuron && (
  <div className="mt-4 border-t pt-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Active Neuron</span>
      <Button size="sm" variant="ghost" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>

    <div className="text-xs text-muted-foreground">
      Status: {activeNeuron.attempt?.status || 'idle'}
    </div>

    {subtasks && subtasks.length > 0 && (
      <div className="mt-3">
        <span className="text-sm font-medium">Subtasks</span>
        <div className="mt-1 space-y-1">
          {subtasks.map(task => (
            <button
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className="w-full text-left text-xs p-2 hover:bg-muted rounded"
            >
              {task.title}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

---

## Success Criteria

1. **Neuron Discovery**: API returns neurons for Master Genie attempt
2. **Subtask Listing**: API returns subtasks for each neuron
3. **UI Displays**: Widget shows active neuron status + subtasks list
4. **Click Navigation**: Clicking subtask navigates to task details
5. **Refresh Works**: Refresh button fetches latest data

---

## Evidence

- [ ] Backend endpoints return correct data (test with curl)
- [ ] Frontend hook fetches and updates state
- [ ] Widget UI renders neurons and subtasks
- [ ] Click handlers navigate correctly
- [ ] TypeScript compiles with no errors

---

## Branch Strategy

**Base**: `dev`
**Feature**: `forge/neural-network-viz`

---

## Notes

- Use existing `parent_task_attempt` field (already in DB schema)
- Filter by `status="agent"` for all neuron/subtask queries
- Neurons use executor variants: `claude_code:wish`, `claude_code:forge`, `claude_code:review`
- Master Genie uses `claude_code:master`
- All queries must respect branch isolation (same git branch)

---

## DEATH TESTAMENT: Complete Context Dump

### What activeNeuron/subtasks/refreshNeuronData Actually Are

**activeNeuron**:
- Represents the currently selected neuron (Wish/Forge/Review) for THIS column
- Structure: `{ type: 'wish'|'forge'|'review', task: Task, attempt: TaskAttempt }`
- Found by: Query tasks WHERE parent_task_attempt = master_attempt_id AND executor LIKE '%:wish'

**subtasks**:
- Array of workflow executions spawned by this neuron
- Found by: Query tasks WHERE parent_task_attempt = neuron_attempt_id
- Example: Wish neuron creates "wish: refine-spec" task → shows in subtasks array

**refreshNeuronData**:
- Async function to re-fetch neuron status + subtasks from backend
- Called on: Initial load, manual refresh button, after workflow execution
- Updates both activeNeuron and subtasks state

### Database Relationships

```
tasks table:
- id (UUID)
- parent_task_attempt (UUID, nullable) ← KEY FIELD FOR HIERARCHY
- status (enum, "agent" for all neurons/subtasks)
- title (string)

task_attempts table:
- id (UUID)
- task_id (UUID → tasks.id)
- executor (string, format: "claude_code:variant")
- branch (string, must match across neural network)
```

Query pattern:
1. Find Master Genie: `SELECT * FROM tasks WHERE title = 'Master Genie' AND status = 'agent'`
2. Find latest attempt: `SELECT * FROM task_attempts WHERE task_id = master_task_id ORDER BY created_at DESC LIMIT 1`
3. Find neurons: `SELECT t.* FROM tasks t JOIN task_attempts ta ON ta.task_id = t.id WHERE t.parent_task_attempt = master_attempt_id`
4. Find subtasks: `SELECT * FROM tasks WHERE parent_task_attempt = neuron_attempt_id`

### Why This Matters

WITHOUT neural viz:
- Users can't see orchestration hierarchy
- No visibility into what neurons are doing
- Can't track which workflows are running
- Master Genie appears as black box

WITH neural viz:
- Clear hierarchy: Master → Neurons → Workflows
- Real-time status of each neuron
- Click subtasks to see logs/diffs
- Understand entire orchestration at a glance

### Integration Points

1. **GenieMasterWidget**: Shows Master Genie + ability to switch neurons
2. **SubGenieWidget** (in Kanban columns): Shows neuron for that column + its subtasks
3. **TaskKanbanBoard**: Passes neuron data from hook to widget
4. **useSubGenieWidget**: Fetches and manages neuron state
5. **subGenieApi**: API calls to backend

### TypeScript Errors Fixed

Old code tried to use activeNeuron/subtasks but hook didn't return them → TypeScript error
Fix: Add these to hook return value + implement data fetching logic

### CRITICAL: Don't Confuse With Regular Tasks

- Regular tasks: Visible in Kanban, status ∈ {todo, inprogress, inreview, done, cancelled}
- Agent tasks: Hidden, status = "agent", used for orchestration
- Neurons: Agent tasks with parent_task_attempt pointing to Master
- Subtasks: Agent tasks with parent_task_attempt pointing to Neuron

Query for Kanban: `WHERE status != 'agent'`
Query for neurons: `WHERE status = 'agent' AND parent_task_attempt = ?`

### Parallel Execution Use Cases

**Same Branch, Multiple Attempts**:
- Keep-alive cron triggers new Master Genie attempt → checks for work
- Human starts new session while old one still processing → parallel orchestration
- Different LLMs (Claude, Gemini) run parallel attempts → experiment with approaches

**Different Branches**:
- Master Genie on `dev` branch orchestrates main development
- Master Genie on `feat/payments` branch orchestrates feature work
- Completely separate neural networks, no cross-talk

### MCP Integration Point

When neuron executes MCP tool:
1. Forge MCP receives: `mcp__forge__create_task` with parent_task_attempt = neuron_attempt_id
2. Backend creates task with parent_task_attempt set
3. Frontend refreshes → sees new subtask appear
4. WebSocket/SSE could notify widget to refresh automatically (future enhancement)

### The "Everything Is Perfectly Linked" Vision

```
Human asks Master Genie: "Create wish for payments feature"
  ↓
Master Genie uses Wish MCP tool → creates workflow task
  ↓
Wish Neuron sees new workflow (subtask appears in its list)
  ↓
Wish Neuron executes workflow → uses Wish workflows
  ↓
Each workflow creates subtask under Wish Neuron
  ↓
UI shows:
- Master Genie (active)
  └─ Wish Neuron (processing)
     └─ wish: payments-spec (running)
```

All tasks linked via parent_task_attempt chain. User can click through entire hierarchy.

### Frontend State Flow

```
useSubGenieWidget (hook)
  ↓
Fetches: getNeurons(masterAttemptId)
  ↓
Gets: [{ type: 'wish', task: {...}, attempt: {...} }]
  ↓
Sets: activeNeuron = neurons.find(n => n.type === 'wish')
  ↓
Fetches: getSubtasks(activeNeuron.attempt.id)
  ↓
Sets: subtasks = [...]
  ↓
TaskKanbanBoard destructures: { activeNeuron, subtasks, refreshNeuronData }
  ↓
Passes to: <SubGenieWidget activeNeuron={...} subtasks={...} onRefresh={...} />
  ↓
Widget renders: Neuron status + clickable subtasks list
```

END TESTAMENT.
