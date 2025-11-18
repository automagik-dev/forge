
import './commands'
import { mount } from 'cypress/react18'

// DO NOT use this file

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)
