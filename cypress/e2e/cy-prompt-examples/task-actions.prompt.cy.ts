/**
 * cy.prompt() Example: Task Actions Regression
 *
 * This spec demonstrates how to describe the new TaskActions experience in
 * natural language so Cypress Cloud can scaffold assertions automatically.
 * Run with: CYPRESS_RECORD_KEY=xxx npx cypress run --record --spec "cypress/e2e/cy-prompt-examples/task-actions.prompt.cy.ts"
 */

describe.skip('Task Actions (cy.prompt)', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro');
    cy.visit('/');
    cy.waitForAppReady();
    cy.get('[data-testid="bottom-nav-tasks"]').click();
  });

  it('should validate quick actions + menu flows', () => {
    cy.prompt(`
      Scenario: TaskActions surface on mobile Kanban
      Viewport: iPhone 14 Pro (393x852)
      Given the user opens the Tasks view
      Then hovering or focusing a task card should reveal quick Play/Archive buttons with 44x44px touch targets
      And tapping the ⋯ trigger should open the unified menu with View Details, View Diff, View Preview, Create Attempt, Open in IDE, View Processes, Git Actions, Edit, Duplicate, Archive, Delete entries
      And choosing "Create new attempt" should open the create-attempt modal and close the menu
      And choosing "Archive" should open the archive confirmation modal with Cancel/Confirm actions
      And keyboard navigation (Enter, ArrowDown) should move through menu items with proper aria attributes
    `);
  });
});
