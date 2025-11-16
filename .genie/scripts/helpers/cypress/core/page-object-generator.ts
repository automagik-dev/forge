/**
 * Page Object Generator
 * Extracted from cypress-mcp and adapted for TypeScript
 *
 * Generates TypeScript Page Object classes from detected elements and workflows
 * Pattern: Private locators + Public getters + Interaction methods + Workflow methods
 */

import type { CheerioAPI } from 'cheerio'
import type { ElementMeta, PageObjectMeta, WorkflowMeta } from '../types'
import { detectAllElements, capitalize } from './element-detector'
import { detectAllWorkflows, generateWorkflowMethod } from './workflow-detector'

/**
 * Infers feature name from page structure or URL
 */
export function inferFeatureName($: CheerioAPI, url: string): string {
  // Try to get from form name
  const form = $('form').first()
  if (form.length > 0) {
    const formId = form.attr('id')
    const formClass = form.attr('class')
    if (formId) return capitalize(formId.replace(/-/g, '_'))
    if (formClass) {
      const firstClass = formClass.split(' ')[0]
      return capitalize(firstClass.replace(/-/g, '_'))
    }
  }

  // Try to get from h1
  const h1 = $('h1').first().text().trim()
  if (h1 && h1.length < 50) {
    return capitalize(h1.replace(/[^a-zA-Z0-9]/g, '_'))
  }

  // Try to get from title
  const title = $('title').text().trim()
  if (title && title.length < 50) {
    return capitalize(title.replace(/[^a-zA-Z0-9]/g, '_'))
  }

  // Try to get from URL
  const urlObj = new URL(url)
  const path = urlObj.pathname.split('/').filter(Boolean)
  if (path.length > 0) {
    const lastSegment = path[path.length - 1]
    return capitalize(lastSegment.replace(/[^a-zA-Z0-9]/g, '_'))
  }

  // Default fallback
  return 'Page'
}

/**
 * Generates private elements object
 */
function generateElementsObject(elements: ElementMeta[]): string {
  if (elements.length === 0) {
    return '  private elements: Record<string, () => Cypress.Chainable> = {}'
  }

  const elementEntries = elements.map(el => {
    return `    ${el.elementName}: () => ${el.locator}`
  })

  return `  private elements = {
${elementEntries.join(',\n')}
  }`
}

/**
 * Generates public getter methods
 */
function generateGetters(elements: ElementMeta[]): string {
  if (elements.length === 0) return ''

  const getters = elements.map(el => {
    const capitalizedName = capitalize(el.elementName)
    return `  get ${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}()
  }`
  })

  return getters.join('\n\n')
}

/**
 * Generates interaction methods (click, type, select, check, etc.)
 */
function generateInteractionMethods(elements: ElementMeta[]): string {
  if (elements.length === 0) return ''

  const methods: string[] = []

  elements.forEach(el => {
    const capitalizedName = capitalize(el.elementName)

    switch (el.type) {
      case 'button':
      case 'link':
        methods.push(`  click${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().click()
  }`)
        break

      case 'input':
      case 'textarea':
        methods.push(`  type${capitalizedName}(text: string): Cypress.Chainable {
    return this.elements.${el.elementName}().clear().type(text)
  }

  clear${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().clear()
  }

  getValue${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().invoke('val')
  }`)
        break

      case 'select':
        methods.push(`  select${capitalizedName}(value: string): Cypress.Chainable {
    return this.elements.${el.elementName}().select(value)
  }

  getSelected${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().find('option:selected')
  }`)
        break

      case 'checkbox':
      case 'radio':
        methods.push(`  check${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().check()
  }

  uncheck${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().uncheck()
  }

  isChecked${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().should('be.checked')
  }`)
        break
    }
  })

  return methods.join('\n\n')
}

/**
 * Generates value getter methods (getText, getValue, etc.)
 */
function generateValueGetters(elements: ElementMeta[]): string {
  if (elements.length === 0) return ''

  const getters: string[] = []

  elements.forEach(el => {
    const capitalizedName = capitalize(el.elementName)

    if (el.type === 'button' || el.type === 'link') {
      getters.push(`  getText${capitalizedName}(): Cypress.Chainable {
    return this.elements.${el.elementName}().invoke('text')
  }`)
    }
  })

  return getters.join('\n\n')
}

/**
 * Generates workflow methods from detected patterns
 */
function generateWorkflowMethods(workflows: WorkflowMeta[], elements: ElementMeta[]): string {
  if (workflows.length === 0) return ''

  const methods = workflows.map(workflow => generateWorkflowMethod(workflow, elements))
  return methods.join('\n')
}

/**
 * Generates complete Page Object class code
 */
export function generatePageObjectClass(
  $: CheerioAPI,
  url: string,
  featureName?: string
): PageObjectMeta {
  // Infer feature name if not provided
  const inferredFeatureName = featureName || inferFeatureName($, url)
  const className = `${inferredFeatureName}Page`

  // Detect all elements
  const elements = detectAllElements($)

  // Detect workflows
  const workflows = detectAllWorkflows(elements)

  // Generate class sections
  const elementsObject = generateElementsObject(elements)
  const getters = generateGetters(elements)
  const interactionMethods = generateInteractionMethods(elements)
  const valueGetters = generateValueGetters(elements)
  const workflowMethods = generateWorkflowMethods(workflows, elements)

  // Assemble class code
  const classCode = `/**
 * Page Object for ${inferredFeatureName}
 * Generated from: ${url}
 * Date: ${new Date().toISOString()}
 */

export class ${className} {
${elementsObject}

  // Public element getters
${getters}

  // Interaction methods
${interactionMethods}

  // Value getters
${valueGetters}

  // Workflow methods
${workflowMethods}

  /**
   * Verifies page is loaded
   */
  verifyPageLoaded(): Cypress.Chainable {
    cy.url().should('include', '${new URL(url).pathname}')
    return cy.wrap(this)
  }
}
`

  return {
    className,
    featureName: inferredFeatureName,
    url,
    elements,
    workflows,
    classCode,
  }
}

/**
 * Generates index file that exports all Page Objects
 */
export function generateIndexFile(pageObjectMetas: PageObjectMeta[]): string {
  if (pageObjectMetas.length === 0) {
    return '// No Page Objects generated yet\n'
  }

  const exports = pageObjectMetas.map(meta => {
    const fileName = meta.featureName.toLowerCase()
    return `export { ${meta.className} } from './${fileName}'`
  })

  return `/**
 * Page Objects Index
 * Auto-generated barrel export file
 * Date: ${new Date().toISOString()}
 */

${exports.join('\n')}
`
}
