# User Journeys - E2E Testing Foundation

This document describes the key user journeys in Automagik Forge, discovered through live exploration with Playwright MCP. These journeys form the foundation for our E2E testing strategy.

## Philosophy

Tests should follow **real user journeys** from start to finish, not isolated micro-interactions. When you watch a test run, it should make sense as a complete user story.

## Journey 1: Returning User - Create and Execute Task

**User Goal:** Create a new task and start working on it with an AI agent.

### Steps

1. **Navigate to Project**
   - Starting point: Projects list (`/projects`)
   - Action: Click on a project card
   - Result: Kanban board loads showing all tasks
   - Screenshot: `01-projects-list.png`, `02-kanban-board.png`

2. **View Kanban Board**
   - User sees 5 columns: Wish, Forge, Review, Done, Archived
   - Can see all existing tasks organized by status
   - Screenshot: `02-kanban-board.png`

3. **Create New Task**
   - Action: Click "Create new task" button (+ icon in header)
   - Result: "Create New Task" modal opens
   - Form fields:
     - Title (required)
     - Description (optional, supports @ mentions)
     - Images (collapsible section)
     - Provider selector (default: OpenAI CODEX)
     - Agent selector (default: GENIE)
     - Branch selector (default: dev)
   - Screenshot: `03-create-task-modal.png`

4. **Fill Task Details**
   - Action: Enter title and description
   - Result: "Create Task" and "Create & Start" buttons become enabled
   - Screenshot: `04-create-task-filled.png`

5. **Submit Task Creation**
   - Action: Click "Create Task" button
   - Result:
     - Modal closes
     - Task appears at top of Wish column
     - Task details panel opens automatically on the left side
     - Kanban board visible on the right side
     - URL updates to include task ID
   - Screenshot: `05-task-details-panel.png`

6. **View Task Details**
   - Left panel shows:
     - Task title (editable)
     - Task description (editable)
     - Attempts section with count (0 initially)
     - "Start new attempt" button
     - "No attempts yet" message
   - Right panel shows kanban board with the new task highlighted

7. **Start New Attempt**
   - Action: Click "Start new attempt" button
   - Result: "Create Attempt" modal opens
   - Modal content:
     - Explanation: "Start a new attempt with a coding agent. A git worktree and task branch will be created."
     - Provider selector (default: OpenAI CODEX)
     - Agent selector (default: GENIE)
     - Base branch selector (required, default: dev)
     - Cancel and Start buttons
   - Screenshot: `06-create-attempt-modal.png`

8. **Configure and Launch Attempt**
   - Action: Click "Start" button
   - Expected result (not tested to avoid git operations):
     - Git worktree created
     - Task branch created
     - Agent begins execution
     - Task moves to Forge column
     - Attempt appears in task details

### Key Elements for Testing

- `data-testid="task-card"` - Task cards in kanban
- `getByRole('button', { name: 'Create new task' })` - Create task button
- `getByRole('textbox', { name: 'Title' })` - Task title input
- `getByRole('button', { name: 'Create Task' })` - Submit button
- `getByRole('button', { name: 'Start new attempt' })` - Start attempt button

### Test Assertions

- ✅ Projects list loads
- ✅ Kanban board displays with 5 columns
- ✅ Create task modal opens
- ✅ Form validation (buttons disabled until title filled)
- ✅ Task appears in Wish column after creation
- ✅ Task details panel opens automatically
- ✅ URL updates to task-specific route
- ✅ Start attempt modal opens
- ✅ Attempt configuration has proper defaults

---

## Journey 2: New User - Onboarding (To Be Explored)

**User Goal:** First-time user completes onboarding and creates their first task.

**Status:** Not yet explored. User mentioned this exists.

### Investigation Needed

- How to trigger onboarding? (clear localStorage? incognito mode?)
- What steps are in the onboarding flow?
- What does the user learn?
- How does it transition to the main app?

---

## Journey 3: Returning User - View Existing Task (To Be Explored)

**User Goal:** Click on an existing task card to view its details.

**Status:** Partially covered (happens automatically after creation), but should test clicking existing tasks.

---

## Journey 4: Returning User - Execute Task with Attempt (To Be Explored)

**User Goal:** View progress of a running attempt and interact with the AI agent.

**Status:** Not explored (would require actually creating an attempt).

---

## Journey 5: Real-Time Performance (PR #246 Regression)

**Purpose:** Validate performance fixes from PR #246 to prevent regressions.

**Test File:** `tests/e2e/journey-pr246-performance.spec.ts`

### What It Tests

1. **WebSocket Memory Leak Prevention**
   - Memory stabilizes after repeated attempt navigation
   - WebSocket connections close when navigating away
   - Rapid navigation stress test (no duplicate connections)

2. **Event-Driven Cache Invalidation**
   - Task list updates on WebSocket events (no polling needed)
   - Task updates/deletes reflect immediately
   - Multiple rapid operations maintain consistency

3. **Smart Polling Intervals**
   - Branch status polls at ~15s when tab is visible
   - Polling continues after page interactions

4. **Cache Consistency**
   - Project switch maintains cache isolation
   - No stale data after switching views

### Key PR #246 Files Tested

| Frontend File | Fix |
|---------------|-----|
| `useConversationHistory.ts` | WebSocket controller cleanup via `activeControllersRef` |
| `useTaskAttempts.ts` | Removed polling, added event-driven invalidation |
| `useBranchStatus.ts` | Smart polling (15s visible, 60s background) |
| `ExecutionProcessesContext.tsx` | use-context-selector for re-render optimization |

### Running These Tests

```bash
# Run PR #246 tests only
pnpm test:playwright journey-pr246-performance

# Run with --workers=1 for accurate timing measurements
pnpm test:playwright journey-pr246-performance --workers=1
```

### Helpers Added

- `setupWebSocketTracker(page)` - Track WS open/close events
- `setupPollingTracker(page, urlPattern)` - Track polling intervals
- `getMemoryUsage(page)` - Get JS heap size
- `assertMemoryStabilized(samples)` - Check memory plateaus
- `navigateToAttempt(page, projectId, taskId, attemptId)` - Direct attempt navigation

---

## Testing Strategy

### What Makes a Good E2E Test?

1. **Follows a complete user journey** - Start to finish, not isolated actions
2. **Makes sense when watching** - Someone watching should understand what's being tested
3. **Tests real value** - Does the user accomplish their goal?
4. **Uses semantic selectors** - getByRole, getByText, getByLabel (accessibility-first)
5. **Auto-waits** - No manual timeouts, use Playwright's built-in waiting

### What to Avoid

❌ Testing micro-interactions in isolation (hover effects, dropdown opens)
❌ Testing implementation details (CSS classes, internal state)
❌ Manual waits (`page.waitForTimeout()`)
❌ Brittle selectors (CSS classes that might change)

### Recommended Test Files

Based on these journeys:

1. `tests/e2e/journey-create-task.spec.ts` - Journey 1 (full flow)
2. `tests/e2e/journey-onboarding.spec.ts` - Journey 2 (when explored)
3. `tests/e2e/journey-view-task.spec.ts` - Journey 3
4. `tests/e2e/journey-execute-task.spec.ts` - Journey 4 (when explored)

---

## Screenshots Reference

All screenshots saved to `.playwright-mcp/`:

- `01-projects-list.png` - Projects landing page
- `02-kanban-board.png` - Kanban board with 20 tasks
- `03-create-task-modal.png` - Empty create task form
- `04-create-task-filled.png` - Filled create task form
- `05-task-details-panel.png` - Task details panel after creation
- `06-create-attempt-modal.png` - Create attempt modal

---

## Next Steps

1. ✅ Explore Journey 1 (Create and Execute Task) - DONE
2. ⏳ Explore Journey 2 (Onboarding flow)
3. ⏳ Create journey-based E2E tests
4. ⏳ Replace old micro-interaction tests with journey tests
5. ⏳ Document additional journeys as discovered
