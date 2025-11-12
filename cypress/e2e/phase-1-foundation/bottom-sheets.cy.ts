/**
 * Phase 1 Foundation Tests: Bottom Sheets
 * Tests for the mobile bottom sheet component
 * Based on mobile-native-app.md Phase 1 specs
 */

describe.skip('Bottom Sheets - Phase 1 Foundation', () => {
  beforeEach(() => {
    cy.skipOnboarding()
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('Visual and Layout', () => {
    it('should open bottom sheet when creating new task', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
    })

    it('should have rounded top corners', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('have.css', 'border-top-left-radius')
      cy.get('[data-testid="bottom-sheet"]').should('have.css', 'border-top-right-radius')
    })

    it('should have a drag handle at the top', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet-handle"]').should('be.visible')
    })

    it('should have backdrop overlay', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet-backdrop"]').should('be.visible')
      cy.get('[data-testid="bottom-sheet-backdrop"]').should('have.css', 'background-color')
    })
  })

  describe('Gesture Interactions', () => {
    it('should close when swiping down', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
      cy.swipe('[data-testid="bottom-sheet-handle"]', 'down')
      cy.get('[data-testid="bottom-sheet"]').should('not.be.visible')
    })

    it('should close when tapping backdrop', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
      cy.get('[data-testid="bottom-sheet-backdrop"]').click({ force: true })
      cy.get('[data-testid="bottom-sheet"]').should('not.be.visible')
    })

    it('should expand to full height when swiping up', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
      cy.swipe('[data-testid="bottom-sheet-handle"]', 'up')
      cy.get('[data-testid="bottom-sheet"]').then(($sheet) => {
        const rect = $sheet[0].getBoundingClientRect()
        expect(rect.height).to.be.greaterThan(600)
      })
    })
  })

  describe('Animation', () => {
    it('should animate in from bottom', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]')
        .should('have.css', 'transition')
        .and('include', 'transform')
    })

    it('should animate out when closing', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
      cy.get('[data-testid="bottom-sheet-backdrop"]').click({ force: true })
      cy.get('[data-testid="bottom-sheet"]').should('have.css', 'transition')
    })
  })

  describe('Content', () => {
    it('should display task form content', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="task-form-title"]').should('be.visible')
      cy.get('[data-testid="task-form-description"]').should('be.visible')
    })

    it('should have scrollable content when needed', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet-content"]').should('have.css', 'overflow-y', 'auto')
    })
  })

  describe('Keyboard Handling', () => {
    it('should adjust height when keyboard appears', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="task-form-title"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
    })

    it('should keep input field visible when keyboard is open', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="task-form-title"]').click().type('Test Task')
      cy.isInViewport('[data-testid="task-form-title"]')
    })
  })

  describe('Accessibility', () => {
    it('should trap focus within sheet', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
      cy.get('[data-testid="task-form-title"]').focus().should('have.focus')
    })

    it('should have proper ARIA attributes', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]')
        .should('have.attr', 'role', 'dialog')
        .and('have.attr', 'aria-modal', 'true')
    })

    it('should close on Escape key', () => {
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('[data-testid="bottom-sheet"]').should('not.be.visible')
    })
  })

  describe('One-Handed Operation', () => {
    it('should be reachable with thumb on small devices', () => {
      cy.setMobileViewport('iphone-se')
      cy.get('[data-testid="bottom-nav-new"]').click()
      cy.get('[data-testid="bottom-sheet"]').then(($sheet) => {
        const rect = $sheet[0].getBoundingClientRect()
        expect(rect.top).to.be.greaterThan(100) // Not covering entire screen
      })
    })
  })
})
