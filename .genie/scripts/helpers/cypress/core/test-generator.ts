/**
 * Test Generator
 * Extracted from cypress-mcp and adapted for TypeScript
 *
 * Generates comprehensive Cypress test suites:
 * - Element interaction tests
 * - Form validation tests (positive/negative/edge cases)
 * - Workflow tests
 */

import type { CheerioAPI } from 'cheerio'
import type { ElementMeta, PageObjectMeta, TestCase, TestSuite, WorkflowMeta } from '../types'
import { capitalize } from './element-detector'

/**
 * Generates element interaction tests
 */
function generateElementInteractionTests(elements: ElementMeta[]): TestCase[] {
  const tests: TestCase[] = []

  elements.forEach(el => {
    const capitalizedName = capitalize(el.elementName)

    switch (el.type) {
      case 'button':
      case 'link':
        tests.push({
          type: 'element-interaction',
          description: `should click ${el.elementName}`,
          code: `    page.click${capitalizedName}()
    // Add assertions for expected behavior after click`,
        })
        break

      case 'input':
      case 'textarea':
        tests.push({
          type: 'element-interaction',
          description: `should type in ${el.elementName}`,
          code: `    const testInput = 'test input'
    page.type${capitalizedName}(testInput)
    page.getValue${capitalizedName}().should('eq', testInput)`,
        })

        tests.push({
          type: 'element-interaction',
          description: `should clear ${el.elementName}`,
          code: `    page.type${capitalizedName}('test')
    page.clear${capitalizedName}()
    page.getValue${capitalizedName}().should('eq', '')`,
        })
        break

      case 'select':
        tests.push({
          type: 'element-interaction',
          description: `should select option in ${el.elementName}`,
          code: `    // Replace 'option-value' with actual option value
    page.select${capitalizedName}('option-value')
    page.getSelected${capitalizedName}().should('have.value', 'option-value')`,
        })
        break

      case 'checkbox':
      case 'radio':
        tests.push({
          type: 'element-interaction',
          description: `should check ${el.elementName}`,
          code: `    page.check${capitalizedName}()
    page.isChecked${capitalizedName}()`,
        })

        tests.push({
          type: 'element-interaction',
          description: `should uncheck ${el.elementName}`,
          code: `    page.check${capitalizedName}()
    page.uncheck${capitalizedName}()
    page.${capitalizedName}.should('not.be.checked')`,
        })
        break
    }
  })

  return tests
}

/**
 * Generates form validation tests
 */
function generateFormValidationTests(elements: ElementMeta[]): TestCase[] {
  const tests: TestCase[] = []

  // Get all form fields (inputs, textareas, selects)
  const formFields = elements.filter(el =>
    el.type === 'input' || el.type === 'textarea' || el.type === 'select'
  )

  // Get submit button
  const submitButton = elements.find(el =>
    el.type === 'button' &&
    (el.attributes.type === 'submit' || el.attributes.text?.toLowerCase().includes('submit'))
  )

  if (formFields.length === 0 || !submitButton) {
    return tests
  }

  const submitCapitalized = capitalize(submitButton.elementName)

  // Positive test: All fields filled correctly
  const fillAllFieldsCode = formFields
    .map(field => {
      const capitalizedName = capitalize(field.elementName)
      if (field.type === 'select') {
        return `    page.select${capitalizedName}('valid-option')`
      } else {
        return `    page.type${capitalizedName}('valid_${field.elementName}')`
      }
    })
    .join('\n')

  tests.push({
    type: 'form-validation',
    description: 'should submit form with valid data',
    code: `${fillAllFieldsCode}
    page.click${submitCapitalized}()
    // Add assertions for successful submission`,
  })

  // Negative tests: Each required field left empty (one at a time)
  formFields.forEach(field => {
    const capitalizedName = capitalize(field.elementName)
    const otherFields = formFields.filter(f => f.elementName !== field.elementName)

    const fillOtherFieldsCode = otherFields
      .map(f => {
        const capName = capitalize(f.elementName)
        if (f.type === 'select') {
          return `    page.select${capName}('valid-option')`
        } else {
          return `    page.type${capName}('valid_${f.elementName}')`
        }
      })
      .join('\n')

    tests.push({
      type: 'form-validation',
      description: `should show error if ${field.elementName} is empty`,
      code: `${fillOtherFieldsCode}
    // Leave ${field.elementName} empty
    page.click${submitCapitalized}()
    // Add assertions for error message`,
    })
  })

  // Edge case tests
  formFields.forEach(field => {
    if (field.type === 'input' || field.type === 'textarea') {
      const capitalizedName = capitalize(field.elementName)

      // Long input test
      tests.push({
        type: 'form-validation',
        description: `should handle long input for ${field.elementName}`,
        code: `    const longInput = 'a'.repeat(1000)
    page.type${capitalizedName}(longInput)
    page.click${submitCapitalized}()
    // Add assertions for handling long input`,
      })

      // Special characters test
      tests.push({
        type: 'form-validation',
        description: `should handle special characters for ${field.elementName}`,
        code: `    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    page.type${capitalizedName}(specialChars)
    page.click${submitCapitalized}()
    // Add assertions for handling special characters`,
      })
    }
  })

  return tests
}

/**
 * Generates workflow tests
 */
function generateWorkflowTests(workflows: WorkflowMeta[]): TestCase[] {
  const tests: TestCase[] = []

  workflows.forEach(workflow => {
    switch (workflow.type) {
      case 'login':
        tests.push({
          type: 'workflow',
          description: 'should login with valid credentials',
          code: `    page.login('validuser', 'validpassword')
    cy.url().should('not.include', '/login')
    // Add assertions for successful login`,
        })

        tests.push({
          type: 'workflow',
          description: 'should show error with invalid credentials',
          code: `    page.login('invalid', 'wrong')
    cy.contains('Invalid credentials').should('be.visible')`,
        })

        tests.push({
          type: 'workflow',
          description: 'should show error with empty username',
          code: `    page.login('', 'password')
    // Add assertions for error message`,
        })

        tests.push({
          type: 'workflow',
          description: 'should show error with empty password',
          code: `    page.login('username', '')
    // Add assertions for error message`,
        })
        break

      case 'search':
        tests.push({
          type: 'workflow',
          description: 'should search with valid query',
          code: `    page.search('test query')
    // Add assertions for search results`,
        })

        tests.push({
          type: 'workflow',
          description: 'should handle empty search',
          code: `    page.search('')
    // Add assertions for empty search handling`,
        })
        break

      case 'register':
        tests.push({
          type: 'workflow',
          description: 'should register with valid data',
          code: `    page.register('test@example.com', 'password123', 'password123')
    // Add assertions for successful registration`,
        })

        tests.push({
          type: 'workflow',
          description: 'should show error when passwords do not match',
          code: `    page.register('test@example.com', 'password123', 'different')
    cy.contains('Passwords do not match').should('be.visible')`,
        })
        break

      case 'task-creation':
        tests.push({
          type: 'workflow',
          description: 'should create task with valid data',
          code: `    page.createTask('New feature request', 'Detailed description of the feature')
    // Add assertions for task creation`,
        })

        tests.push({
          type: 'workflow',
          description: 'should show error when title is empty',
          code: `    page.createTask('', 'Description')
    // Add assertions for validation error`,
        })
        break

      case 'pr-creation':
        tests.push({
          type: 'workflow',
          description: 'should create PR with valid data',
          code: `    page.createPR('main')
    // Add assertions for PR creation`,
        })
        break

      case 'chat':
        tests.push({
          type: 'workflow',
          description: 'should send message',
          code: `    page.sendMessage('Hello, this is a test message')
    // Add assertions for message sent`,
        })

        tests.push({
          type: 'workflow',
          description: 'should not send empty message',
          code: `    page.sendMessage('')
    // Add assertions that message was not sent`,
        })
        break
    }
  })

  return tests
}

/**
 * Formats test cases into describe blocks
 */
function formatTestCases(testCases: TestCase[], category: string): string {
  if (testCases.length === 0) return ''

  const formattedTests = testCases.map(test => {
    return `  it('${test.description}', () => {
${test.code}
  })`
  })

  return `  describe('${category}', () => {
${formattedTests.join('\n\n')}
  })`
}

/**
 * Generates complete Cypress test suite
 */
export function generateCypressTests(
  $: CheerioAPI,
  pageObjectMeta: PageObjectMeta,
  url: string
): TestSuite {
  const { className, featureName, elements, workflows } = pageObjectMeta

  // Generate different types of tests
  const elementTests = generateElementInteractionTests(elements)
  const formTests = generateFormValidationTests(elements)
  const workflowTests = generateWorkflowTests(workflows)

  const allTests = [...elementTests, ...formTests, ...workflowTests]

  // Generate imports
  const imports = [
    `import { ${className} } from '../pages/${featureName.toLowerCase()}'`,
  ]

  // Generate describe block name
  const describeBlock = `${featureName} Tests`

  // Format test sections
  const sections: string[] = []

  if (elementTests.length > 0) {
    sections.push(formatTestCases(elementTests, 'Element Interactions'))
  }

  if (formTests.length > 0) {
    sections.push(formatTestCases(formTests, 'Form Validation'))
  }

  if (workflowTests.length > 0) {
    sections.push(formatTestCases(workflowTests, 'Workflows'))
  }

  // Generate complete test file
  const code = `/**
 * ${featureName} Tests
 * Generated from: ${url}
 * Date: ${new Date().toISOString()}
 */

${imports.join('\n')}

describe('${describeBlock}', () => {
  let page: ${className}

  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('${new URL(url).pathname}')
    cy.skipOnboarding()
    cy.waitForAppReady()
    page = new ${className}()
  })

${sections.join('\n\n')}
})
`

  return {
    featureName,
    imports,
    describe: describeBlock,
    testCases: allTests,
    code,
  }
}
