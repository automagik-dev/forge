# QA Analysis: Widget Activation Implementation Strategy

**Date**: 2025-10-26 10:45 UTC
**Analyst**: Claude (QA Specialist)
**Scope**: Understanding why widget activation broke Kanban board and finding correct approach

---

## Executive Summary

❌ **Previous Implementation**: FAILED - Completely broke Kanban board functionality
✅ **Root Cause Identified**: Replaced entire Kanban infrastructure instead of enhancing it
✅ **Correct Approach Defined**: Enhance existing TaskKanbanBoard while preserving all functionality

---

## 1. What Went Wrong

### Previous Failed Approach
Location: `/home/namastex/workspace/automagik-forge/forge-overrides/frontend/src/pages/project-tasks.tsx` (deleted)

**What I did:**
- Replaced entire `TaskKanbanBoard` component with `KanbanBoardWithWidgets`
- Changed component props from `groupedTasks` to flat `tasks` array
- Removed all Kanban infrastructure

**Impact:**
- ❌ Lost drag-and-drop functionality (no KanbanProvider/DndContext)
- ❌ Lost proper Kanban layout (no KanbanBoard/KanbanCards components)
- ❌ Lost task card styling (replaced TaskCard with plain divs)
- ❌ Changed visual appearance completely (grid layout vs proper Kanban)
- ❌ Broke existing user workflows

---

## 2. Architecture Analysis

### Current TaskKanbanBoard (Working)
**File**: `upstream/frontend/src/components/tasks/TaskKanbanBoard.tsx`

**Structure:**
```tsx
<KanbanProvider onDragEnd={onDragEnd}>           // ← Drag-and-drop context
  {Object.entries(groupedTasks).map(([status, statusTasks]) => (
    <KanbanBoard key={status} id={status}>       // ← Column wrapper
      <KanbanHeader                               // ← Column header
        name={statusLabels[status]}
        color={statusBoardColors[status]}
        onAddTask={onCreateTask}
      />
      <KanbanCards>                               // ← Cards container
        {statusTasks.map((task, index) => (
          <TaskCard                               // ← Individual task
            key={task.id}
            task={task}
            index={index}
            status={status}
            onViewDetails={onViewTaskDetails}
            isOpen={selectedTask?.id === task.id}
          />
        ))}
      </KanbanCards>
    </KanbanBoard>
  ))}
</KanbanProvider>
```

**Key Features:**
- ✅ Drag-and-drop enabled via KanbanProvider
- ✅ Proper shadcn/ui Kanban components
- ✅ TaskCard component with all functionality (status indicators, actions menu)
- ✅ Proper styling and layout
- ✅ Works with `groupedTasks: Record<TaskStatus, Task[]>`

### KanbanBoardWithWidgets (Reference Implementation)
**File**: `forge-overrides/frontend/src/components/KanbanBoardWithWidgets.tsx`

**Structure:**
```tsx
<div className="grid grid-cols-5 gap-4">         // ← Simple grid (no DnD)
  {columnStatuses.map((status) => {
    if (config) {
      return (
        <ColumnWithWidget                         // ← Widget-enabled column
          config={config}
          projectId={projectId}
          taskCount={filteredTasks.length}
        >
          {/* Simple div for tasks */}            // ← Plain divs (no TaskCard)
        </ColumnWithWidget>
      );
    }
    return (
      <div className="flex flex-col">             // ← Plain column (no Kanban)
        {/* Custom header and tasks */}
      </div>
    );
  })}
</div>
```

**Problems with this approach:**
- ❌ No KanbanProvider (no drag-and-drop)
- ❌ No KanbanBoard/KanbanCards/TaskCard components
- ❌ Different visual style (grid vs Kanban layout)
- ❌ Simplified task rendering (divs vs TaskCard)
- ❌ Completely different component API (flat tasks vs grouped tasks)

### ColumnWithWidget Analysis
**File**: `forge-overrides/frontend/src/components/genie-widgets/ColumnWithWidget.tsx`

**Structure:**
```tsx
<div className="flex flex-col gap-0 h-full">
  <ColumnHeader                                   // ← Custom header with widget icon
    columnName={columnName}
    icon={config.icon}
    taskCount={taskCount}
    isWidgetOpen={isOpen}
    onIconClick={toggleWidget}
  />

  <div className="flex-1 overflow-y-auto p-4">
    {isOpen && (
      <SubGenieWidget {...props} />               // ← Chat widget
    )}

    <div className="mt-4">{children}</div>        // ← Task content
  </div>
</div>
```

**Key Insight:**
- ColumnWithWidget is a WRAPPER that adds header + widget functionality
- It renders `children` (which should be the task cards)
- The problem: It's designed for simple layouts, not Kanban infrastructure

---

## 3. Correct Integration Strategy

### Approach: Enhance TaskKanbanBoard (Not Replace)

**Goal**: Add widget functionality to existing TaskKanbanBoard while preserving all Kanban features

**Strategy**: Create a forge override of TaskKanbanBoard that:
1. ✅ Keeps KanbanProvider (preserves drag-and-drop)
2. ✅ Keeps KanbanBoard/KanbanCards/TaskCard (preserves layout)
3. ✅ Conditionally replaces KanbanHeader with custom widget header for Wish/Forge/Review
4. ✅ Keeps standard KanbanHeader for Done/Cancelled
5. ✅ Wraps entire component with SubGenieProvider (required for widgets)

### Integration Points

#### Point A: Header Replacement (Wish/Forge/Review columns)
**Current**:
```tsx
<KanbanHeader
  name={statusLabels[status]}
  color={statusBoardColors[status]}
  onAddTask={onCreateTask}
/>
```

**Enhanced** (for Wish/Forge/Review only):
```tsx
{genieId ? (
  <ColumnHeader
    columnName={columnName}
    icon={config.icon}
    taskCount={statusTasks.length}
    isWidgetOpen={isOpen}
    onIconClick={toggleWidget}
  />
) : (
  <KanbanHeader
    name={statusLabels[status]}
    color={statusBoardColors[status]}
    onAddTask={onCreateTask}
  />
)}
```

#### Point B: Widget Panel (Wish/Forge/Review columns)
**Add after KanbanHeader/ColumnHeader**:
```tsx
{genieId && isOpen && (
  <div className="p-4">
    <SubGenieWidget
      config={config}
      isOpen={isOpen}
      onClose={closeWidget}
      onSendMessage={onSendMessage}
      onWorkflowClick={onWorkflowClick}
      onSkillToggle={onSkillToggle}
      chatHistory={chatHistory}
      skillsState={skillsState}
      isLoading={isLoading}
    />
  </div>
)}
```

#### Point C: Preserve All Kanban Infrastructure
**Keep unchanged**:
- KanbanProvider wrapper
- KanbanBoard component
- KanbanCards container
- TaskCard rendering
- All drag-and-drop handlers
- All existing props and state

---

## 4. Implementation Plan

### Phase 1: Create Forge Override
**File**: `forge-overrides/frontend/src/components/tasks/TaskKanbanBoard.tsx`

**Steps**:
1. Copy `upstream/frontend/src/components/tasks/TaskKanbanBoard.tsx`
2. Add imports for widget components
3. Add widget state management (useSubGenieWidget hooks)
4. Add conditional header rendering (ColumnHeader vs KanbanHeader)
5. Add conditional widget panel rendering
6. Preserve ALL existing Kanban functionality

### Phase 2: Wrap with SubGenieProvider
**File**: `forge-overrides/frontend/src/pages/project-tasks.tsx` (or App.tsx)

**Ensure**:
- SubGenieProvider wraps the page/app
- All widget context is available

### Phase 3: Testing Checklist
**Before deployment**:
- [ ] Drag-and-drop works (move tasks between columns)
- [ ] Task cards render correctly (all status indicators, actions menu)
- [ ] Visual style matches original Kanban board
- [ ] Widget icons appear on Wish/Forge/Review headers
- [ ] Clicking widget icon opens/closes chat panel
- [ ] Chat panel renders correctly
- [ ] Done/Cancelled columns unchanged
- [ ] No console errors
- [ ] No visual regressions

---

## 5. Technical Requirements

### Required Imports (for TaskKanbanBoard override)
```typescript
// Existing Kanban imports
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { TaskCard } from './TaskCard';

// NEW: Widget imports
import { ColumnHeader, SubGenieWidget } from '@/components/genie-widgets';
import { useSubGenieWidget } from '@/hooks/useSubGenieWidget';
import { GENIE_CONFIGS, COLUMN_STATUS_TO_GENIE } from '@/config/genie-configs';
```

### Required State Management
```typescript
// For each column, need widget state:
const genieId = COLUMN_STATUS_TO_GENIE[status];
const config = genieId ? GENIE_CONFIGS[genieId] : null;

// Only create hook if column has widget
const widgetHook = config ? useSubGenieWidget(
  config.id,
  projectId,
  config.columnStatus
) : null;

const {
  isOpen,
  chatHistory,
  skillsState,
  isLoading,
  toggleWidget,
  closeWidget,
  onSendMessage,
  onWorkflowClick,
  onSkillToggle,
} = widgetHook || {};
```

### Additional Props Needed
```typescript
interface TaskKanbanBoardProps {
  groupedTasks: Record<TaskStatus, Task[]>;
  onDragEnd: (event: DragEndEvent) => void;
  onViewTaskDetails: (task: Task) => void;
  selectedTask?: Task;
  onCreateTask?: () => void;
  projectId: string; // ← NEW: Required for widget API calls
}
```

---

## 6. Risk Assessment

### High Risk Items
- ❌ **Replacing entire component** → Breaks all Kanban functionality
- ❌ **Changing component API** → Breaks parent component integration
- ❌ **Removing KanbanProvider** → Breaks drag-and-drop

### Low Risk Items
- ✅ **Adding conditional header** → Only affects header rendering
- ✅ **Adding widget panel** → Additive, doesn't break existing features
- ✅ **Keeping all Kanban infrastructure** → Preserves functionality

### Mitigation Strategy
1. Start with minimal changes (only header replacement)
2. Test each change incrementally
3. Verify no visual regressions after each step
4. Keep all existing props and handlers
5. Use feature flags if needed (enable/disable widgets)

---

## 7. Evidence Requirements

### Before Implementation
- [ ] Screenshot of current working Kanban board
- [ ] List of all current features (drag-and-drop, task actions, etc.)
- [ ] Documentation of current visual style

### During Implementation
- [ ] Screenshot after header replacement
- [ ] Screenshot after widget panel addition
- [ ] Console log verification (no errors)

### After Implementation
- [ ] Screenshot of final Kanban board with widgets
- [ ] Video of drag-and-drop functionality
- [ ] Video of widget interaction (open/close, workflows)
- [ ] Comparison screenshots (before vs after)
- [ ] Verification that Done/Cancelled columns unchanged

---

## 8. Validation Commands

### Build & Type Check
```bash
cd frontend && pnpm run lint
cd frontend && pnpm run format:check
cd frontend && pnpm exec tsc --noEmit
```

### Development Server
```bash
pnpm run dev
# Verify no console errors
# Test drag-and-drop
# Test widget interactions
```

---

## 9. Lessons Learned

### What Not To Do
- ❌ Don't replace entire components wholesale
- ❌ Don't change component APIs without understanding implications
- ❌ Don't remove infrastructure (DndContext, providers)
- ❌ Don't skip testing before declaring success
- ❌ Don't rush implementation without analysis

### What To Do
- ✅ Understand existing architecture first
- ✅ Enhance components incrementally
- ✅ Preserve all existing functionality
- ✅ Test each change before proceeding
- ✅ Document what could break
- ✅ Have rollback plan (delete forge override)

---

## 10. Critical Styling Issue Discovered

### Problem: ColumnHeader Visual Mismatch

**Current ColumnHeader** (`forge-overrides/frontend/src/components/genie-widgets/ColumnHeader.tsx:22`):
```tsx
<div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
```
- Simple div with gray background
- Solid border (`border-gray-200`)
- Padding: `px-4 py-2`

**Current KanbanHeader** (`upstream/frontend/src/components/ui/shadcn-io/kanban/index.tsx:163-171`):
```tsx
<Card
  className={cn(
    'sticky top-0 z-20 flex shrink-0 items-center gap-2 p-3 border-b border-dashed',
    'bg-background',
    ...
  )}
  style={{
    backgroundImage: `linear-gradient(hsl(var(${props.color}) / 0.03), hsl(var(${props.color}) / 0.03))`,
  }}
>
```
- Card component with elevation
- Dashed border (`border-dashed`)
- Sticky positioning (`sticky top-0 z-20`)
- Background color with gradient overlay
- Padding: `p-3`

### Impact
- ✅ Using current ColumnHeader → Visual inconsistency (different style from Done/Cancelled columns)
- ❌ Users will notice the style difference
- ❌ Breaks design system consistency

### Solution
Create a **Kanban-styled widget header component** that:
1. Uses `Card` component (matches KanbanHeader)
2. Uses `border-dashed` (matches KanbanHeader)
3. Uses `sticky top-0 z-20` (matches KanbanHeader)
4. Uses color gradient overlay (matches KanbanHeader)
5. Adds widget icon button to left side
6. Keeps Plus button on right side (for task creation)

### Proposed Component: `KanbanHeaderWithWidget`
```tsx
interface KanbanHeaderWithWidgetProps {
  name: string;
  color: string;
  taskCount: number;
  widgetIcon: LucideIcon;
  isWidgetOpen: boolean;
  onWidgetToggle: () => void;
  onAddTask?: () => void;
}

export const KanbanHeaderWithWidget = ({
  name,
  color,
  taskCount,
  widgetIcon: WidgetIcon,
  isWidgetOpen,
  onWidgetToggle,
  onAddTask,
}: KanbanHeaderWithWidgetProps) => {
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
      <button
        onClick={onWidgetToggle}
        className={cn(
          'p-1.5 rounded-lg transition-all',
          isWidgetOpen
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted text-muted-foreground'
        )}
        aria-label={`Toggle ${name} widget`}
      >
        <WidgetIcon className="h-4 w-4" />
      </button>

      {/* Column info (center) */}
      <span className="flex-1 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: `hsl(var(${color}))` }}
        />
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
                aria-label="Add task"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Add task</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Card>
  );
};
```

### Updated Integration Plan

**Step 1**: Create `KanbanHeaderWithWidget.tsx` in `forge-overrides/frontend/src/components/tasks/`
- Match KanbanHeader styling exactly
- Add widget icon button
- Preserve all existing features

**Step 2**: Create TaskKanbanBoard override that uses:
- `KanbanHeaderWithWidget` for Wish/Forge/Review columns
- `KanbanHeader` for Done/Cancelled columns
- Both headers will have identical visual style

**Step 3**: Add widget panel rendering after header (inside KanbanBoard)

---

## 11. Next Steps

1. **Review this QA analysis** with user for approval
2. **Create KanbanHeaderWithWidget component** (matches KanbanHeader style)
3. **Create minimal forge override** of TaskKanbanBoard
4. **Test incrementally** at each integration point
5. **Document any issues** encountered
6. **Capture evidence** (screenshots, videos)
7. **Get user approval** before considering task complete

---

## Files Referenced

**Upstream Files (Read-Only):**
- `upstream/frontend/src/components/tasks/TaskKanbanBoard.tsx` - Current working Kanban board
- `upstream/frontend/src/components/tasks/TaskCard.tsx` - Task card component
- `upstream/frontend/src/components/ui/shadcn-io/kanban/index.tsx` - Kanban UI primitives
- `upstream/frontend/src/pages/project-tasks.tsx` - Page using TaskKanbanBoard

**Forge Override Files (Can Modify):**
- `forge-overrides/frontend/src/components/KanbanBoardWithWidgets.tsx` - Reference implementation (DO NOT USE directly)
- `forge-overrides/frontend/src/components/genie-widgets/ColumnWithWidget.tsx` - Widget wrapper component
- `forge-overrides/frontend/src/components/genie-widgets/ColumnHeader.tsx` - Custom header with widget icon
- `forge-overrides/frontend/src/components/genie-widgets/SubGenieWidget.tsx` - Chat widget component
- `forge-overrides/frontend/src/hooks/useSubGenieWidget.ts` - Widget state management hook
- `forge-overrides/frontend/src/config/genie-configs.ts` - Widget configurations
- `forge-overrides/frontend/src/services/subGenieApi.ts` - Backend API service (fixed import)

**Target File (To Create):**
- `forge-overrides/frontend/src/components/tasks/TaskKanbanBoard.tsx` - Enhanced Kanban board with widgets

---

## Conclusion

The previous implementation failed because it tried to **replace** the Kanban board instead of **enhancing** it. The correct approach is to create a forge override of `TaskKanbanBoard.tsx` that adds widget functionality while preserving all existing Kanban infrastructure, drag-and-drop, and visual styling.

**Status**: Ready for implementation pending user approval
**Confidence**: High - Architecture analysis complete, integration points identified
**Risk Level**: Low - Strategy preserves all existing functionality
