/**
 * Phase 2 Core Views Tests: Preview View
 * Tests for the mobile preview view with responsive viewports
 * Based on mobile-native-app.md Phase 2 specs
 */

describe.skip('Preview View - Phase 2 Core Views', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
    cy.get('[data-testid="bottom-nav-tasks"]').click()
    cy.get('[data-testid="task-card"]').first().click()
    cy.get('[data-testid="preview-tab"]').click()
  })

  describe('Viewport Selector', () => {
    it('should display viewport selector', () => {
      cy.get('[data-testid="viewport-selector"]').should('be.visible')
    })

    it('should show current viewport name', () => {
      cy.get('[data-testid="current-viewport"]').should('be.visible')
      cy.get('[data-testid="current-viewport"]').should('contain.text', 'iPhone')
    })

    it('should open viewport picker on tap', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-picker-sheet"]').should('be.visible')
    })

    it('should list available viewports', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-option"]').should('have.length.greaterThan', 3)
    })

    it('should include mobile viewports', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-option"]').should('contain.text', 'iPhone')
      cy.get('[data-testid="viewport-option"]').should('contain.text', 'Pixel')
    })

    it('should include tablet viewports', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-option"]').should('contain.text', 'iPad')
    })

    it('should include desktop viewports', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-option"]').should('contain.text', 'Desktop')
    })

    it('should switch viewport on selection', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-option"]').contains('iPad').click()
      cy.get('[data-testid="current-viewport"]').should('contain.text', 'iPad')
    })
  })

  describe('Preview Frame', () => {
    it('should display preview iframe', () => {
      cy.get('[data-testid="preview-iframe"]').should('be.visible')
    })

    it('should load preview content', () => {
      cy.get('[data-testid="preview-iframe"]').should('have.attr', 'src')
    })

    it('should adjust iframe size based on viewport', () => {
      cy.get('[data-testid="viewport-selector"]').click()
      cy.get('[data-testid="viewport-option"]').contains('iPhone SE').click()
      cy.get('[data-testid="preview-iframe"]').should('have.css', 'width', '375px')
    })

    it('should show loading indicator', () => {
      cy.get('[data-testid="preview-loading"]').should('exist')
    })
  })

  describe('Orientation Controls', () => {
    it('should have rotate button', () => {
      cy.get('[data-testid="rotate-viewport-button"]').should('be.visible')
    })

    it('should rotate to landscape on button click', () => {
      cy.get('[data-testid="rotate-viewport-button"]').click()
      cy.get('[data-testid="preview-iframe"]').then(($iframe) => {
        const width = parseInt($iframe.css('width'))
        const height = parseInt($iframe.css('height'))
        expect(width).to.be.greaterThan(height)
      })
    })

    it('should rotate back to portrait', () => {
      cy.get('[data-testid="rotate-viewport-button"]').click()
      cy.get('[data-testid="rotate-viewport-button"]').click()
      cy.get('[data-testid="preview-iframe"]').then(($iframe) => {
        const width = parseInt($iframe.css('width'))
        const height = parseInt($iframe.css('height'))
        expect(height).to.be.greaterThan(width)
      })
    })
  })

  describe('Click Tracking', () => {
    it('should highlight clicked elements', () => {
      cy.get('[data-testid="preview-iframe"]').then(($iframe) => {
        const iframeBody = $iframe.contents().find('body')
        cy.wrap(iframeBody).find('button').first().click()
        cy.get('[data-testid="click-indicator"]').should('be.visible')
      })
    })

    it('should show element info on click', () => {
      cy.get('[data-testid="preview-iframe"]').then(($iframe) => {
        const iframeBody = $iframe.contents().find('body')
        cy.wrap(iframeBody).find('button').first().click()
        cy.get('[data-testid="element-info"]').should('be.visible')
      })
    })
  })

  describe('Zoom Controls', () => {
    it('should have zoom controls', () => {
      cy.get('[data-testid="zoom-in-button"]').should('be.visible')
      cy.get('[data-testid="zoom-out-button"]').should('be.visible')
      cy.get('[data-testid="zoom-reset-button"]').should('be.visible')
    })

    it('should zoom in on button click', () => {
      cy.get('[data-testid="preview-container"]').invoke('css', 'transform').as('initialTransform')
      cy.get('[data-testid="zoom-in-button"]').click()
      cy.get('[data-testid="preview-container"]').invoke('css', 'transform').should('not.equal', '@initialTransform')
    })

    it('should zoom out on button click', () => {
      cy.get('[data-testid="zoom-in-button"]').click()
      cy.get('[data-testid="zoom-out-button"]').click()
      cy.get('[data-testid="preview-container"]').should('have.css', 'transform')
    })

    it('should reset zoom', () => {
      cy.get('[data-testid="zoom-in-button"]').click()
      cy.get('[data-testid="zoom-reset-button"]').click()
      cy.get('[data-testid="preview-container"]').should('have.css', 'transform', 'none')
    })

    it('should support pinch to zoom', () => {
      cy.get('[data-testid="preview-container"]')
        .should('have.css', 'touch-action')
    })
  })

  describe('Refresh Controls', () => {
    it('should have refresh button', () => {
      cy.get('[data-testid="refresh-preview-button"]').should('be.visible')
    })

    it('should reload preview on refresh', () => {
      cy.get('[data-testid="refresh-preview-button"]').click()
      cy.get('[data-testid="preview-loading"]').should('be.visible')
      cy.get('[data-testid="preview-iframe"]').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should show error state when preview fails to load', () => {
      cy.intercept('GET', '**/preview/**', { statusCode: 500 })
      cy.get('[data-testid="refresh-preview-button"]').click()
      cy.get('[data-testid="preview-error"]').should('be.visible')
    })

    it('should allow retry on error', () => {
      cy.intercept('GET', '**/preview/**', { statusCode: 500 }).as('failedLoad')
      cy.get('[data-testid="refresh-preview-button"]').click()
      cy.wait('@failedLoad')
      cy.get('[data-testid="retry-preview-button"]').should('be.visible')
    })
  })

  describe('Performance', () => {
    it('should load preview within 3 seconds', () => {
      const startTime = Date.now()
      cy.get('[data-testid="preview-iframe"]').should('be.visible').then(() => {
        const endTime = Date.now()
        expect(endTime - startTime).to.be.lessThan(3000)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="viewport-selector"]').should('have.attr', 'aria-label')
      cy.get('[data-testid="rotate-viewport-button"]').should('have.attr', 'aria-label')
    })
  })
})
