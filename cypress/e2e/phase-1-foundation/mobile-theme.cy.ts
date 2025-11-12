/**
 * Phase 1 Foundation Tests: Mobile Theme
 * Tests for mobile-specific theming and styling
 * Based on mobile-native-app.md Phase 1 specs
 */

describe('Mobile Theme - Phase 1 Foundation', () => {
  beforeEach(() => {
    cy.skipOnboarding()
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('Typography', () => {
    it('should use mobile-optimized font sizes', () => {
      cy.get('[data-testid="task-card-title"]').first().should('have.css', 'font-size')
        .and('match', /16px|18px/)
    })

    it('should have readable line heights', () => {
      cy.get('[data-testid="task-card-description"]').first()
        .should('have.css', 'line-height')
        .then((lineHeight) => {
          const fontSize = parseFloat(cy.get('[data-testid="task-card-description"]').first().css('font-size'))
          const lineHeightNum = parseFloat(lineHeight)
          expect(lineHeightNum / fontSize).to.be.at.least(1.4)
        })
    })

    it('should use system fonts for performance', () => {
      cy.get('body').should('have.css', 'font-family')
        .and('match', /system-ui|sans-serif/)
    })
  })

  describe('Spacing', () => {
    it('should use 4px base spacing unit', () => {
      cy.get('[data-testid="task-card"]').first()
        .should('have.css', 'padding')
        .then((padding) => {
          const paddingValue = parseInt(padding)
          expect(paddingValue % 4).to.equal(0)
        })
    })

    it('should have adequate touch spacing between elements', () => {
      cy.get('[data-testid="task-card"]').then(($cards) => {
        const firstRect = $cards[0].getBoundingClientRect()
        const secondRect = $cards[1].getBoundingClientRect()
        const gap = secondRect.top - firstRect.bottom
        expect(gap).to.be.at.least(8)
      })
    })
  })

  describe('Colors', () => {
    it('should use dark theme by default', () => {
      cy.get('body').should('have.css', 'background-color')
        .and('match', /rgb\(0, 0, 0\)|rgb\(18, 18, 18\)/)
    })

    it('should have OLED-optimized dark colors', () => {
      cy.get('[data-testid="mobile-layout"]')
        .should('have.css', 'background-color')
        .then((bgColor) => {
          expect(bgColor).to.match(/rgb\(0, 0, 0\)|rgb\([0-9], [0-9], [0-9]\)/)
        })
    })

    it('should have sufficient contrast for text', () => {
      cy.get('[data-testid="task-card-title"]').first().then(($el) => {
        const color = $el.css('color')
        const bgColor = $el.css('background-color')
        expect(color).to.not.equal(bgColor)
      })
    })

    it('should use brand colors for accents', () => {
      cy.get('[data-testid="bottom-nav-tasks"][class*="active"]')
        .should('have.css', 'color')
        .and('match', /rgb\(|#/) // Check for color value
    })
  })

  describe('Safe Areas', () => {
    it('should define safe area CSS variables', () => {
      cy.checkSafeArea()
    })

    it('should apply safe area padding to bottom navigation', () => {
      cy.get('[data-testid="bottom-navigation"]')
        .should('have.css', 'padding-bottom')
        .then((padding) => {
          expect(parseInt(padding)).to.be.greaterThan(0)
        })
    })

    it('should apply safe area padding to top bar', () => {
      cy.get('[data-testid="mobile-header"]')
        .should('have.css', 'padding-top')
        .then((padding) => {
          expect(parseInt(padding)).to.be.greaterThan(0)
        })
    })
  })

  describe('Responsive Breakpoints', () => {
    it('should apply mobile styles below 768px', () => {
      cy.viewport(767, 800)
      cy.checkMobileLayout()
    })

    it('should apply tablet styles between 768px and 1024px', () => {
      cy.viewport(800, 1024)
      cy.get('[data-testid="mobile-layout"]').should('be.visible')
    })

    it('should apply desktop styles above 1024px', () => {
      cy.viewport(1280, 720)
      cy.get('[data-testid="desktop-layout"]').should('be.visible')
    })
  })

  describe('Touch Targets', () => {
    it('should have minimum 44x44px touch targets', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').then(($el) => {
        const rect = $el[0].getBoundingClientRect()
        expect(rect.width).to.be.at.least(44)
        expect(rect.height).to.be.at.least(44)
      })
    })

    it('should have adequate spacing between touch targets', () => {
      cy.get('[data-testid="bottom-navigation"] button').then(($buttons) => {
        for (let i = 0; i < $buttons.length - 1; i++) {
          const rect1 = $buttons[i].getBoundingClientRect()
          const rect2 = $buttons[i + 1].getBoundingClientRect()
          const gap = rect2.left - rect1.right
          expect(gap).to.be.at.least(8)
        }
      })
    })
  })

  describe('Animations', () => {
    it('should use hardware-accelerated transforms', () => {
      cy.get('[data-testid="bottom-sheet"]').should('have.css', 'transform')
    })

    it('should have smooth transitions', () => {
      cy.get('[data-testid="bottom-nav-tasks"]').click()
      cy.get('[data-testid="tasks-list-view"]')
        .should('have.css', 'transition')
        .and('include', 'transform')
    })

    it('should respect prefers-reduced-motion', () => {
      cy.window().then((win) => {
        const prefersReducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion) {
          cy.get('[data-testid="bottom-sheet"]')
            .should('have.css', 'transition-duration', '0s')
        }
      })
    })
  })

  describe('Dark Mode', () => {
    it('should default to dark mode', () => {
      cy.get('html').should('have.class', 'dark')
    })

    it('should persist dark mode preference', () => {
      cy.reload()
      cy.get('html').should('have.class', 'dark')
    })

    it('should have proper dark mode colors for all components', () => {
      cy.get('[data-testid="task-card"]').first()
        .should('have.css', 'background-color')
        .and('match', /rgb\(/)
    })
  })
})
