/**
 * Page Object Generator
 * Extracted from cypress-mcp (lines 182-451)
 *
 * Generates TypeScript Page Object class from parsed HTML with:
 * - Private locators (data-testid priority)
 * - Public getters
 * - Interaction methods
 * - Value getters
 * - Workflow methods
 */

import type { CheerioAPI } from 'cheerio'
import type { PageObjectMeta, ElementMeta } from './types.js'
import { detectAllElements } from './element-detector.js'
import { detectAllWorkflows } from './workflow-detector.js'
import { inferFeatureName, capitalize } from '../utils/naming-helpers.js'

/**
 * Generate Page Object class from parsed HTML
 * @param $ Cheerio instance with loaded HTML
 * @param url Page URL
 * @param customFeatureName Optional custom feature name
 * @returns Page Object metadata with generated class code
 */
export function generatePageObjectClass(
  $: CheerioAPI,
  url: string,
  customFeatureName?: string
): PageObjectMeta {
  const featureName = customFeatureName || inferFeatureName($, url)
  const className = capitalize(featureName) + 'Page'

  // Detect all elements
  const elementMeta = detectAllElements($)

  // Generate code sections
  const elements = generateElementsSection(elementMeta)
  const getters = generateGettersSection(elementMeta)
  const valueGetters = generateValueGettersSection(elementMeta)
  const interactionMethods = generateInteractionMethodsSection(elementMeta)
  const workflowMethods = detectAllWorkflows($, url)

  // Build meta map for element types
  const metaMap = elementMeta.reduce((acc, m) => {
    acc[m.elementName] = m.type
    return acc
  }, {} as Record<string, string>)

  // Compose class code
  const classCode = `export class ${className} {
  // Private elements
  private elements = {
${elements.join(',\n')}
  }

  // Element meta (for reference)
  private meta = ${JSON.stringify(metaMap, null, 2)}

  // Public getters
${getters.join('\n')}

  // Value/State getters
${valueGetters.join('\n')}

  // Interaction methods (per-element actions)
${interactionMethods.join('\n')}

  // Workflow methods
${workflowMethods.join('\n')}
}
`

  return {
    classCode,
    className,
    featureName,
    elementMeta
  }
}

/**
 * Generate private elements section
 */
function generateElementsSection(elementMeta: ElementMeta[]): string[] {
  return elementMeta.map((meta) => `    ${meta.elementName}: () => ${meta.locator}`)
}

/**
 * Generate public getters section
 */
function generateGettersSection(elementMeta: ElementMeta[]): string[] {
  return elementMeta.map(
    (meta) =>
      `  get ${capitalize(meta.elementName)}(): Cypress.Chainable {\n` +
      `    return this.elements.${meta.elementName}()\n` +
      `  }`
  )
}

/**
 * Generate value getters section (getText, getValue, isChecked)
 */
function generateValueGettersSection(elementMeta: ElementMeta[]): string[] {
  return elementMeta.map((meta) => {
    const capName = capitalize(meta.elementName)

    if (meta.type === 'button' || meta.type === 'link') {
      return (
        `  getText${capName}(): Cypress.Chainable {\n` +
        `    return this.elements.${meta.elementName}().invoke('text')\n` +
        `  }`
      )
    } else if (meta.type === 'checkbox' || meta.type === 'radio') {
      return (
        `  isChecked${capName}(): Cypress.Chainable {\n` +
        `    return this.elements.${meta.elementName}().should('have.prop', 'checked')\n` +
        `  }`
      )
    } else {
      return (
        `  getValue${capName}(): Cypress.Chainable {\n` +
        `    return this.elements.${meta.elementName}().invoke('val')\n` +
        `  }`
      )
    }
  })
}

/**
 * Generate interaction methods section (click, type, check, select)
 */
function generateInteractionMethodsSection(elementMeta: ElementMeta[]): string[] {
  const methods: string[] = []

  elementMeta.forEach((meta) => {
    const capName = capitalize(meta.elementName)

    if (meta.type === 'button' || meta.type === 'link') {
      methods.push(
        `  click${capName}(): void {\n` +
          `    this.elements.${meta.elementName}().click()\n` +
          `  }`
      )
    } else if (meta.type === 'checkbox' || meta.type === 'radio') {
      methods.push(
        `  check${capName}(): void {\n` +
          `    this.elements.${meta.elementName}().check()\n` +
          `  }`
      )
      methods.push(
        `  uncheck${capName}(): void {\n` +
          `    this.elements.${meta.elementName}().uncheck()\n` +
          `  }`
      )
    } else if (meta.type === 'select') {
      methods.push(
        `  select${capName}(value: string): void {\n` +
          `    this.elements.${meta.elementName}().select(value)\n` +
          `  }`
      )
    } else {
      // input, textarea
      methods.push(
        `  type${capName}(text: string): void {\n` +
          `    this.elements.${meta.elementName}().type(text)\n` +
          `  }`
      )
      methods.push(
        `  clear${capName}(): void {\n` +
          `    this.elements.${meta.elementName}().clear()\n` +
          `  }`
      )
    }
  })

  return methods
}
