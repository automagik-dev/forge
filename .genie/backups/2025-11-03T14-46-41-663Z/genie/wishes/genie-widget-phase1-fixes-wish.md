# Wish: Genie Widget Phase 1 Critical Fixes

**Status**: 🔴 Draft
**Created**: 2025-10-28
**Updated**: 2025-10-28
**Owner**: GENIE (Master Orchestrator)
**Tracking ID**: GWF-001

---

## Executive Summary

Fix 8 critical bugs in the Genie Master Widget identified during initial deployment testing. These fixes focus on UX issues (redundant buttons, missing keyboard shortcuts), backend bugs (task status corruption), and error handling (WebSocket failures, process warnings). This wish targets a stable, production-ready widget experience for the next release.

---

## Discovery Phase

### Current State
- **Genie Master Widget** deployed in `forge-overrides/frontend/src/components/genie-widgets/GenieMasterWidget.tsx`
- **Minimized bar** shows redundant Minimize button (should only show Maximize + Close)
- **No keyboard shortcuts** (ESC, click-outside) for dismissing widget
- **Maximize button works** but needs verification it navigates correctly
- **Lamp ball position** causes UI interference (currently `bottom-4 right-4`)
- **WebSocket errors** spam console when loading historic execution processes
- **"More than one active execution process"** warning appears during concurrent operations
- **VirtuosoMessageList license warning** (upstream component, dev-only)
- **Task status bug**: Agent tasks (`status: "agent"`) auto-transition to `inreview` after widget usage
- **Duplicate greeting messages**: User sends "hi", sees both system greeting + response

### Desired State
- **Clean minimized bar**: Only Maximize + Close buttons (no redundant Minimize)
- **Keyboard/click UX**: ESC key and click-outside auto-minimize widget
- **Verified maximize**: Confirm navigation to full cockpit with correct URL params
- **Better lamp position**: Move to less intrusive location or make collapsible
- **Graceful WebSocket handling**: Suppress errors for historic processes, show friendly fallback
- **Process warning clarity**: Either allow multiple processes or improve error messaging
- **License warning ignored**: Document as known issue (no action needed for now)
- **Task status preserved**: Agent tasks remain `status: "agent"` after widget interactions
- **Single greeting**: Suppress duplicate system greeting or mark as automatic welcome

### Key Technical Context
- **Frontend**: React 18 + TypeScript + Vite, shadcn/ui components
- **Widget Component**: `forge-overrides/frontend/src/components/genie-widgets/GenieMasterWidget.tsx` (332 lines)
- **WebSocket Hook**: `upstream/frontend/src/hooks/useConversationHistory.ts` (545 lines)
- **API Service**: `forge-overrides/frontend/src/services/subGenieApi.ts` (402 lines)
- **Backend**: Rust Axum server, SQLx migrations, task/attempt models
- **Status Bug**: Likely in backend task attempt creation or approval logic

---

## Spec Contract

### In Scope ✅

1. **Icon Fixes** (Easy)
   - Remove redundant Minimize button from minimized bar (lines 154-160)
   - Keep only Maximize + Close buttons

2. **Keyboard/Click UX** (Medium)
   - Add ESC key listener to minimize widget
   - Add click-outside detection to auto-minimize
   - Implement `useOnClickOutside` hook or similar

3. **Maximize Verification** (Easy)
   - Test maximize button navigates to `/projects/:projectId/tasks/:taskId/attempts/:attemptId?view=diffs`
   - Confirm all URL params pass correctly
   - Document expected behavior

4. **Lamp Ball Repositioning** (Easy)
   - Move from `bottom-4 right-4` to less intrusive position
   - Consider `bottom-6 right-6` or collapsible design
   - Ensure z-index doesn't block other UI elements

5. **WebSocket Error Handling** (Medium)
   - Gracefully handle WebSocket connection failures for historic processes
   - Suppress console errors, show user-friendly message if needed
   - Add retry logic with exponential backoff (already exists, verify)

6. **Process Warning Improvement** (Easy)
   - Update error message to include process IDs for debugging
   - OR: Remove error if multiple processes are expected behavior
   - Document expected concurrency model

7. **License Warning Documentation** (Low)
   - Add comment in code explaining VirtuosoMessageList warning
   - Document as known dev-only issue (no action required)

8. **Task Status Bug Investigation & Fix** (CRITICAL)
   - Investigate backend code causing `agent → inreview` transition
   - Add logic to preserve `agent` status for agent-owned tasks
   - Test with Master Genie widget workflow
   - Validate forge_agents table integration

9. **Duplicate Greeting Suppression** (Easy)
   - Suppress initial system greeting message
   - OR: Mark system greeting as automatic welcome (visual indicator)
   - Ensure user's first message is clearly distinguished

### Out of Scope ❌
- Tab system (Genie | Wish | Forge | Review) → Phase 2
- Per-neuron chat sessions → Phase 2
- Attempts dropdown/list → Phase 3
- Subtasks navigation → Phase 3
- Full cockpit state sync → Phase 4
- Draggable lamp ball → Future enhancement
- Chat history persistence → Phase 4
- VirtuosoMessageList replacement → Future consideration (license purchase or alternative library)

---

## Success Metrics

| Metric | Definition | How to Validate |
|--------|-----------|-----------------|
| **Icon Clarity** | Minimized bar shows only Maximize + Close (no redundant Minimize) | Visual inspection + screenshot |
| **Keyboard UX** | ESC key minimizes widget | Test: Open widget → Press ESC → Verify minimized |
| **Click-Outside UX** | Clicking outside widget minimizes it | Test: Open widget → Click elsewhere → Verify minimized |
| **Maximize Navigation** | Maximize button navigates to full cockpit with correct URL | Test: Click Maximize → Verify URL matches expected pattern |
| **Lamp Position** | Lamp ball doesn't interfere with UI elements | Visual inspection + user feedback |
| **WebSocket Errors** | No console spam for historic process connections | Check browser console during widget load |
| **Process Warning** | Clear error message with process IDs (or removed if expected) | Trigger concurrent processes, check console |
| **License Warning** | Code comment added explaining dev-only warning | Code review confirms comment exists |
| **Task Status Preserved** | Agent tasks remain `status: "agent"` after widget usage | Create agent task → Use widget → Verify status unchanged |
| **No Duplicate Greetings** | User sees single greeting or clear distinction | Send first message → Count greeting messages |

---

## Orchestration Strategy

### Phases

#### Phase 1A: Frontend Fixes (Quick Wins)
**Agent**: `specialists/implementor`
**Deliverable**: Icon, keyboard, click-outside, lamp position fixes
**Tasks**:
- Remove redundant Minimize button (1-line delete)
- Add `useOnClickOutside` hook
- Add ESC key listener
- Reposition lamp ball CSS
- Update duplicate greeting logic

#### Phase 1B: Error Handling & Warnings
**Agent**: `specialists/implementor`
**Deliverable**: WebSocket, process warning, license comment
**Tasks**:
- Wrap WebSocket connections in try-catch
- Update process warning message
- Add code comment for VirtuosoMessageList

#### Phase 1C: Backend Status Bug (CRITICAL)
**Agents**: `specialists/implementor` + `specialists/qa`
**Deliverable**: Task status preservation fix
**Tasks**:
- Investigate backend task attempt creation logic
- Identify where `agent → inreview` transition occurs
- Add conditional logic to preserve `agent` status
- Test with Master Genie widget workflow
- Validate forge_agents table integration

#### Phase 1D: Testing & Verification
**Agent**: `specialists/qa`
**Deliverable**: QA report with evidence
**Tasks**:
- Test all keyboard shortcuts
- Verify maximize navigation URL
- Confirm WebSocket errors suppressed
- Validate task status preservation
- Cross-browser testing (Chrome, Firefox, Safari)

---

## Evidence Requirements

### Frontend Fixes Evidence
- [ ] Screenshot: Minimized bar with only Maximize + Close buttons
- [ ] Video: ESC key minimizing widget
- [ ] Video: Click-outside minimizing widget
- [ ] Screenshot: New lamp ball position

### Error Handling Evidence
- [ ] Browser console screenshot: No WebSocket errors during historic process load
- [ ] Console screenshot: Improved process warning message (with IDs)
- [ ] Code screenshot: License warning comment added

### Status Bug Evidence
- [ ] Database query: Agent task status before widget usage
- [ ] Database query: Agent task status after widget usage
- [ ] Code diff: Backend changes preserving agent status
- [ ] Test logs: Automated test validating status preservation

### QA Evidence
- [ ] QA report: All success metrics validated
- [ ] Test matrix: Browser compatibility (Chrome, Firefox, Safari)
- [ ] Bug list: Any regressions found and resolved

---

## Blockers & Assumptions

### Assumptions
1. Backend task status bug is in task attempt creation or approval logic (not frontend)
2. WebSocket errors are harmless for historic processes (just noisy)
3. VirtuosoMessageList warning can be ignored for now (works without license)
4. Maximize button already navigates correctly (just needs verification)
5. Multiple active execution processes may be expected behavior (clarify with team)

### Potential Blockers
- **Backend Status Bug Complexity**: If status logic is entangled with approval workflows, fix may require broader refactoring
  - **Mitigation**: Scope investigation to 2 hours, escalate if deeper issues found
- **WebSocket API Changes**: If backend WebSocket endpoints changed, frontend may need updates
  - **Mitigation**: Check backend changelog, coordinate with backend team
- **Test Environment**: May not reproduce status bug in local dev (needs production-like data)
  - **Mitigation**: Use seed data from `dev_assets_seed/` or create test fixtures

---

## Branch Strategy

**Base Branch**: `main`
**Feature Branch**: `forge/gwf-001-phase1-fixes`
**Subdirectory**: `forge-overrides/frontend/src/components/genie-widgets/`

---

## Success Evaluation Matrix (100 Points)

### Discovery Phase (20 pts)
- [ ] Context Completeness (10 pts): All bugs documented with file paths, line numbers, reproduction steps
- [ ] Scope Clarity (10 pts): Clear in-scope/out-of-scope, no feature creep into Phase 2-4

### Implementation Phase (50 pts)
- [ ] Frontend Fixes (15 pts): Icon, keyboard, click-outside, lamp position all working
- [ ] Error Handling (10 pts): WebSocket errors suppressed, process warning improved
- [ ] Status Bug Fix (20 pts): Agent tasks preserve status after widget usage (CRITICAL)
- [ ] Code Quality (5 pts): TypeScript strict mode, ESLint passing, clean diffs

### Verification Phase (30 pts)
- [ ] Manual Testing (10 pts): All success metrics validated by hand
- [ ] Browser Compatibility (5 pts): Chrome, Firefox, Safari tested
- [ ] Status Bug Verification (10 pts): Automated test added, database queries confirm preservation
- [ ] Evidence Captured (5 pts): Screenshots, videos, console logs, test results documented

---

## Task Breakdown Preview

### Task A: Frontend UX Fixes
**Scope**: Icon, keyboard, click-outside, lamp position
**Files**: `GenieMasterWidget.tsx`
**Complexity**: Easy-Medium

### Task B: Error Handling
**Scope**: WebSocket, process warning, license comment
**Files**: `useConversationHistory.ts`, `GenieMasterWidget.tsx`
**Complexity**: Easy-Medium

### Task C: Status Bug Investigation & Fix
**Scope**: Backend investigation, status preservation logic
**Files**: Backend Rust services (TBD after investigation)
**Complexity**: Hard (CRITICAL PATH)

### Task D: QA & Verification
**Scope**: Test all fixes, capture evidence
**Files**: All modified files
**Complexity**: Medium

---

## Next Steps

1. **Human Approval**: Review this wish, approve or request changes
2. **Forge Execution**: Break into task files (`.genie/wishes/genie-widget-phase1-fixes/task-*.md`)
3. **Task A + B**: Delegate to `specialists/implementor` (parallel)
4. **Task C**: Deep-dive investigation, then `specialists/implementor` (blocking)
5. **Task D**: Final QA with `specialists/qa`
6. **Done Report**: Capture all evidence, hand off to human for merge approval

---

## Notes

- **Priority**: Task C (status bug) is CRITICAL PATH, blocks release
- **Risk**: Status bug may require backend refactoring (time-box investigation)
- **Quick Wins**: Tasks A + B are low-hanging fruit, can ship independently
- **Phase 2 Preview**: After Phase 1 stable, revisit wish for tab system planning
