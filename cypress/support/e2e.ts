
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

Cypress.Commands.add('skipOnboarding', () => {
  cy.intercept('GET', '/api/config', (req) => {
    req.continue((res) => {
      if (res.body && res.body.config) {
        res.body.config.disclaimer_acknowledged = true
        res.body.config.onboarding_acknowledged = true
        res.body.config.github_login_acknowledged = true
        res.body.config.telemetry_acknowledged = true
        res.body.config.show_release_notes = false
        // Disable all showcase/feature modals
        if (!res.body.config.showcases) {
          res.body.config.showcases = { seen_features: [] }
        }
        // Mark all features as seen to prevent showcase modals
        res.body.config.showcases.seen_features = [
          'mobile-pwa',
          'mobile-bottom-nav',
          'mobile-gestures',
          'all'
        ]
      }
      res.send()
    })
  }).as('getConfig')
})

Cypress.Commands.add('waitForAppReady', () => {
  cy.get('[data-testid="app-root"]', { timeout: 10000 }).should('exist')
  cy.get('body').then(($body) => {
    if ($body.find('.fixed.inset-0').length > 0) {
      cy.get('.fixed.inset-0', { timeout: 10000 }).should('not.exist')
    }
  })
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
      skipOnboarding(): Chainable<void>
      setMobileViewport(device: string): Chainable<void>
      waitForAppReady(): Chainable<void>
      checkMobileLayout(): Chainable<void>
      checkBottomNav(): Chainable<void>
    }
  }
}
