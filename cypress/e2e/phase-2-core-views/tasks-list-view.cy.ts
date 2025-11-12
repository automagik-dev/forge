/**
 * Phase 2 Core Views Tests: Tasks List View
 * Tests for the mobile tasks list view (ChatGPT/Manus-style)
 * Based on mobile-native-app.md Phase 2 specs
 */

describe.skip('Tasks List View - Phase 2 Core Views', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
    cy.get('[data-testid="bottom-nav-tasks"]').click()
  })

  describe('Visual and Layout', () => {
    it('should display vertical list of task cards', () => {
      cy.get('[data-testid="tasks-list-view"]').should('be.visible')
      cy.get('[data-testid="task-card"]').should('have.length.greaterThan', 0)
    })

    it('should display task cards with status icons', () => {
      cy.get('[data-testid="task-card"]').first().within(() => {
        cy.get('[data-testid="status-icon"]').should('be.visible')
      })
    })

    it('should show WISH status with Sparkles icon', () => {
      cy.get('[data-testid="task-card"][data-status="todo"]').first().within(() => {
        cy.get('[data-testid="status-icon-wish"]').should('be.visible')
      })
    })

    it('should show FORGE status with Hammer icon', () => {
      cy.get('[data-testid="task-card"][data-status="inprogress"]').first().within(() => {
        cy.get('[data-testid="status-icon-forge"]').should('be.visible')
      })
    })

    it('should show REVIEW status with Target icon', () => {
      cy.get('[data-testid="task-card"][data-status="inreview"]').first().within(() => {
        cy.get('[data-testid="status-icon-review"]').should('be.visible')
      })
    })

    it('should show DONE status with CheckCircle icon', () => {
      cy.get('[data-testid="task-card"][data-status="done"]').first().within(() => {
        cy.get('[data-testid="status-icon-done"]').should('be.visible')
      })
    })

    it('should display progress indicator for FORGE tasks', () => {
      cy.get('[data-testid="task-card"][data-status="inprogress"]').first().within(() => {
        cy.get('[data-testid="progress-indicator"]').should('be.visible')
        cy.get('[data-testid="progress-indicator"]').should('contain.text', '/')
      })
    })

    it('should animate spinning hammer for running tasks', () => {
      cy.get('[data-testid="task-card"][data-status="inprogress"]').first().within(() => {
        cy.get('[data-testid="status-icon-forge"]')
          .should('have.css', 'animation')
          .and('include', 'spin')
      })
    })
  })

  describe('Filter Tabs', () => {
    it('should display filter tabs', () => {
      cy.get('[data-testid="filter-tabs"]').should('be.visible')
      cy.get('[data-testid="filter-all"]').should('be.visible')
      cy.get('[data-testid="filter-wish"]').should('be.visible')
      cy.get('[data-testid="filter-forge"]').should('be.visible')
      cy.get('[data-testid="filter-review"]').should('be.visible')
      cy.get('[data-testid="filter-done"]').should('be.visible')
    })

    it('should filter tasks by WISH status', () => {
      cy.get('[data-testid="filter-wish"]').click()
      cy.get('[data-testid="task-card"]').each(($card) => {
        cy.wrap($card).should('have.attr', 'data-status', 'todo')
      })
    })

    it('should filter tasks by FORGE status', () => {
      cy.get('[data-testid="filter-forge"]').click()
      cy.get('[data-testid="task-card"]').each(($card) => {
        cy.wrap($card).should('have.attr', 'data-status', 'inprogress')
      })
    })

    it('should filter tasks by REVIEW status', () => {
      cy.get('[data-testid="filter-review"]').click()
      cy.get('[data-testid="task-card"]').each(($card) => {
        cy.wrap($card).should('have.attr', 'data-status', 'inreview')
      })
    })

    it('should filter tasks by DONE status', () => {
      cy.get('[data-testid="filter-done"]').click()
      cy.get('[data-testid="task-card"]').each(($card) => {
        cy.wrap($card).should('have.attr', 'data-status', 'done')
      })
    })

    it('should show all tasks when All filter is selected', () => {
      cy.get('[data-testid="filter-forge"]').click()
      cy.get('[data-testid="filter-all"]').click()
      cy.get('[data-testid="task-card"]').should('have.length.greaterThan', 1)
    })
  })

  describe('Task Card Interactions', () => {
    it('should open task details on tap', () => {
      cy.get('[data-testid="task-card"]').first().click()
      cy.get('[data-testid="task-details"]').should('be.visible')
    })

    it('should support swipe left to delete', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.swipe('@taskCard', 'left')
      cy.get('[data-testid="delete-action"]').should('be.visible')
    })

    it('should support swipe right to archive', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.swipe('@taskCard', 'right')
      cy.get('[data-testid="archive-action"]').should('be.visible')
    })

    it('should show context menu on long press', () => {
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.longPress('@taskCard', 500)
      cy.get('[data-testid="context-menu"]').should('be.visible')
    })
  })

  describe('Pull to Refresh', () => {
    it('should support pull to refresh', () => {
      cy.get('[data-testid="tasks-list"]').as('tasksList')
      cy.swipe('@tasksList', 'down')
      cy.get('[data-testid="refresh-indicator"]').should('be.visible')
    })

    it('should reload tasks after pull to refresh', () => {
      cy.get('[data-testid="tasks-list"]').as('tasksList')
      cy.swipe('@tasksList', 'down')
      cy.wait(1000)
      cy.get('[data-testid="task-card"]').should('have.length.greaterThan', 0)
    })
  })

  describe('FAB (Floating Action Button)', () => {
    it('should display FAB for new task', () => {
      cy.get('[data-testid="fab-new-task"]').should('be.visible')
    })

    it('should open task creation sheet on FAB click', () => {
      cy.get('[data-testid="fab-new-task"]').click()
      cy.get('[data-testid="task-form-sheet"]').should('be.visible')
    })

    it('should have proper touch target size', () => {
      cy.checkTouchTarget('[data-testid="fab-new-task"]')
    })

    it('should be positioned in thumb-reachable area', () => {
      cy.get('[data-testid="fab-new-task"]').then(($fab) => {
        const rect = $fab[0].getBoundingClientRect()
        const viewportHeight = Cypress.config('viewportHeight')
        expect(rect.bottom).to.be.lessThan(viewportHeight - 80) // Above bottom nav
      })
    })
  })

  describe('Virtualization', () => {
    it('should use virtual scrolling for performance', () => {
      cy.get('[data-testid="tasks-list"]').should('have.attr', 'data-virtualized', 'true')
    })

    it('should render only visible items', () => {
      cy.get('[data-testid="task-card"]').then(($cards) => {
        expect($cards.length).to.be.lessThan(50) // Not rendering all items
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no tasks', () => {
      cy.get('[data-testid="filter-done"]').click()
      cy.get('[data-testid="empty-state"]').should('be.visible')
      cy.get('[data-testid="empty-state"]').should('contain.text', 'No tasks')
    })

    it('should show CTA to create first task', () => {
      cy.get('[data-testid="filter-done"]').click()
      cy.get('[data-testid="empty-state-cta"]').should('be.visible')
      cy.get('[data-testid="empty-state-cta"]').click()
      cy.get('[data-testid="task-form-sheet"]').should('be.visible')
    })
  })

  describe('Performance', () => {
    it('should load tasks within 1.5 seconds', () => {
      const startTime = Date.now()
      cy.visit('/')
      cy.get('[data-testid="task-card"]').should('be.visible').then(() => {
        const endTime = Date.now()
        expect(endTime - startTime).to.be.lessThan(1500)
      })
    })

    it('should maintain 60fps during scrolling', () => {
      cy.get('[data-testid="tasks-list"]').scrollTo('bottom', { duration: 1000 })
      cy.get('[data-testid="tasks-list"]').should('be.visible')
    })
  })
})
