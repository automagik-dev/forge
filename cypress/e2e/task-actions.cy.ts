/**
 * Task Actions regression spec
 */

describe('Task Actions regression (Kanban)', () => {
  let projectId: string;

  const closeReleaseNotes = () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes("Let's Create")) {
        cy.contains("Let's Create").click({ force: true });
      }
    });
  };

  const ensureTaskWithoutExecutor = (projectId: string) => {
    // Always create a fresh task without executor for testing quick actions
    cy.request('POST', '/api/tasks', {
      project_id: projectId,
      title: 'Test Task for Quick Actions',
      description: 'Fresh task for testing hover actions',
    });
  };

  beforeEach(() => {
    cy.skipOnboarding();
    cy.viewport(1280, 800);

    cy.request('/api/projects').then(({ body }) => {
      const projects = body?.data || [];
      expect(projects.length, 'at least one project').to.be.greaterThan(0);
      projectId = projects[0].id;

      ensureTaskWithoutExecutor(projectId);
      cy.visit(`/projects/${projectId}/tasks`);
      closeReleaseNotes();
      cy.waitForAppReady();
      cy.get('[data-testid="task-card"]', { timeout: 20000 }).should('exist');
      // Get the LAST card (newest task we just created)
      cy.get('[data-testid="task-card"]').last().as('taskCard');
    });
  });

  it('shows quick actions when hovering the task card', () => {
    // Trigger mouseenter on the parent div that has the handler
    cy.get('@taskCard').parent().trigger('mouseenter');

    // Check for quick actions within the card
    cy.get('@taskCard').within(() => {
      cy.get('[data-testid="task-action-quick-play"]').should('be.visible');
      cy.get('[data-testid="task-action-quick-archive"]').should('be.visible');
    });
  });

  it('opens the TaskActions dropdown with localized labels', () => {
    cy.get('@taskCard').within(() => {
      cy.get('[data-testid="task-actions-menu-trigger"]').click();
    });

    cy.get('[data-testid="task-actions-menu"]').within(() => {
      // Task section (tasks without attempts show task actions only)
      cy.contains('Edit').should('exist');
      cy.contains('Duplicate').should('exist');
      cy.contains('Delete').should('exist');
    });
  });

  it('opens delete confirmation modal when choosing Delete', () => {
    cy.get('@taskCard').within(() => {
      cy.get('[data-testid="task-actions-menu-trigger"]').click();
    });

    cy.contains('Delete').click();
    cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
  });
});
