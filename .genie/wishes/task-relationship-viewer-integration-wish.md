# Wish: Integrate Task Relationship Viewer UI

**Status**: 🟡 Ready for Implementation
**Created**: 2025-11-02
**Updated**: 2025-11-02
**Owner**: Developer Team
**Tracking ID**: TRV-001
**Priority**: High
**Effort**: Medium (4-6 hours)

---

## Executive Summary

Integrate the fully-built but unused `TaskRelationshipViewer` component into the task viewing UI to make parent-child task relationships visible. This feature is critical for Forge neurons that create subtasks and for general subtask workflows. The backend, API, and UI component all exist and work - they just need to be connected.

**Impact**: Makes an existing powerful feature visible and usable. Currently, subtasks are created in the database but users have no UI to see or navigate parent-child relationships.

---

## Discovery Phase

### Current State

**Backend (WORKING ✅)**
- ✅ Database schema: `tasks.parent_task_attempt` references `task_attempts.id`
- ✅ Rust model: `TaskRelationships { parent_task, current_attempt, children }`
- ✅ API endpoint: `GET /api/task-attempts/:id/children` returns relationships
- ✅ Migration: `20250716170000_add_parent_task_to_tasks.sql` creates columns/indexes
- ✅ Query methods: `Task::find_relationships_for_attempt()` and `Task::find_children_by_attempt_id()`

**Frontend (DISCONNECTED ❌)**
- ✅ Component exists: `frontend/src/components/tasks/TaskRelationshipViewer.tsx`
- ✅ API client ready: `attemptsApi.getChildren(attemptId)` in `lib/api.ts`
- ✅ Component features:
  - Fetches relationships via API
  - Shows "PARENT TASK" section when task has parent
  - Shows "CHILD TASKS (N)" collapsible section
  - Provides navigation between parent/children
  - Handles loading/error states
  - Uses `TaskRelationshipCard` for display
- ❌ **NEVER IMPORTED OR USED ANYWHERE**

**Documentation**
- ✅ Feature documented: `docs/core-features/subtasks.mdx`
- ✅ Screenshots exist showing expected UI
- ✅ Describes parent-child workflow

**Problem**: Component is complete but orphaned. Users creating subtasks (manually or via Forge) see no visual indication of relationships.

### Desired State

**When viewing a task attempt:**
- See "PARENT TASK" section if task was created as a subtask
  - Shows parent task title
  - Click to navigate to parent task
- See "CHILD TASKS (N)" collapsible section if attempt created subtasks
  - Shows list of subtask titles
  - Click to navigate to any child task
  - Expand/collapse to save space

**When viewing a task (no specific attempt):**
- Show parent task info if task has `parent_task_attempt`
- Optionally show children created by latest attempt

**Special importance for Forge:**
- Forge Master neurons create subtasks to delegate work
- Backend correctly links subtasks via `parent_task_attempt`
- **Users currently have ZERO visibility into Forge's delegation structure**
- Cannot track which tasks are Forge-created subtasks
- Cannot navigate from Forge neuron to its subtasks

### Key Technical Context

**Component API:**
```typescript
interface TaskRelationshipViewerProps {
  selectedAttempt: TaskAttempt | null;
  onNavigateToTask?: (taskId: string) => void;
  task?: TaskWithAttemptStatus | null;
  tasksById?: Record<string, TaskWithAttemptStatus>;
}
```

**Integration Points:**
1. `TaskAttemptPanel.tsx` - Best place (has `attempt` directly)
2. `TaskPanel.tsx` - Secondary (only has `task`, not `attempt`)

**Files (both upstream + parent):**
- Component: `frontend/src/components/tasks/TaskRelationshipViewer.tsx`
- Panel 1: `frontend/src/components/panels/TaskAttemptPanel.tsx`
- Panel 2: `frontend/src/components/panels/TaskPanel.tsx`

---

## Implementation Plan

### Phase 1: TaskAttemptPanel Integration (Primary)

**File**: `frontend/src/components/panels/TaskAttemptPanel.tsx`

**Changes:**
1. Import `TaskRelationshipViewer` from `@/components/tasks/TaskRelationshipViewer`
2. Pass `attempt` prop (already available)
3. Add `onNavigateToTask` handler to navigate using `paths.task()`
4. Get `tasksById` from parent component (may need prop drilling)
5. Render component in appropriate location (below follow-up section or in sidebar)

**Advantages:**
- Has `attempt.id` directly available
- Natural place to show "who created this task" and "what tasks did this create"
- Full context for relationships

**Code location suggestion:**
```typescript
// In TaskAttemptPanel, add relationships section
{children({
  logs: <VirtualizedList ... />,
  followUp: <TaskFollowUpSection ... />,
  relationships: <TaskRelationshipViewer
    selectedAttempt={attempt}
    task={task}
    onNavigateToTask={handleNavigateToTask}
    tasksById={tasksById}
  />
})}
```

### Phase 2: TaskPanel Integration (Secondary)

**File**: `frontend/src/components/panels/TaskPanel.tsx`

**Changes:**
1. Import `TaskRelationshipViewer`
2. For tasks with `parent_task_attempt`:
   - Fetch parent attempt data
   - Pass to viewer to show parent
3. For tasks with attempts:
   - Use latest attempt to fetch children
   - Show children if any exist

**Challenge**: TaskPanel doesn't have `attempt`, only `task`

**Solutions:**
- Option A: Fetch latest attempt when task exists, pass to viewer
- Option B: Only show parent info (from `task.parent_task_attempt`)
- Option C: Skip TaskPanel integration (relationships only in TaskAttemptPanel)

**Recommendation**: Start with Option C (TaskAttemptPanel only), revisit later if needed.

### Phase 3: Both Repos (Upstream + Parent)

**Apply changes to:**
1. `upstream/frontend/src/components/panels/TaskAttemptPanel.tsx`
2. `frontend/src/components/panels/TaskAttemptPanel.tsx`

**Ensure:**
- Both repos get identical integration
- Component already exists in both (verified)
- API client already exists in both (verified)

---

## Technical Requirements

### Navigation Handler

```typescript
const handleNavigateToTask = useCallback((taskId: string) => {
  if (!projectId) return;
  navigate(paths.task(projectId, taskId));
  // Or navigate to latest attempt:
  // navigate(paths.attempt(projectId, taskId, 'latest'));
}, [projectId, navigate]);
```

### Prop Drilling (if needed)

May need to pass `tasksById` from `project-tasks.tsx` down through panels:
```
ProjectTasks (has tasksById)
  → TasksLayout
    → TaskAttemptPanel (needs tasksById)
      → TaskRelationshipViewer (uses tasksById)
```

**Alternative**: Fetch tasks within TaskRelationshipViewer (less efficient but simpler)

### Layout Considerations

**Where to place in UI:**
- Option A: Below follow-up section in main content area
- Option B: In right sidebar (if layout supports)
- Option C: In collapsible section within panel
- Option D: As separate tab in panel tabs

**Recommendation**: Start with Option A (below follow-up), iterate on placement based on UX feedback.

---

## Acceptance Criteria

### Functional Requirements
- [ ] TaskRelationshipViewer is imported and rendered in TaskAttemptPanel
- [ ] Parent task section appears when task is a subtask
- [ ] Child tasks section appears when attempt created subtasks
- [ ] Child tasks section is collapsible (shows count when collapsed)
- [ ] Clicking parent task navigates to parent task
- [ ] Clicking child task navigates to that task
- [ ] Loading state appears while fetching relationships
- [ ] Error state appears if API fails
- [ ] Component gracefully handles no relationships (shows nothing)

### Forge-Specific Requirements
- [ ] Forge Master neuron's subtasks are visible in "CHILD TASKS" section
- [ ] Subtask shows Forge Master as "PARENT TASK"
- [ ] Can navigate from Forge neuron attempt to any subtask
- [ ] Can navigate from subtask back to Forge neuron
- [ ] Relationships update when new subtasks are created

### Visual Requirements
- [ ] Component styling matches existing panel aesthetic
- [ ] Parent/child sections have clear visual separation
- [ ] TaskRelationshipCard shows task title and status
- [ ] Hover states on clickable elements
- [ ] Responsive layout on smaller screens

### Both Repos
- [ ] Integration works in upstream repo
- [ ] Integration works in parent repo
- [ ] No regressions in existing task/attempt panels
- [ ] Component behavior identical between repos

---

## Testing Strategy

### Manual Testing
1. **Create subtask manually**:
   - Create parent task, start attempt
   - Click "Create Subtask" from actions menu
   - Verify parent shows child in relationships
   - Verify child shows parent in relationships
   - Test navigation both directions

2. **Forge Master creates subtask**:
   - Start Forge Master neuron
   - Let it create subtasks
   - Verify Forge attempt shows children
   - Verify subtasks show Forge as parent
   - Test navigation

3. **Multiple levels**:
   - Create subtask
   - From subtask, create sub-subtask
   - Verify relationships show correctly at each level

4. **Edge cases**:
   - Task with no relationships (should show nothing)
   - Task with only parent (no children)
   - Task with only children (no parent)
   - Orphaned task (parent_task_attempt references deleted attempt)

### Regression Testing
- [ ] Task panel still works without attempt
- [ ] Attempt panel still shows logs and follow-up
- [ ] No performance degradation
- [ ] No visual layout breaks

---

## Files to Modify

### Upstream
- `upstream/frontend/src/components/panels/TaskAttemptPanel.tsx` (modify)
- `upstream/frontend/src/components/tasks/TaskRelationshipViewer.tsx` (already exists)

### Parent
- `frontend/src/components/panels/TaskAttemptPanel.tsx` (modify)
- `frontend/src/components/tasks/TaskRelationshipViewer.tsx` (already exists)

### Optional (Phase 2)
- `upstream/frontend/src/components/panels/TaskPanel.tsx`
- `frontend/src/components/panels/TaskPanel.tsx`

---

## Reference Materials

### Documentation
- Feature docs: `docs/core-features/subtasks.mdx`
- Backend model: `upstream/crates/db/src/models/task.rs:352-383` (find_relationships_for_attempt)
- API route: `upstream/crates/server/src/routes/task_attempts.rs` (getChildren endpoint)

### Component Files
- Viewer: `frontend/src/components/tasks/TaskRelationshipViewer.tsx`
- Card: `frontend/src/components/tasks/TaskRelationshipCard.tsx`
- API client: `frontend/src/lib/api.ts` (attemptsApi.getChildren)

### Related Features
- Subtask creation: `frontend/src/components/ui/ActionsDropdown.tsx:74-82`
- Task form: `frontend/src/components/dialogs/tasks/TaskFormDialog.tsx`

### Full Context File
- Detailed analysis: `/tmp/task-relationship-viewer-integration-context.md`

---

## Success Metrics

**User Impact:**
- Users can see subtask relationships for 100% of subtasks created
- Forge subtasks are discoverable and navigable
- Time to navigate parent↔child: < 1 second (single click)

**Developer Impact:**
- Feature utilization: Track usage of parent/child navigation
- Error rate: < 1% API failures for getChildren endpoint

**Product Impact:**
- Makes existing feature visible (from 0% to 100% discoverability)
- Unlocks Forge workflow visibility
- Enables hierarchical task organization

---

## Notes

### Why This Is High Priority
1. **Feature already exists** - just needs UI connection (low risk)
2. **Critical for Forge** - Master neurons invisible without it
3. **Quick win** - all components ready, minimal integration work
4. **High user value** - subtasks are powerful but currently invisible

### Future Enhancements (Not in Scope)
- Subtask creation from relationship viewer
- Bulk operations on child tasks
- Visualize full task hierarchy tree
- Filter kanban by subtask relationships
- Show relationship count on task cards

### Known Limitations
- Relationships only visible when viewing attempt (not standalone task view)
- Nested subtasks (grandchildren) not shown in single view
- No bulk navigation to all children
