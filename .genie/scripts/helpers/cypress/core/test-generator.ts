/**
 * Test Generator
 * Extracted from cypress-mcp (lines 516-624)
 *
 * Generates comprehensive Cypress test suites with:
 * - Element interaction tests (click, type, check)
 * - Form validation tests (positive/negative/edge cases)
 * - Workflow tests (login, search, register)
 */

import type { CheerioAPI, Element } from 'cheerio'
import type { PageObjectMeta, ElementMeta } from './types.js'
import { capitalize } from '../utils/naming-helpers.js'

/**
 * Generate comprehensive Cypress test suite
 * @param $ Cheerio instance with loaded HTML
 * @param pageObjectMeta Page Object metadata
 * @param url Page URL
 * @returns Complete test file code
 */
export function generateCypressTests(
  $: CheerioAPI,
  pageObjectMeta: PageObjectMeta,
  url: string
): string {
  const { className, featureName, elementMeta } = pageObjectMeta

  const elementTests = generateElementTests(elementMeta)
  const formTests = generateFormTests($, elementMeta)
  const workflowTests = generateWorkflowTests(pageObjectMeta)

  return `import { ${className} } from '../pages/${featureName}'

describe('${className} Tests', () => {
    let page: ${className}

    beforeEach(() => {
        cy.visit('${url}')
        page = new ${className}()
    })

    describe('Element Interactions', () => {
${elementTests.join('\n')}
    })

    describe('Form Submission', () => {
${formTests.join('\n')}
    })
${workflowTests.join('\n')}

    // Add more negative/error/edge case tests as needed
})`
}

/**
 * Generate element interaction tests (click, type, check)
 */
function generateElementTests(elementMeta: ElementMeta[]): string[] {
  const tests: string[] = []

  elementMeta.forEach((meta) => {
    const capName = capitalize(meta.elementName)

    if (meta.type === 'button' || meta.type === 'link') {
      tests.push(`
        it('should click ${meta.elementName}', () => {
            page.click${capName}()
            // Add assertions based on expected behavior
        })`)

      tests.push(`
        it('should get text of ${meta.elementName}', () => {
            page.getText${capName}().should('be.a', 'string')
        })`)
    } else if (meta.type === 'checkbox' || meta.type === 'radio') {
      tests.push(`
        it('should check ${meta.elementName}', () => {
            page.check${capName}()
            page.isChecked${capName}()
        })`)

      tests.push(`
        it('should uncheck ${meta.elementName}', () => {
            page.uncheck${capName}()
            // Should be unchecked
        })`)
    } else if (meta.type === 'select' || meta.type === 'textarea' || meta.type === 'input') {
      tests.push(`
        it('should type in ${meta.elementName}', () => {
            page.type${capName}('test input')
            page.getValue${capName}().should('eq', 'test input')
        })`)

      tests.push(`
        it('should clear ${meta.elementName}', () => {
            page.type${capName}('test')
            page.clear${capName}()
            page.getValue${capName}().should('eq', '')
        })`)
    }
  })

  return tests
}

/**
 * Generate form validation tests (positive, negative, edge cases)
 */
function generateFormTests($: CheerioAPI, elementMeta: ElementMeta[]): string[] {
  const tests: string[] = []

  $('form').each((formIdx, form) => {
    const $form = $(form as Element)

    // Find all input/select/textarea in this form
    const fields: ElementMeta[] = []
    $form.find('input,select,textarea').each((_, el) => {
      const $el = $(el as Element)
      let base = ''

      if ($el.is('input')) {
        const type = $el.attr('type') || 'text'
        if (type === 'checkbox' || type === 'radio') {
          base = `input_${$el.attr('id') || $el.attr('name') || $el.attr('data-testid') || type}`
        } else {
          base = `input_${$el.attr('id') || $el.attr('name') || $el.attr('data-testid') || type}`
        }
      } else if ($el.is('select')) {
        base = `select_${$el.attr('id') || $el.attr('name') || $el.attr('data-testid') || 'select'}`
      } else if ($el.is('textarea')) {
        base = `textarea_${$el.attr('id') || $el.attr('name') || $el.attr('data-testid') || 'textarea'}`
      }

      // Normalize
      base = base.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()

      // Find the closest match in elementMeta
      const match = elementMeta.find((e) => e.elementName.startsWith(base))
      if (match) {
        fields.push(match)
      }
    })

    // Find submit button in form
    let submitBtn: string | null = null
    $form.find('button[type="submit"],input[type="submit"]').each((_, el) => {
      const $el = $(el as Element)
      let base = ''

      if ($el.is('button')) {
        base = `button_${$el.attr('id') || $el.text().trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'submit'}`
      } else {
        base = `input_${$el.attr('id') || $el.attr('name') || $el.attr('data-testid') || 'submit'}`
      }

      base = base.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      const match = elementMeta.find((e) => e.elementName.startsWith(base))
      if (match) submitBtn = match.elementName
    })

    if (!fields.length || !submitBtn) return

    // Positive test: All fields filled correctly
    const validData = fields
      .map((f) => {
        const capName = capitalize(f.elementName)
        if (f.type === 'checkbox' || f.type === 'radio') {
          return `            page.check${capName}()`
        }
        return `            page.type${capName}('valid_${f.elementName}')`
      })
      .join('\n')

    tests.push(`
        it('should submit form with valid data', () => {
${validData}
            page.click${capitalize(submitBtn)}()
            // Add assertions for successful submission
        })`)

    // Negative tests: Missing required fields (one at a time)
    fields.forEach((f) => {
      const capName = capitalize(f.elementName)
      const capSubmit = capitalize(submitBtn!)

      if (f.type === 'checkbox' || f.type === 'radio') {
        tests.push(`
        it('should show error if ${f.elementName} is not checked', () => {
            // Do not check ${f.elementName}
            page.click${capSubmit}()
            // Add assertions for error
        })`)
      } else {
        const otherFields = fields
          .filter((ff) => ff.elementName !== f.elementName)
          .map((ff) => {
            const capOther = capitalize(ff.elementName)
            if (ff.type === 'checkbox' || ff.type === 'radio') {
              return `            page.check${capOther}()`
            }
            return `            page.type${capOther}('valid_${ff.elementName}')`
          })
          .join('\n')

        tests.push(`
        it('should show error if ${f.elementName} is empty', () => {
${otherFields}
            // Leave ${f.elementName} empty
            page.click${capSubmit}()
            // Add assertions for error
        })`)
      }
    })

    // Edge case tests
    fields.forEach((f) => {
      if (f.type !== 'checkbox' && f.type !== 'radio') {
        const capName = capitalize(f.elementName)
        const capSubmit = capitalize(submitBtn!)

        tests.push(`
        it('should handle long input for ${f.elementName}', () => {
            page.type${capName}('a'.repeat(1000))
            page.click${capSubmit}()
            // Add assertions for edge case
        })`)

        tests.push(`
        it('should handle special characters for ${f.elementName}', () => {
            page.type${capName}('!@#$%^&*()_+-=[]{}|;:,.<>?')
            page.click${capSubmit}()
            // Add assertions for edge case
        })`)
      }
    })
  })

  return tests
}

/**
 * Generate workflow tests (login, search, register)
 */
function generateWorkflowTests(pageObjectMeta: PageObjectMeta): string[] {
  const tests: string[] = []

  // Check if workflow methods exist in class code
  if (typeof pageObjectMeta.classCode !== 'string') return tests

  // Login workflow tests
  if (/login\s*\(/.test(pageObjectMeta.classCode)) {
    tests.push(`
    describe('Login Workflow', () => {
        it('should login with valid credentials', () => {
            page.login('validuser', 'validpassword')
            // Add assertions for successful login
        })

        it('should show error with invalid credentials', () => {
            page.login('invaliduser', 'wrongpassword')
            // Add assertions for error
        })

        it('should show error with empty username', () => {
            page.login('', 'password')
            // Add assertions for error
        })

        it('should show error with empty password', () => {
            page.login('username', '')
            // Add assertions for error
        })
    })`)
  }

  // Search workflow tests
  if (/search\s*\(/.test(pageObjectMeta.classCode)) {
    tests.push(`
    describe('Search Workflow', () => {
        it('should search with valid query', () => {
            page.search('test query')
            // Add assertions for search results
        })

        it('should handle empty search query', () => {
            page.search('')
            // Add assertions for empty search
        })
    })`)
  }

  // Register workflow tests
  if (/register\s*\(/.test(pageObjectMeta.classCode)) {
    tests.push(`
    describe('Register Workflow', () => {
        it('should register with valid data', () => {
            page.register('user', 'email@example.com', 'password')
            // Add assertions for successful registration
        })

        it('should show error with invalid data', () => {
            page.register('', '', '')
            // Add assertions for error
        })
    })`)
  }

  return tests
}
