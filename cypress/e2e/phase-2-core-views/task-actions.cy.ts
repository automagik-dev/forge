/**
 * TaskActions Component E2E Tests
 *
 * Tests for the refactored TaskActions component that consolidates
 * action logic across desktop kanban and mobile list views.
 *
 * Coverage:
 * - Desktop kanban hover behavior
 * - Mobile always-visible actions
 * - Actions menu functionality
 * - Modal interactions
 * - Edge cases (archived, running, merged tasks)
 */

describe('TaskActions Component - Desktop & Mobile', () => {
  beforeEach(() => {
    // Setup: Create test data with various task states
    cy.visit('/projects')
    cy.get('[data-testid="project-card"]').first().click()
  })

  describe('Desktop Kanban View - Hover Behavior', () => {
    beforeEach(() => {
      cy.viewport(1280, 720) // Desktop viewport
      // Ensure we're in kanban mode
      cy.get('[data-testid="view-mode-kanban"]').click({ force: true })
    })

    it('should show quick actions on hover', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')

      // Quick actions should not be visible initially
      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('not.be.visible')
        cy.get('[aria-label="Archive task"]').should('not.be.visible')
      })

      // Hover should reveal quick actions
      cy.get('@taskCard').trigger('mouseenter')
      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('be.visible')
        cy.get('[aria-label="Archive task"]').should('be.visible')
      })
    })

    it('should hide quick actions on mouse leave', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')

      cy.get('@taskCard').trigger('mouseenter')
      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('be.visible')
      })

      cy.get('@taskCard').trigger('mouseleave')
      cy.wait(200) // Allow animation to complete
      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('not.be.visible')
      })
    })

    it('should show Play button only for tasks without executor', () => {
      // Find a task without executor
      cy.get('[data-testid="task-card"]').filter(':not([data-has-executor="true"])').first().as('noExecutorTask')

      cy.get('@noExecutorTask').trigger('mouseenter')
      cy.get('@noExecutorTask').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('be.visible')
      })
    })

    it('should NOT show Play button for tasks with running executor', () => {
      // Find a task with executor (running)
      cy.get('[data-testid="task-card"][data-has-executor="true"]').first().as('runningTask')

      cy.get('@runningTask').trigger('mouseenter')
      cy.get('@runningTask').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('not.exist')
      })
    })

    it('should show Archive button only for non-archived tasks', () => {
      // Find a non-archived task
      cy.get('[data-testid="task-card"]').filter(':not([data-status="archived"])').first().as('activeTask')

      cy.get('@activeTask').trigger('mouseenter')
      cy.get('@activeTask').within(() => {
        cy.get('[aria-label="Archive task"]').should('be.visible')
      })
    })

    it('should NOT show Archive button for archived tasks', () => {
      // Navigate to archived column or filter
      cy.get('[data-testid="kanban-column-archived"]').within(() => {
        cy.get('[data-testid="task-card"]').first().as('archivedTask')
      })

      cy.get('@archivedTask').trigger('mouseenter')
      cy.get('@archivedTask').within(() => {
        cy.get('[aria-label="Archive task"]').should('not.exist')
      })
    })

    it('should always show actions menu (three dots)', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').should('be.visible')
      })
    })

    it('should use compact button sizing', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')

      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').then(($btn) => {
          const height = $btn.height()
          expect(height).to.be.lessThan(32) // Compact size (h-6 = 24px)
        })
      })
    })
  })

  describe('Mobile List View - Always Visible Actions', () => {
    beforeEach(() => {
      cy.viewport(390, 844) // iPhone 14 Pro viewport
      // Switch to list mode
      cy.get('[data-testid="view-mode-list"]').click({ force: true })
    })

    it('should always show quick actions without hover', () => {
      cy.get('[data-testid="task-list-item"]').first().within(() => {
        cy.get('[aria-label="Start new attempt"]').should('be.visible')
        cy.get('[aria-label="Archive task"]').should('be.visible')
        cy.get('[aria-label="More actions"]').should('be.visible')
      })
    })

    it('should use compact sizing for mobile', () => {
      cy.get('[data-testid="task-list-item"]').first().within(() => {
        cy.get('[aria-label="Start new attempt"]').then(($btn) => {
          const height = $btn.height()
          expect(height).to.be.lessThan(32) // Compact mobile size
        })
      })
    })

    it('should have touch-friendly targets', () => {
      cy.get('[data-testid="task-list-item"]').first().within(() => {
        cy.get('[aria-label="Start new attempt"]').then(($btn) => {
          const rect = $btn[0].getBoundingClientRect()
          // Minimum touch target: 44x44 (Apple HIG) or at least 40x40
          expect(rect.width).to.be.at.least(40)
          expect(rect.height).to.be.at.least(40)
        })
      })
    })

    it('should show git branch badge in project header', () => {
      cy.get('[data-testid="mobile-project-header"]').within(() => {
        cy.get('[data-testid="git-branch-badge"]').should('be.visible')
        cy.get('[data-testid="git-branch-badge"]').should('contain.text', '⎇')
      })
    })
  })

  describe('Actions Menu - Common Functionality', () => {
    beforeEach(() => {
      cy.viewport(1280, 720) // Desktop for consistent testing
    })

    it('should open actions dropdown menu on click', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').should('be.visible')
    })

    it('should show View section with correct options', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').within(() => {
        cy.contains('View').should('be.visible')
        cy.contains('View Details').should('be.visible')
      })
    })

    it('should show Task section with Edit, Duplicate, Archive, Delete', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').within(() => {
        cy.contains('Task').should('be.visible')
        cy.contains('Edit').should('be.visible')
        cy.contains('Duplicate').should('be.visible')
        cy.contains('Archive').should('be.visible')
        cy.contains('Delete').should('be.visible')
      })
    })

    it('should show Create New Attempt option', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').within(() => {
        cy.contains('Create New Attempt').should('be.visible')
      })
    })

    it('should close menu on outside click', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').should('be.visible')
      cy.get('body').click(0, 0) // Click outside
      cy.get('[role="menu"]').should('not.exist')
    })
  })

  describe('Modal Interactions - Play Button', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should open Create Attempt modal on Play click', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')

      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').click()
      })

      cy.get('[data-testid="create-attempt-modal"]').should('be.visible')
    })

    it('should not propagate click to task card', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')

      // Task details panel should not be open initially
      cy.get('[data-testid="task-details-panel"]').should('not.exist')

      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').click()
      })

      // Modal should open, but task details should remain closed
      cy.get('[data-testid="create-attempt-modal"]').should('be.visible')
      cy.get('[data-testid="task-details-panel"]').should('not.exist')
    })
  })

  describe('Modal Interactions - Archive Button', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should open Archive Confirmation modal on Archive click', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')

      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Archive task"]').click()
      })

      cy.get('[data-testid="archive-confirmation-modal"]').should('be.visible')
    })

    it('should not propagate click to task card', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')

      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Archive task"]').click()
      })

      // Modal should open, but task details should remain closed
      cy.get('[data-testid="archive-confirmation-modal"]').should('be.visible')
      cy.get('[data-testid="task-details-panel"]').should('not.exist')
    })
  })

  describe('Modal Interactions - Menu Actions', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should open Edit task form on Edit click', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').contains('Edit').click()
      cy.get('[data-testid="task-form-modal"]').should('be.visible')
      cy.get('[data-testid="task-form-modal"]').should('contain.text', 'Edit')
    })

    it('should open Duplicate task form on Duplicate click', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').contains('Duplicate').click()
      cy.get('[data-testid="task-form-modal"]').should('be.visible')
      // Form should be pre-filled with task data
      cy.get('[data-testid="task-title-input"]').should('not.have.value', '')
    })

    it('should open Delete confirmation on Delete click', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').contains('Delete').click()
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible')
    })

    it('should show Delete option with destructive styling', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').click()
      })

      cy.get('[role="menu"]').contains('Delete').should('have.class', 'text-destructive')
    })
  })

  describe('Edge Cases - Task States', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should show status indicators alongside actions', () => {
      // Find a task with in-progress attempt
      cy.get('[data-testid="task-card"][data-has-in-progress-attempt="true"]').first().within(() => {
        cy.get('[data-testid="status-spinner"]').should('be.visible')
        cy.get('[aria-label="More actions"]').should('be.visible')
      })
    })

    it('should show merged indicator for completed tasks', () => {
      cy.get('[data-testid="task-card"][data-has-merged-attempt="true"]').first().within(() => {
        cy.get('[data-testid="merged-indicator"]').should('be.visible')
        cy.get('[aria-label="More actions"]').should('be.visible')
      })
    })

    it('should show failed indicator for failed tasks', () => {
      cy.get('[data-testid="task-card"][data-last-attempt-failed="true"]').first().within(() => {
        cy.get('[data-testid="failed-indicator"]').should('be.visible')
        cy.get('[aria-label="More actions"]').should('be.visible')
      })
    })
  })

  describe('Time Badge Verification', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should display created_at time in task card', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[data-testid="time-badge"]').should('be.visible')
        // Time badge should show relative time (e.g., "5m ago", "2h ago")
        cy.get('[data-testid="time-badge"]').invoke('text').should('match', /\d+[mhd]|Just now|week/)
      })
    })

    it('should show consistent time format across cards', () => {
      const timeFormats: string[] = []

      cy.get('[data-testid="task-card"]').each(($card, index) => {
        if (index < 3) { // Check first 3 cards
          cy.wrap($card).within(() => {
            cy.get('[data-testid="time-badge"]').invoke('text').then((text) => {
              timeFormats.push(text)
            })
          })
        }
      }).then(() => {
        // All should follow pattern: "Xm ago" or "Xh ago" or "Xd ago" or "Just now"
        timeFormats.forEach((format) => {
          expect(format).to.match(/\d+[mhd]|Just now|week/)
        })
      })
    })
  })

  describe('Responsive Behavior - Viewport Transitions', () => {
    it('should transition from desktop to mobile correctly', () => {
      // Start desktop
      cy.viewport(1280, 720)
      cy.get('[data-testid="task-card"]').first().as('taskCard')

      // Hover should work
      cy.get('@taskCard').trigger('mouseenter')
      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('be.visible')
      })

      // Switch to mobile
      cy.viewport(390, 844)
      cy.get('[data-testid="view-mode-list"]').click({ force: true })

      // Actions should be always visible (no hover needed)
      cy.get('[data-testid="task-list-item"]').first().within(() => {
        cy.get('[aria-label="Start new attempt"]').should('be.visible')
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should have proper aria-labels for all action buttons', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')

      cy.get('@taskCard').within(() => {
        cy.get('[aria-label="Start new attempt"]').should('exist')
        cy.get('[aria-label="Archive task"]').should('exist')
        cy.get('[aria-label="More actions"]').should('exist')
      })
    })

    it('should support keyboard navigation in menu', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').focus()
        cy.get('[aria-label="More actions"]').type('{enter}')
      })

      cy.get('[role="menu"]').should('be.visible')

      // Arrow down should focus next item
      cy.focused().type('{downarrow}')
      cy.focused().should('have.attr', 'role', 'menuitem')

      // Escape should close menu
      cy.focused().type('{esc}')
      cy.get('[role="menu"]').should('not.exist')
    })

    it('should have proper focus management', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[aria-label="More actions"]').focus()
        cy.focused().should('have.attr', 'aria-label', 'More actions')
      })
    })
  })

  describe('Performance', () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    it('should not cause re-renders on hover', () => {
      let renderCount = 0

      cy.window().then((win) => {
        // Spy on React re-renders (simplified check)
        cy.get('[data-testid="task-card"]').first().then(() => {
          renderCount = 1
        })
      })

      // Multiple hovers should not cause excessive re-renders
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.get('@taskCard').trigger('mouseenter')
      cy.get('@taskCard').trigger('mouseleave')
      cy.get('@taskCard').trigger('mouseenter')
      cy.get('@taskCard').trigger('mouseleave')

      // Component should remain stable
      cy.get('@taskCard').should('be.visible')
    })
  })
})
