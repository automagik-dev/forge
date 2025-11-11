
import './commands'
import 'cypress-plugin-tab'

Cypress.on('uncaught:exception', (err, runnable) => {
  return false
})

Cypress.Commands.add('setMobileViewport', (device: string) => {
  const viewports = Cypress.env('viewports')
  const viewport = viewports[device]
  if (viewport) {
    cy.viewport(viewport.width, viewport.height)
  }
})

Cypress.Commands.add('waitForAppReady', () => {
  cy.get('[data-testid="app-root"]', { timeout: 10000 }).should('exist')
})

Cypress.Commands.add('checkMobileLayout', () => {
  cy.get('[data-testid="mobile-layout"]').should('be.visible')
})

Cypress.Commands.add('checkBottomNav', () => {
  cy.get('[data-testid="bottom-navigation"]').should('be.visible')
})

declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(device: string): Chainable<void>
      waitForAppReady(): Chainable<void>
      checkMobileLayout(): Chainable<void>
      checkBottomNav(): Chainable<void>
    }
  }
}
