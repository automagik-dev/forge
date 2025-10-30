# Genie Architecture - Corrections & Implementation Plan

**Date**: 2025-10-29
**Status**: Architecture clarified, needs frontend tabs implementation

---

## ✅ Corrected Understanding

### **System Architecture**

```
Master Genie (Orchestrator) - ONE per project
├── Session (TaskAttempt) - Created when user sends first message
│   ├── Branch: Current project branch (NOT hardcoded to 'main')
│   └── Executor: User's default OR selected executor
│
└── 3 Neurons (OPTIONAL, NOT automatic subtasks):
    ├── Wish Neuron - ONE per project
    │   └── Session (TaskAttempt) - Independent agent session
    ├── Forge Neuron - ONE per project
    │   └── Session (TaskAttempt) - Independent agent session
    └── Review Neuron - ONE per project
        └── Session (TaskAttempt) - Independent agent session
```

**KEY POINTS**:
1. **Neurons are NOT subtasks** - they're independent agents like Master Genie
2. **Neurons are NOT workflows** - they're persistent AI agents per project
3. **Each neuron has ONE permanent task** per project
4. **Sessions (attempts) are independent** for each agent
5. **NO automatic branching hierarchy** - each agent works on current branch

---

## 🐛 Current Issues

### **Issue #1: Hardcoded Branch in Master Genie**
**Location**: `frontend/src/services/subGenieApi.ts:344`
```typescript
async createMasterGenieAttempt(taskId: string): Promise<TaskAttempt> {
  const response = await fetch(`${this.baseUrl}/task-attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      executor_profile_id: {
        executor: BaseCodingAgent.CLAUDE_CODE, // ❌ Hardcoded executor
      },
      base_branch: 'main', // ❌ Hardcoded to 'main'
    }),
  });
}
```

**Fix Required**:
- Detect current branch: `branches.find((b) => b.is_current)?.name`
- Use user's default executor from config: `config.executor_profile`
- Make both changeable via hamburger menu in widget

---

### **Issue #2: Executor Hardcoded**
**Location**: Multiple places

**Problem**: Executor is hardcoded to `CLAUDE_CODE` everywhere

**Fix Required**:
- Use `config.executor_profile` from user settings
- Allow user to override per session
- Respect ExecutorProfileId format: `{ executor: BaseCodingAgent, variant: string | null }`

---

### **Issue #3: Missing Tabs UI**
**Status**: Backend API exists ✅, Frontend tabs missing ❌

**What exists**:
```typescript
// Backend API (already implemented)
GET /api/forge/master-genie/{attempt_id}/neurons
  → Returns: Neuron[] = [
      { type: 'wish', task: Task, attempt: TaskAttempt },
      { type: 'forge', task: Task, attempt: TaskAttempt },
      { type: 'review', task: Task, attempt: TaskAttempt }
    ]

// Frontend API service (already implemented)
subGenieApi.getNeurons(masterAttemptId) → Promise<Neuron[]>
```

**What's missing**:
- Tabs UI in `GenieMasterWidget.tsx`
- Tab switching between:
  1. Master Genie (main orchestrator)
  2. Wish neuron (planner specialist)
  3. Forge neuron (executor specialist)
  4. Review neuron (validator specialist)

---

### **Issue #4: Workflow System Misconception**

**INCORRECT Understanding**:
- ❌ Neurons create subtasks when workflows clicked
- ❌ Workflow buttons trigger task creation
- ❌ `executeWorkflow()` method creates child tasks

**CORRECT Understanding**:
- ✅ Neurons ARE the agents (like Master Genie)
- ✅ NO workflow buttons in neurons
- ✅ Each neuron is just a specialized chat agent
- ✅ Neurons chat interface identical to Master Genie

**What to remove**:
- `executeWorkflow()` method
- Workflow button system
- `getSubtasks()` API calls
- All "workflow execution" logic

**What to keep**:
- Neuron chat interfaces (same as Master Genie)
- Neuron task/attempt management
- Follow-up message system

---

## 🎯 Implementation Plan

### **Phase 1: Fix Master Genie Branch/Executor**

**Files to modify**:
1. `frontend/src/services/subGenieApi.ts`
   - `createMasterGenieAttempt()` - accept branch + executor params
   - `ensureMasterGenie()` - fetch current branch

2. `frontend/src/components/genie-widgets/GenieMasterWidget.tsx`
   - Add branch detection: `branches.find((b) => b.is_current)?.name`
   - Add executor from config: `config.executor_profile`
   - Add hamburger menu with:
     - Branch selector (reuse `BranchSelector` component)
     - Executor selector (reuse `ExecutorProfileSelector` component)

**Components to reuse**:
- `frontend/src/components/tasks/BranchSelector.tsx` ✅
- `frontend/src/components/settings/ExecutorProfileSelector.tsx` ✅

---

### **Phase 2: Implement Tabs UI**

**Files to modify**:
1. `frontend/src/components/genie-widgets/GenieMasterWidget.tsx`
   - Add tabs state: `activeTab: 'master' | 'wish' | 'forge' | 'review'`
   - Load neurons on mount: `subGenieApi.getNeurons(masterGenie.attempt.id)`
   - Render tab buttons (4 tabs)
   - Switch chat interface based on active tab

**Tab Structure**:
```tsx
<div className="tabs">
  <button onClick={() => setActiveTab('master')}>Genie</button>
  <button onClick={() => setActiveTab('wish')}>Wish</button>
  <button onClick={() => setActiveTab('forge')}>Forge</button>
  <button onClick={() => setActiveTab('review')}>Review</button>
</div>

{activeTab === 'master' && <MasterGenieChat />}
{activeTab === 'wish' && <NeuronChat neuron={neurons.wish} />}
{activeTab === 'forge' && <NeuronChat neuron={neurons.forge} />}
{activeTab === 'review' && <NeuronChat neuron={neurons.review} />}
```

**Chat Interface** (same for all 4):
- VirtualizedList (logs)
- TaskFollowUpSection (chat input)
- Same context providers

---

### **Phase 3: Neuron Session Management**

**When neuron tab is clicked**:
1. Check if neuron agent exists: `subGenieApi.getAgentTasks(projectId, 'wish')`
2. If not, create: `POST /api/forge/agents { agent_type: 'wish', project_id }`
3. Check if neuron has active attempt
4. If not, create: `POST /api/task-attempts { task_id: neuron.task_id, executor_profile_id, base_branch }`

**Use same logic as Master Genie**:
- Detect current branch
- Use user's default executor
- Show chat interface with logs

---

### **Phase 4: Remove Workflow System**

**Files to clean up**:
1. `frontend/src/config/genie-configs.ts`
   - Remove `workflows` arrays
   - Remove `skills` arrays
   - Keep only: `id`, `name`, `icon`, `color`, `columnStatus`

2. `frontend/src/components/genie-widgets/SubGenieWidget.tsx`
   - Remove WorkflowButton rendering
   - Remove SkillToggle rendering
   - Keep only chat interface

3. `frontend/src/services/subGenieApi.ts`
   - Remove `executeWorkflow()`
   - Remove `getSubtasks()`
   - Remove `triggerWorkflow()`
   - Remove `toggleSkill()`

---

## 📝 Summary of Neurons

**Neurons are NOT**:
- ❌ Subtasks
- ❌ Workflow executors
- ❌ Child processes

**Neurons ARE**:
- ✅ Independent AI agents (like Master Genie)
- ✅ Specialized by role (Planner, Executor, Validator)
- ✅ One permanent task per neuron per project
- ✅ Chat interfaces identical to Master Genie
- ✅ Work on current branch (same as Master Genie)

**Backend Implementation**:
- `forge_agents` table: ONE row per neuron per project
- `tasks` table: ONE task per neuron (status='agent')
- `task_attempts` table: Multiple sessions per neuron
- Neurons linked to Master via: `parent_task_attempt = master_attempt_id` (for organizational tracking only)

**Frontend Implementation**:
- 4 tabs in GenieMasterWidget
- Same chat UI for all 4 agents
- Neurons lazy-loaded when tab clicked
- Branch/executor settings shared across all agents (from hamburger menu)
