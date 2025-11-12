/**
 * Phase 4 Polish Tests: Responsive Design
 * Tests for responsive behavior across different viewports
 * Based on mobile-native-app.md Phase 4 specs
 */

describe.skip('Responsive Design - Phase 4 Polish', () => {
  describe('Mobile Viewports', () => {
    it('should work on iPhone SE (375px)', () => {
      cy.setMobileViewport('iphone-se')
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkMobileLayout()
      cy.checkBottomNav()
    })

    it('should work on iPhone 14 Pro (393px)', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkMobileLayout()
      cy.checkBottomNav()
    })

    it('should work on Pixel 7 (412px)', () => {
      cy.setMobileViewport('pixel-7')
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkMobileLayout()
      cy.checkBottomNav()
    })
  })

  describe('Tablet Viewports', () => {
    it('should work on iPad Mini (768px)', () => {
      cy.setMobileViewport('ipad-mini')
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkMobileLayout()
      cy.checkBottomNav()
    })

    it('should adapt layout for tablet', () => {
      cy.viewport(768, 1024)
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="mobile-layout"]').should('be.visible')
    })
  })

  describe('Desktop Viewports', () => {
    it('should switch to desktop layout above 1024px', () => {
      cy.viewport(1280, 720)
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="desktop-layout"]').should('be.visible')
      cy.get('[data-testid="bottom-navigation"]').should('not.be.visible')
    })

    it('should show sidebar on desktop', () => {
      cy.viewport(1280, 720)
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="sidebar"]').should('be.visible')
    })
  })

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape', () => {
      cy.viewport(393, 852) // Portrait
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkMobileLayout()
      cy.viewport(852, 393) // Landscape
      cy.checkMobileLayout()
    })

    it('should maintain state during orientation change', () => {
      cy.viewport(393, 852)
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.viewport(852, 393)
      cy.url().should('include', '/tasks')
    })
  })

  describe('Content Adaptation', () => {
    it('should adjust font sizes for small screens', () => {
      cy.setMobileViewport('iphone-se')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="task-card-title"]').first()
        .should('have.css', 'font-size')
        .and('match', /14px|16px/)
    })

    it('should adjust spacing for small screens', () => {
      cy.setMobileViewport('iphone-se')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="task-card"]').first()
        .should('have.css', 'padding')
    })

    it('should stack elements vertically on mobile', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="task-card"]').then(($cards) => {
        const firstRect = $cards[0].getBoundingClientRect()
        const secondRect = $cards[1].getBoundingClientRect()
        expect(secondRect.top).to.be.greaterThan(firstRect.bottom)
      })
    })
  })

  describe('Image Responsiveness', () => {
    it('should use appropriate image sizes', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('img').first().should('have.attr', 'srcset')
    })

    it('should lazy load images', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('img').first().should('have.attr', 'loading', 'lazy')
    })
  })

  describe('Touch vs Mouse', () => {
    it('should show touch-optimized UI on mobile', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkTouchTarget('[data-testid="bottom-nav-tasks"]')
    })

    it('should show hover states on desktop', () => {
      cy.viewport(1280, 720)
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="sidebar-item"]').first().trigger('mouseenter')
      cy.get('[data-testid="sidebar-item"]').first()
        .should('have.css', 'background-color')
    })
  })

  describe('Breakpoint Transitions', () => {
    it('should smoothly transition between breakpoints', () => {
      cy.viewport(767, 800)
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkMobileLayout()
      cy.viewport(1025, 800)
      cy.get('[data-testid="desktop-layout"]').should('be.visible')
    })

    it('should maintain scroll position during resize', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="tasks-list"]').scrollTo('bottom')
      cy.viewport(768, 1024)
      cy.get('[data-testid="tasks-list"]').then(($list) => {
        expect($list.scrollTop()).to.be.greaterThan(0)
      })
    })
  })

  describe('Safe Areas', () => {
    it('should handle notch on iPhone', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.checkSafeArea()
    })

    it('should apply safe area padding to header', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="mobile-header"]')
        .should('have.css', 'padding-top')
        .then((padding) => {
          expect(parseInt(padding)).to.be.greaterThan(0)
        })
    })

    it('should apply safe area padding to bottom nav', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="bottom-navigation"]')
        .should('have.css', 'padding-bottom')
        .then((padding) => {
          expect(parseInt(padding)).to.be.greaterThan(0)
        })
    })
  })

  describe('Text Scaling', () => {
    it('should support system font scaling', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('[data-testid="task-card-title"]').first()
        .should('have.css', 'font-size')
    })

    it('should maintain layout with larger text', () => {
      cy.setMobileViewport('iphone-14-pro')
      cy.visit('/')
      cy.waitForAppReady()
      cy.get('html').invoke('css', 'font-size', '20px')
      cy.checkMobileLayout()
    })
  })
})
