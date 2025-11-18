# TaskActions Component E2E Test

## Overview
This test suite validates the TaskActions component refactoring that consolidates duplicate action logic from TaskCard (desktop kanban) and TasksListView (mobile list view) into a single reusable component.

## Test Coverage

### 1. Desktop Kanban View - Hover Behavior
- ✅ Quick actions appear on hover
- ✅ Quick actions hide on mouse leave
- ✅ Play button only shows for tasks without executor
- ✅ Play button hidden for running tasks
- ✅ Archive button only shows for non-archived tasks
- ✅ Actions menu always visible
- ✅ Compact button sizing

### 2. Mobile List View - Always Visible
- ✅ Actions always visible (no hover required)
- ✅ Compact sizing for mobile
- ✅ Touch-friendly targets (44x44px minimum)
- ✅ Git branch badge in project header

### 3. Actions Menu Functionality
- ✅ Menu opens on click
- ✅ View section (View Details, View Diff, View Preview)
- ✅ Task section (Edit, Duplicate, Archive, Delete)
- ✅ Create New Attempt option
- ✅ Menu closes on outside click

### 4. Modal Interactions
- ✅ Play button → Create Attempt modal
- ✅ Archive button → Archive Confirmation modal
- ✅ Edit → Task form (edit mode)
- ✅ Duplicate → Task form (pre-filled)
- ✅ Delete → Delete confirmation
- ✅ Click propagation stopped (no task details open)

### 5. Edge Cases - Task States
- ✅ In-progress indicator + actions
- ✅ Merged indicator + actions
- ✅ Failed indicator + actions

### 6. Time Badge Verification
- ✅ Shows created_at time (not updated_at)
- ✅ Consistent format ("Xm ago", "Xh ago", "Xd ago")

### 7. Responsive Behavior
- ✅ Desktop → Mobile viewport transition
- ✅ Hover → Always visible transition

### 8. Accessibility
- ✅ Proper aria-labels
- ✅ Keyboard navigation in menu
- ✅ Focus management
- ✅ Escape key closes menu

### 9. Performance
- ✅ No excessive re-renders on hover

## Required Test Data
The test expects a project with tasks in various states:
- Tasks without executor (for Play button test)
- Tasks with running executor (for Play button hidden test)
- Non-archived tasks (for Archive button test)
- Archived tasks (for Archive button hidden test)
- Tasks with in-progress attempts
- Tasks with merged attempts
- Tasks with failed attempts

## Running the Tests

### Run all TaskActions tests:
```bash
npm run cy:run -- --spec "cypress/e2e/phase-2-core-views/task-actions.cy.ts"
```

### Run in headed mode (watch UI):
```bash
npm run cy:open
# Then select "task-actions.cy.ts" from the test list
```

### Run specific test suite:
```bash
npm run cy:run -- --spec "cypress/e2e/phase-2-core-views/task-actions.cy.ts" --grep "Desktop Kanban View"
```

## Test Dependencies

### Required data-testid attributes:
- `[data-testid="task-card"]` - Kanban task cards
- `[data-testid="task-list-item"]` - Mobile list items
- `[data-testid="view-mode-kanban"]` - Kanban view toggle
- `[data-testid="view-mode-list"]` - List view toggle
- `[data-testid="mobile-project-header"]` - Mobile header
- `[data-testid="git-branch-badge"]` - Branch badge
- `[data-testid="create-attempt-modal"]` - Create attempt modal
- `[data-testid="archive-confirmation-modal"]` - Archive modal
- `[data-testid="task-form-modal"]` - Task form modal
- `[data-testid="delete-confirmation-modal"]` - Delete modal
- `[data-testid="status-spinner"]` - In-progress spinner
- `[data-testid="merged-indicator"]` - Merged checkmark
- `[data-testid="failed-indicator"]` - Failed X icon
- `[data-testid="time-badge"]` - Time badge

### Required data attributes:
- `[data-has-executor="true"]` - Tasks with running executor
- `[data-status="archived"]` - Archived tasks
- `[data-has-in-progress-attempt="true"]` - Running tasks
- `[data-has-merged-attempt="true"]` - Merged tasks
- `[data-last-attempt-failed="true"]` - Failed tasks

### Custom Cypress commands (from cypress/support/commands.ts):
- `cy.checkTouchTarget(selector)` - Validates touch target size

## Visual QA Checklist

Use this test as a guide for manual QA:

### Desktop (1280x720+)
1. Open kanban view
2. Hover over task card → Play & Archive buttons appear
3. Move mouse away → Buttons disappear
4. Click ⋯ menu → All menu items present
5. Verify time shows created_at (not updated_at)

### Mobile (390x844 or similar)
1. Switch to list view
2. All action buttons visible (no hover)
3. Buttons compact and touch-friendly
4. Git branch badge visible in header
5. Tap each action → Correct modal opens

### Functional Tests (Both)
1. Play button → Create attempt modal
2. Archive button → Archive confirmation
3. Edit → Task form (edit mode)
4. Duplicate → Task form (pre-filled)
5. Delete → Confirmation modal

## Known Limitations

1. **Test Data Setup**: Tests assume existing project with varied task states. May need to seed data for consistent results.

2. **Modal Interactions**: Tests verify modals open but don't test full modal workflows (that's covered by separate modal tests).

3. **Attempt-Specific Actions**: Tests focus on task-level actions. Attempt-specific actions (git actions, open in IDE) are covered in separate attempt tests.

## Related Files

- Component: `frontend/src/components/tasks/TaskActions.tsx`
- Desktop usage: `frontend/src/components/tasks/TaskCard.tsx`
- Mobile usage: `frontend/src/components/mobile/TasksListView.tsx`
- Parent integration: `frontend/src/pages/project-tasks.tsx`

## Changelog

### 2025-11-14 - Initial Creation
- Created comprehensive E2E test suite for TaskActions component
- Covers desktop hover behavior, mobile always-visible actions
- Tests all modals, menu items, edge cases
- Validates time badge change (updated_at → created_at)
- Includes accessibility and performance checks
