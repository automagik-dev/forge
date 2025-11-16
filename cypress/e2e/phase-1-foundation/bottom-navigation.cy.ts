/**
 * Phase 1 Foundation Tests: Bottom Navigation
 * Tests for the mobile bottom navigation component
 * Based on mobile-native-app.md Phase 1 specs
 */

describe('Bottom Navigation - Phase 1 Foundation', () => {
  beforeEach(() => {
    cy.skipOnboarding()
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('Visual and Layout', () => {
    it('should display bottom navigation on mobile viewport', () => {
      cy.checkBottomNav()
      cy.get('[data-testid="bottom-navigation"]').should('be.visible')
    })

    it('should have 2 navigation tabs at root (Projects, Config)', () => {
      cy.get('[data-testid="bottom-nav-projects"]').should('be.visible')
      cy.get('[data-testid="bottom-nav-config"]').should('be.visible')
    })

    it('should have proper touch target sizes (minimum 44x44px)', () => {
      cy.checkTouchTarget('[data-testid="bottom-nav-projects"]')
      cy.checkTouchTarget('[data-testid="bottom-nav-config"]')
    })

    it('should be fixed at the bottom of the screen', () => {
      cy.get('[data-testid="bottom-navigation"]').then(($nav) => {
        const rect = $nav[0].getBoundingClientRect()
        const viewportHeight = Cypress.config('viewportHeight')
        expect(rect.bottom).to.equal(viewportHeight)
      })
    })

    it('should display icons for each tab', () => {
      cy.get('[data-testid="bottom-nav-projects"] svg').should('exist')
      cy.get('[data-testid="bottom-nav-config"] svg').should('exist')
    })
  })

  describe.skip('Navigation Functionality', () => {
    it('should navigate to Tasks view when Tasks tab is clicked', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.url().should('include', '/tasks')
      cy.get('[data-testid="tasks-list-view"]').should('be.visible')
    })

    it('should navigate to Chat view when Chat tab is clicked', () => {
      cy.get('[data-testid="bottom-nav-chat"]').click()
      cy.url().should('include', '/chat')
      cy.get('[data-testid="chat-view"]').should('be.visible')
    })

    it('should open New task sheet when New tab is clicked', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="task-form-sheet"]').should('be.visible')
    })

    it('should navigate to Settings when Me tab is clicked', () => {
      cy.get('[data-testid="bottom-nav-me"]').click()
      cy.url().should('include', '/settings')
      cy.get('[data-testid="settings-view"]').should('be.visible')
    })

    it('should highlight active tab', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="bottom-nav-tasks"]').should('have.class', 'active')
      
      cy.get('[data-testid="bottom-nav-chat"]').click()
      cy.get('[data-testid="bottom-nav-chat"]').should('have.class', 'active')
      cy.get('[data-testid="bottom-nav-tasks"]').should('not.have.class', 'active')
    })
  })

  describe('Responsive Behavior', () => {
    it.skip('should hide bottom navigation on desktop viewport', () => {
      cy.viewport(1280, 720)
      cy.get('[data-testid="bottom-navigation"]').should('not.be.visible')
    })

    it.skip('should show bottom navigation on tablet viewport', () => {
      cy.setMobileViewport('ipad-mini')
      cy.get('[data-testid="bottom-navigation"]').should('be.visible')
    })

    it('should adapt to different mobile viewports', () => {
      const devices = ['iphone-se', 'iphone-14-pro', 'pixel-7']
      devices.forEach((device) => {
        cy.setMobileViewport(device)
        cy.checkBottomNav()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="bottom-nav-projects"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="bottom-nav-config"]').should('have.attr', 'aria-label')
    })

    it.skip('should be keyboard navigable', () => {
      cy.get('[data-testid="bottom-nav-projects"]').focus().should('have.focus')
      cy.get('[data-testid="bottom-nav-projects"]').type('{enter}')
      cy.url().should('include', '/projects')
    })
  })

  describe('Safe Area Handling', () => {
    it('should respect safe area insets', () => {
      cy.checkSafeArea()
      cy.get('[data-testid="bottom-navigation"]').should('have.css', 'padding-bottom')
    })
  })
})
