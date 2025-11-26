# QA Manual Testing: PR #246 Real-Time Performance

**Branch:** `fix/realtime-performance-phase1`
**Risk Areas:** WebSocket memory leaks, polling changes, cache invalidation, context re-renders

---

## Pre-Test Setup

1. Open browser DevTools → Performance Monitor (Memory)
2. Open Network tab, filter by "WS" for WebSocket connections
3. Have two browser tabs ready for visibility testing
4. Clear browser cache and local storage

---

## Test Suite 1: WebSocket Memory Leak Fix

**Component:** `useConversationHistory.ts`
**Risk:** Memory not released when switching attempts or unmounting

### Test 1.1: Attempt Navigation Memory
1. Navigate to a project with multiple tasks
2. Open a task with an attempt that has conversation history
3. Note memory usage in DevTools
4. Navigate to a different attempt (same or different task)
5. Repeat steps 3-4 ten times
6. **Expected:** Memory should stabilize, not continuously grow
7. **Fail Criteria:** Memory increases >50MB after 10 navigations without recovery

### Test 1.2: WebSocket Cleanup on Unmount
1. Open DevTools Network → WS filter
2. Navigate to attempt with active conversation
3. Note WebSocket connections (normalized-logs/ws, raw-logs/ws)
4. Navigate away from the attempt view entirely (e.g., to project list)
5. **Expected:** WebSocket connections should close (show "Closed" status)
6. **Fail Criteria:** WebSocket connections remain open after navigation

### Test 1.3: Rapid Navigation Stress Test
1. Open a task with attempts
2. Rapidly click between 3+ different attempts (spam clicking)
3. Wait 5 seconds
4. **Expected:** Only one set of WebSocket connections active, no console errors
5. **Fail Criteria:** Multiple duplicate connections, JS errors, memory spike

---

## Test Suite 2: Task Attempts Cache Invalidation

**Component:** `useTaskAttempts.ts`, `useTaskAttemptsWithLiveStatus.ts`
**Risk:** Stale attempt data after create/update/status change

### Test 2.1: New Attempt Creation
1. Open a task with existing attempts
2. Note the attempt count in the UI
3. Create a new attempt (click "Start Attempt" or equivalent)
4. **Expected:** Attempt list updates immediately (within 2 seconds)
5. **Fail Criteria:** Attempt list doesn't update until page refresh

### Test 2.2: Attempt Completion Detection
1. Open a task and start a new attempt
2. Let the attempt run until completion
3. Observe the attempt status in the list
4. **Expected:** Status updates from "running" to "completed" via WebSocket
5. **Fail Criteria:** Status stays "running" for >10 seconds after completion

### Test 2.3: Attempt Status in TaskPanel
1. Open TaskPanel for a task with a running attempt
2. Wait for the attempt to complete or fail
3. **Expected:** UI reflects new status without refresh
4. **Fail Criteria:** Shows stale status, requires manual refresh

### Test 2.4: ChatPanelActions Attempt List
1. Open chat panel for a task
2. Create a new attempt from the chat interface
3. **Expected:** Attempt appears in dropdown/list immediately
4. **Fail Criteria:** Attempt not visible until page refresh

---

## Test Suite 3: Branch Status Polling

**Component:** `useBranchStatus.ts`
**Risk:** Delayed branch status updates, background tab issues

### Test 3.1: Visible Tab Polling (15s interval)
1. Open an attempt view with branch status indicator
2. Open DevTools Network tab
3. Watch for `/api/attempts/{id}/branch-status` requests
4. Time the interval between requests
5. **Expected:** Requests every ~15 seconds while tab is active
6. **Fail Criteria:** Requests every 5 seconds (old behavior) or no requests

### Test 3.2: Background Tab Polling (60s interval)
1. Open attempt view with branch status
2. Switch to a different browser tab (keep DevTools open)
3. Wait 2 minutes, then switch back
4. Check Network tab for request timing
5. **Expected:** Requests spaced ~60 seconds apart while backgrounded
6. **Fail Criteria:** Requests at 15s interval while backgrounded, or no requests

### Test 3.3: Tab Focus Resume
1. Open attempt view, note branch status
2. Switch to another tab for 30 seconds
3. Switch back to the Forge tab
4. **Expected:** Data refreshes within 15 seconds of returning
5. **Fail Criteria:** Data stale for >30 seconds after returning

---

## Test Suite 4: Context Selector Re-render Prevention

**Component:** `ExecutionProcessesContext.tsx`, `RetryUiContext.tsx`
**Risk:** Excessive re-renders, broken selector behavior

### Test 4.1: Conversation View Performance
1. Open React DevTools Profiler
2. Navigate to an attempt with active execution process
3. Start recording in Profiler
4. Let messages stream in for 30 seconds
5. Stop recording
6. **Expected:** Components using selectors (e.g., status indicators) should show fewer renders than the message list
7. **Fail Criteria:** All components re-render on every message

### Test 4.2: Retry UI Context Isolation
1. Open an attempt with retry draft capability
2. Start a retry operation
3. Observe retry UI overlay/indicator
4. **Expected:** Retry UI updates correctly, greys out correct processes
5. **Fail Criteria:** Retry UI doesn't appear, wrong processes greyed, console errors

### Test 4.3: Execution Process Status Updates
1. Open an attempt that's actively running
2. Watch the execution process indicators
3. **Expected:** Status transitions (running → completed) display correctly
4. **Fail Criteria:** Status doesn't update, shows wrong state

---

## Test Suite 5: Query Keys Consistency

**Component:** `queryKeys.ts`
**Risk:** Cache invalidation failures due to key mismatches

### Test 5.1: Task CRUD Cache Sync
1. Create a new task
2. **Expected:** Task appears in task list immediately
3. Update the task title
4. **Expected:** Title updates in all views immediately
5. Delete the task
6. **Expected:** Task disappears from all views immediately
7. **Fail Criteria:** Any operation requires page refresh to see changes

### Test 5.2: Project Switch Cache Isolation
1. Open Project A, note task list
2. Switch to Project B
3. **Expected:** Project B's tasks load (not Project A's)
4. Switch back to Project A
5. **Expected:** Project A's tasks still cached correctly
6. **Fail Criteria:** Wrong project's data shown, or cache miss on every switch

### Test 5.3: Draft Images Cache
1. Open a task with draft that has images
2. View the images in draft editor
3. Navigate away and back
4. **Expected:** Images load from cache (fast), not re-fetched
5. **Fail Criteria:** Images re-fetch every navigation

---

## Test Suite 6: Deleted Functionality Verification

**Risk:** Features accidentally removed that were actually in use

### Test 6.1: Task Relationships (Verify NOT Needed)
1. Open a subtask (task with parent)
2. **Expected:** Subtask displays correctly (relationships loaded via different mechanism)
3. **Fail Criteria:** Parent task info missing, relationship data not shown

### Test 6.2: Mobile Layout (Verify Still Works)
1. Open Forge on mobile viewport (or resize browser to <768px)
2. Navigate through main flows
3. **Expected:** Mobile layout renders correctly
4. **Fail Criteria:** Layout broken, components missing

---

## Regression Checklist

| Area | Status | Tester | Notes |
|------|--------|--------|-------|
| WebSocket memory (1.1) | | | |
| WebSocket cleanup (1.2) | | | |
| Rapid navigation (1.3) | | | |
| Attempt creation (2.1) | | | |
| Attempt completion (2.2) | | | |
| TaskPanel status (2.3) | | | |
| ChatPanel attempts (2.4) | | | |
| Visible polling (3.1) | | | |
| Background polling (3.2) | | | |
| Tab resume (3.3) | | | |
| Re-render perf (4.1) | | | |
| Retry UI (4.2) | | | |
| Process status (4.3) | | | |
| Task CRUD (5.1) | | | |
| Project switch (5.2) | | | |
| Draft images (5.3) | | | |
| Task relationships (6.1) | | | |
| Mobile layout (6.2) | | | |

---

## Pass Criteria

- All 18 test cases pass
- No memory leaks detected (Suite 1)
- No console errors during testing
- No network request failures (except expected 4xx)
- Performance profile shows reduced re-renders vs baseline

## Fail Actions

1. Document exact reproduction steps
2. Capture browser console logs
3. Capture network waterfall
4. Note memory usage if relevant
5. Create GitHub issue with `bug` and `regression` labels
