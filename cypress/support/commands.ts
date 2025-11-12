
Cypress.Commands.add('swipe', (selector: string, direction: 'left' | 'right' | 'up' | 'down') => {
  cy.get(selector).trigger('touchstart', { which: 1 })
  
  const movements = {
    left: { clientX: -100, clientY: 0 },
    right: { clientX: 100, clientY: 0 },
    up: { clientX: 0, clientY: -100 },
    down: { clientX: 0, clientY: 100 },
  }
  
  cy.get(selector).trigger('touchmove', movements[direction])
  cy.get(selector).trigger('touchend')
})

Cypress.Commands.add('longPress', (selector: string, duration = 500) => {
  cy.get(selector)
    .trigger('touchstart', { which: 1 })
    .wait(duration)
    .trigger('touchend')
})

Cypress.Commands.add('isInViewport', (selector: string) => {
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect()
    expect(rect.top).to.be.at.least(0)
    expect(rect.left).to.be.at.least(0)
    expect(rect.bottom).to.be.at.most(Cypress.config('viewportHeight'))
    expect(rect.right).to.be.at.most(Cypress.config('viewportWidth'))
  })
})

Cypress.Commands.add('checkTouchTarget', (selector: string) => {
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect()
    expect(rect.width).to.be.at.least(44)
    expect(rect.height).to.be.at.least(44)
  })
})

Cypress.Commands.add('checkSafeArea', () => {
  cy.window().then((win) => {
    const computedStyle = win.getComputedStyle(win.document.documentElement)
    const safeAreaTop = computedStyle.getPropertyValue('--safe-area-inset-top')
    const safeAreaBottom = computedStyle.getPropertyValue('--safe-area-inset-bottom')
    expect(safeAreaTop).to.exist
    expect(safeAreaBottom).to.exist
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      swipe(selector: string, direction: 'left' | 'right' | 'up' | 'down'): Chainable<void>
      longPress(selector: string, duration?: number): Chainable<void>
      isInViewport(selector: string): Chainable<void>
      checkTouchTarget(selector: string): Chainable<void>
      checkSafeArea(): Chainable<void>
    }
  }
}
