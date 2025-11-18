const visitTasksBoard = () => {
  cy.skipOnboarding();
  cy.setMobileViewport('iphone-14-pro');
  cy.visit('/');
  cy.wait('@getConfig');
  cy.waitForAppReady();
  cy.get('[data-testid="bottom-nav-tasks"]').click({ force: true });
  cy.url().should('include', '/tasks');
  cy.get('[data-testid="task-list-item"]', { timeout: 15000 }).should('exist');
};

const ensureDesktopKanban = () => {
  cy.viewport(1400, 900);
  cy.get('[data-testid="task-card"]', { timeout: 15000 }).should('exist');
};

const getPlayableKanbanCard = () =>
  cy
    .get('[data-testid="task-card"][data-has-executor="false"]', { timeout: 15000 })
    .filter(':not([data-status="archived"])')
    .first();

const verifyTaskStateIndicator = (state: 'in-progress' | 'merged' | 'failed') => {
  cy.get('body').then(($body) => {
    const card = $body
      .find(`[data-testid="task-card"][data-task-state="${state}"]`)
      .first();

    if (!card.length) {
      cy.log(`No ${state} tasks available for assertion`);
      return;
    }

    cy.wrap(card).as('stateCard');
    cy.get('@stateCard')
      .find(`[data-testid="task-state-indicator-${state}"]`)
      .should('be.visible');

    cy.get('@stateCard').find('[data-testid="task-actions-menu-trigger"]').click();
    cy.get('[data-testid="task-actions-menu"]').should('be.visible');
    cy.get('body').click(0, 0);
  });
};

describe('Task Actions - Phase 2 Core Views', () => {
  beforeEach(() => {
    visitTasksBoard();
  });

  context('Quick Action Buttons (Play / Archive)', () => {
    beforeEach(() => {
      ensureDesktopKanban();
    });

    it('shows hover quick actions on Kanban cards and hides them afterwards', () => {
      getPlayableKanbanCard().as('playableCard');
      cy.get('@playableCard').trigger('mouseenter');
      cy.get('@playableCard')
        .find('[data-testid="task-action-quick-play"]')
        .should('be.visible');
      cy.get('@playableCard')
        .find('[data-testid="task-action-quick-archive"]')
        .should('be.visible');

      cy.get('@playableCard').trigger('mouseleave');
      cy.get('@playableCard')
        .find('[data-testid="task-action-quick-play"]')
        .should('not.exist');

      cy.get('@playableCard').trigger('mouseenter');
      cy.get('@playableCard')
        .find('[data-testid="task-actions-menu-trigger"]')
        .should('be.visible');
    });

    it('lists the unified task actions inside the overflow menu', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard');
      cy.get('@taskCard').find('[data-testid="task-actions-menu-trigger"]').click();

      cy.get('[data-testid="task-actions-menu"]').within(() => {
        cy.contains('Create new attempt').should('exist');
        cy.contains('Edit').should('exist');
        cy.contains('Duplicate').should('exist');
        cy.contains('Delete').should('exist');
      });

      cy.get('body').click(0, 0);
    });
  });

  context('Modal Interactions', () => {
    beforeEach(() => {
      ensureDesktopKanban();
    });

    it('opens the create-attempt modal from quick play and the menu entry', () => {
      getPlayableKanbanCard().as('playableCard');

      cy.get('@playableCard')
        .find('[data-testid="task-action-quick-play"]')
        .click({ force: true });
      cy.get('[data-testid="create-attempt-modal"]').should('be.visible');
      cy.contains('button', 'Cancel').click();

      cy.get('@playableCard')
        .find('[data-testid="task-actions-menu-trigger"]')
        .click();
      cy.contains('Create new attempt').click();
      cy.get('[data-testid="create-attempt-modal"]').should('be.visible');
      cy.contains('button', 'Cancel').click();
    });

    it('opens archive and delete confirmations via quick + menu actions', () => {
      getPlayableKanbanCard().as('playableCard');

      cy.get('@playableCard')
        .find('[data-testid="task-action-quick-archive"]')
        .click({ force: true });
      cy.get('[data-testid="archive-confirmation-modal"]').should('be.visible');
      cy.get('[data-testid="archive-modal-cancel"]').click();

      cy.get('@playableCard')
        .find('[data-testid="task-actions-menu-trigger"]')
        .click();
      cy.contains('Delete').click();
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
      cy.get('[data-testid="delete-modal-cancel"]').click();
    });
  });

  context('Task State Edge Cases', () => {
    beforeEach(() => {
      ensureDesktopKanban();
    });

    it('shows status indicators for in-progress, merged, and failed tasks', () => {
      (['in-progress', 'merged', 'failed'] as const).forEach((state) => {
        verifyTaskStateIndicator(state);
      });
    });
  });

  context('Mobile List View', () => {
    beforeEach(() => {
      cy.setMobileViewport('iphone-14-pro');
      cy.checkMobileLayout();
      cy.get('[data-testid="task-list-item"]', { timeout: 15000 }).should('exist');
    });

    it('keeps action buttons visible with touch-friendly sizing', () => {
      cy.get('[data-testid="task-list-item"]').first().as('mobileTask');

      cy.get('@mobileTask').within(() => {
        cy.get('[data-testid="task-action-quick-play"]').should('be.visible');
        cy.checkTouchTarget('[data-testid="task-action-quick-play"]');
        cy.get('[data-testid="task-action-quick-archive"]').should('be.visible');
        cy.checkTouchTarget('[data-testid="task-action-quick-archive"]');
        cy.get('[data-testid="task-action-mobile-diff"]').should('be.visible');
      });
    });
  });

  context('Accessibility', () => {
    beforeEach(() => {
      ensureDesktopKanban();
    });

    it('supports keyboard navigation for the actions menu', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard');
      cy.get('@taskCard')
        .find('[data-testid="task-actions-menu-trigger"]')
        .should('have.attr', 'aria-haspopup', 'menu')
        .focus()
        .type('{enter}');

      cy.get('[data-testid="task-actions-menu"]').should('be.visible');
      cy.focused().type('{downarrow}{downarrow}{enter}');
      cy.get('[data-testid="create-attempt-modal"]').should('be.visible');
      cy.contains('button', 'Cancel').click();
    });
  });
});
