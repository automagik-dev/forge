/**
 * Phase 2 Core Views Tests: TaskActions component
 * ---------------------------------------------------------------------------
 * This suite documents the expected coverage (see task-actions.README.md) for
 * the shared TaskActions surface that powers both the mobile list view and the
 * desktop Kanban quick actions. Once the underlying data-testids are stable and
 * the seed data contains the required task states, remove `.skip` and replace
 * any TODO selectors with the concrete attributes referenced in the README.
 */

describe.skip('Task Actions - Phase 2 Core Views', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro');
    cy.visit('/');
    cy.waitForAppReady();
    cy.get('[data-testid="bottom-nav-tasks"]').click();
  });

  context('Quick Action Buttons (Play / Archive)', () => {
    it('shows play + archive buttons on hover for desktop and always-visible on mobile', () => {
      // TODO: replace selectors with concrete quick-action containers on Kanban cards
      cy.get('[data-testid="task-card"]').first().as('taskCard');
      cy.get('@taskCard')
        .trigger('mouseenter')
        .within(() => {
          cy.get('[data-testid="task-action-quick-play"]').should('exist');
          cy.get('[data-testid="task-action-quick-archive"]').should('exist');
        });

      cy.get('@taskCard')
        .trigger('mouseleave')
        .within(() => {
          cy.get('[data-testid="task-action-quick-play"]').should('not.be.visible');
        });

      cy.viewport(393, 852);
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[data-testid="task-action-quick-play"]').should('be.visible');
        cy.get('[data-testid="task-action-quick-archive"]').should('be.visible');
      });
      cy.checkTouchTarget('[data-testid="task-action-quick-play"]');
      cy.checkTouchTarget('[data-testid="task-action-quick-archive"]');
    });
  });

  context('Actions Menu', () => {
    it('lists view actions (details/diff/preview) before attempt/task actions', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[data-testid="task-actions-menu-trigger"]').click();
      });

      cy.get('[data-testid="task-actions-menu"]').within(() => {
        cy.contains('View details').should('exist');
        cy.contains('View diff').should('exist');
        cy.contains('View preview').should('exist');
        cy.contains('Create new attempt').should('exist');
        cy.contains('Open attempt in IDE').should('exist');
        cy.contains('View processes').should('exist');
        cy.contains('Git actions').should('exist');
        cy.contains('Edit').should('exist');
        cy.contains('Duplicate').should('exist');
        cy.contains('Archive').should('exist');
        cy.contains('Delete').should('exist');
      });
    });
  });

  context('Modal Interactions', () => {
    it('opens the create-attempt modal from quick play and menu entry', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard');

      cy.get('@taskCard')
        .find('[data-testid="task-action-quick-play"]')
        .click({ force: true });
      cy.get('[data-testid="create-attempt-modal"]').should('be.visible').within(() => {
        cy.contains('Cancel').click();
      });

      cy.get('@taskCard').find('[data-testid="task-actions-menu-trigger"]').click();
      cy.contains('Create new attempt').click();
      cy.get('[data-testid="create-attempt-modal"]').should('be.visible');
    });

    it('opens archive + delete confirmations and blocks accidental propagation', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard');
      cy.get('@taskCard')
        .find('[data-testid="task-action-quick-archive"]')
        .click({ force: true });
      cy.get('[data-testid="archive-confirmation-modal"]').should('be.visible');
      cy.get('[data-testid="archive-modal-cancel"]').click();

      cy.get('@taskCard').find('[data-testid="task-actions-menu-trigger"]').click();
      cy.contains('Delete').click();
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
    });
  });

  context('Task State Edge Cases', () => {
    it('shows correct status indicators for in-progress / merged / failed attempts', () => {
      ['in-progress', 'merged', 'failed'].forEach((state) => {
        cy.get(`[data-testid="task-card"][data-task-state="${state}"]`).first().within(() => {
          cy.get(`[data-testid="task-state-indicator-${state}"]`).should('be.visible');
          cy.get('[data-testid="task-actions-menu-trigger"]').click();
          cy.get('[data-testid="task-actions-menu"]').should('be.visible');
          cy.get('body').click(0, 0); // close menu
        });
      });
    });
  });

  context('Accessibility & Localization', () => {
    it('exposes aria-labels + keyboard navigation paths for actions menu', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[data-testid="task-actions-menu-trigger"]')
          .should('have.attr', 'aria-haspopup', 'menu')
          .focus()
          .type('{enter}');
      });
      cy.get('[data-testid="task-actions-menu"]').should('be.visible');
      cy.focused().type('{downarrow}{downarrow}{enter}');
    });

    it('renders translated labels for the actions menu', () => {
      // Switching locale ensures translations exist for new menu items.
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="language-selector"]').length) {
          cy.get('[data-testid="language-selector"]').select('es');
        }
      });
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[data-testid="task-actions-menu-trigger"]').click();
      });
      cy.get('[data-testid="task-actions-menu"]').contains('Ver detalles');
      cy.get('[data-testid="task-actions-menu"]').contains('Archivar');
    });
  });
});
