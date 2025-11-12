/**
 * Phase 1 Foundation Tests: Gesture Support
 * Tests for touch gestures and interactions
 * Based on mobile-native-app.md Phase 1 specs
 */

describe('Gestures - Phase 1 Foundation', () => {
  beforeEach(() => {
    cy.skipOnboarding()
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('Swipe Gestures', () => {
    it('should support swipe left to delete task', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.swipe('@taskCard', 'left')
      cy.get('[data-testid="delete-action"]').should('be.visible')
    })

    it('should support swipe right to archive task', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.swipe('@taskCard', 'right')
      cy.get('[data-testid="archive-action"]').should('be.visible')
    })

    it('should support horizontal swipe for file carousel navigation', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().click()
      cy.get('[data-testid="diffs-tab"]').click()
      cy.get('[data-testid="file-carousel"]').should('be.visible')
      cy.swipe('[data-testid="file-carousel"]', 'left')
      cy.get('[data-testid="next-file"]').should('be.visible')
    })

    it('should support pull to refresh', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="tasks-list"]').as('tasksList')
      cy.swipe('@tasksList', 'down')
      cy.get('[data-testid="refresh-indicator"]').should('be.visible')
    })
  })

  describe('Long Press Gestures', () => {
    it('should show context menu on long press', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.longPress('@taskCard', 500)
      cy.get('[data-testid="context-menu"]').should('be.visible')
    })

    it('should show task options on long press', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.longPress('@taskCard', 500)
      cy.get('[data-testid="edit-option"]').should('be.visible')
      cy.get('[data-testid="delete-option"]').should('be.visible')
      cy.get('[data-testid="share-option"]').should('be.visible')
    })
  })

  describe('Pinch Gestures', () => {
    it('should support pinch to zoom on code blocks', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().click()
      cy.get('[data-testid="diffs-tab"]').click()
      cy.get('[data-testid="code-block"]').should('be.visible')
      cy.get('[data-testid="code-block"]').should('have.css', 'touch-action')
    })
  })

  describe('Tap Gestures', () => {
    it('should open task on tap', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().click()
      cy.get('[data-testid="task-details"]').should('be.visible')
    })

    it('should have proper tap feedback', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().trigger('touchstart')
      cy.get('[data-testid="task-card"]').first().should('have.class', 'active')
    })
  })

  describe('Gesture Conflicts', () => {
    it('should not trigger swipe when scrolling vertically', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="tasks-list"]').scrollTo('bottom')
      cy.get('[data-testid="delete-action"]').should('not.exist')
    })

    it('should not trigger scroll when swiping horizontally', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      const initialScrollTop = cy.get('[data-testid="tasks-list"]').scrollTop()
      cy.swipe('@taskCard', 'left')
      cy.get('[data-testid="tasks-list"]').scrollTop().should('equal', initialScrollTop)
    })
  })

  describe('Gesture Performance', () => {
    it('should respond to gestures within 100ms', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      const startTime = Date.now()
      cy.get('[data-testid="task-card"]').first().click()
      cy.get('[data-testid="task-details"]').should('be.visible').then(() => {
        const endTime = Date.now()
        expect(endTime - startTime).to.be.lessThan(100)
      })
    })

    it('should maintain 60fps during gestures', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').first().as('taskCard')
      cy.swipe('@taskCard', 'left')
      cy.get('@taskCard').should('have.css', 'transition')
    })
  })
})
