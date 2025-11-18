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

  const ensureTaskExists = (projectId: string) => {
    cy.request(`/api/tasks?project_id=${projectId}`).then(({ body }) => {
      const tasks = body?.data || [];
      if (tasks.length === 0) {
        cy.request('POST', '/api/tasks', {
          project_id: projectId,
          title: 'Seed Task',
          description: 'Seed task for regression specs',
        }).then(({ body: taskResponse }) => {
          const task = taskResponse?.data;
          if (task?.id) {
            cy.request('POST', '/api/task-attempts', {
              task_id: task.id,
              executor_profile_id: { executor: 'CODEX', variant: null },
              base_branch: 'dev',
            }).catch(() => {});
          }
        });
      }
    });
  };

  beforeEach(() => {
    cy.skipOnboarding();
    cy.viewport(1280, 800);

    cy.request('/api/projects').then(({ body }) => {
      const projects = body?.data || [];
      expect(projects.length, 'at least one project').to.be.greaterThan(0);
      projectId = projects[0].id;

      ensureTaskExists(projectId);
      cy.visit(`/projects/${projectId}/tasks`);
      closeReleaseNotes();
      cy.waitForAppReady();
      cy.get('[data-testid="task-card"]', { timeout: 20000 }).should('exist');
      cy.get('[data-testid="task-card"]').first().as('taskCard');
      cy.get('@taskCard').click({ force: true });
      cy.get('[data-testid="task-panel"]').should('exist');
    });
  });

  it('shows quick actions when hovering the task card', () => {
    cy.get('@taskCard')
      .trigger('mouseenter')
      .within(() => {
        cy.get('[data-testid="task-action-quick-play"]').should('be.visible');
        cy.get('[data-testid="task-action-quick-archive"]').should('be.visible');
      });
  });

  it('opens the TaskActions dropdown with localized labels', () => {
    cy.get('@taskCard').within(() => {
      cy.get('[data-testid="task-actions-menu-trigger"]').click();
    });

    cy.get('[data-testid="task-actions-menu"]').within(() => {
      cy.contains('View details').should('exist');
      cy.contains('View diff').should('exist');
      cy.contains('View preview').should('exist');
      cy.contains('Create new attempt').should('exist');
      cy.contains('Archive').should('exist');
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
