/**
 * Element Detection Logic
 * Extracted from cypress-mcp and adapted for TypeScript
 *
 * Priority order for locators:
 * 1. data-testid (most reliable)
 * 2. id attribute
 * 3. name attribute (forms)
 * 4. text content (buttons, links)
 * 5. class names (last resort)
 * 6. element index (fallback)
 */

import type { Cheerio, CheerioAPI, Element } from 'cheerio'
import type { ElementMeta, ElementType, LocatorStrategy } from '../types'

/**
 * Sanitizes a string for use as an element name
 * Removes special characters and converts to valid identifier
 */
export function sanitizeElementName(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
}

/**
 * Capitalizes first letter of each word
 */
export function capitalize(text: string): string {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/**
 * Detects all buttons on the page
 */
export function detectButtons($: CheerioAPI): ElementMeta[] {
  const elements: ElementMeta[] = []
  let index = 0

  $('button').each((_, element) => {
    const $el = $(element)
    const dataTestId = $el.attr('data-testid')
    const id = $el.attr('id')
    const text = $el.text().trim()
    const className = $el.attr('class')
    const type = $el.attr('type') || 'button'

    let locator = ''
    let elementName = ''
    let locatorStrategy: LocatorStrategy

    // Priority order for locator selection
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `button_${sanitizeElementName(dataTestId)}`
      locatorStrategy = 'data-testid'
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `button_${sanitizeElementName(id)}`
      locatorStrategy = 'id'
    } else if (text && text.length > 0 && text.length < 50) {
      locator = `cy.contains('button', '${text.replace(/'/g, "\\'")}')`
      elementName = `button_${sanitizeElementName(text)}`
      locatorStrategy = 'text'
    } else if (className) {
      const firstClass = className.split(' ')[0]
      locator = `cy.get('button.${firstClass}')`
      elementName = `button_${sanitizeElementName(firstClass)}`
      locatorStrategy = 'class'
    } else {
      locator = `cy.get('button').eq(${index})`
      elementName = `button_${index}`
      locatorStrategy = 'index'
    }

    elements.push({
      type: 'button',
      elementName,
      locator,
      locatorStrategy,
      attributes: {
        dataTestId,
        id,
        text,
        className,
        type,
      },
      index,
    })

    index++
  })

  return elements
}

/**
 * Detects all input fields on the page
 */
export function detectInputs($: CheerioAPI): ElementMeta[] {
  const elements: ElementMeta[] = []
  let index = 0

  $('input').each((_, element) => {
    const $el = $(element)
    const dataTestId = $el.attr('data-testid')
    const id = $el.attr('id')
    const name = $el.attr('name')
    const type = $el.attr('type') || 'text'
    const placeholder = $el.attr('placeholder')
    const className = $el.attr('class')

    let locator = ''
    let elementName = ''
    let locatorStrategy: LocatorStrategy

    // Priority order for locator selection
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `input_${sanitizeElementName(dataTestId)}`
      locatorStrategy = 'data-testid'
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `input_${sanitizeElementName(id)}`
      locatorStrategy = 'id'
    } else if (name) {
      locator = `cy.get('input[name="${name}"]')`
      elementName = `input_${sanitizeElementName(name)}`
      locatorStrategy = 'name'
    } else if (placeholder && placeholder.length < 50) {
      locator = `cy.get('input[placeholder="${placeholder}"]')`
      elementName = `input_${sanitizeElementName(placeholder)}`
      locatorStrategy = 'text'
    } else if (className) {
      const firstClass = className.split(' ')[0]
      locator = `cy.get('input.${firstClass}')`
      elementName = `input_${sanitizeElementName(firstClass)}`
      locatorStrategy = 'class'
    } else {
      locator = `cy.get('input[type="${type}"]').eq(${index})`
      elementName = `input_${type}_${index}`
      locatorStrategy = 'index'
    }

    const elementType: ElementType = type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : 'input'

    elements.push({
      type: elementType,
      elementName,
      locator,
      locatorStrategy,
      attributes: {
        dataTestId,
        id,
        name,
        type,
        placeholder,
        className,
      },
      index,
    })

    index++
  })

  return elements
}

/**
 * Detects all links on the page
 */
export function detectLinks($: CheerioAPI): ElementMeta[] {
  const elements: ElementMeta[] = []
  let index = 0

  $('a').each((_, element) => {
    const $el = $(element)
    const dataTestId = $el.attr('data-testid')
    const id = $el.attr('id')
    const text = $el.text().trim()
    const href = $el.attr('href')
    const className = $el.attr('class')

    let locator = ''
    let elementName = ''
    let locatorStrategy: LocatorStrategy

    // Priority order for locator selection
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `link_${sanitizeElementName(dataTestId)}`
      locatorStrategy = 'data-testid'
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `link_${sanitizeElementName(id)}`
      locatorStrategy = 'id'
    } else if (text && text.length > 0 && text.length < 50) {
      locator = `cy.contains('a', '${text.replace(/'/g, "\\'")}')`
      elementName = `link_${sanitizeElementName(text)}`
      locatorStrategy = 'text'
    } else if (href && href !== '#') {
      const path = href.split('/').pop() || 'link'
      locator = `cy.get('a[href="${href}"]')`
      elementName = `link_${sanitizeElementName(path)}`
      locatorStrategy = 'id'
    } else if (className) {
      const firstClass = className.split(' ')[0]
      locator = `cy.get('a.${firstClass}')`
      elementName = `link_${sanitizeElementName(firstClass)}`
      locatorStrategy = 'class'
    } else {
      locator = `cy.get('a').eq(${index})`
      elementName = `link_${index}`
      locatorStrategy = 'index'
    }

    elements.push({
      type: 'link',
      elementName,
      locator,
      locatorStrategy,
      attributes: {
        dataTestId,
        id,
        text,
        className,
      },
      index,
    })

    index++
  })

  return elements
}

/**
 * Detects all select elements on the page
 */
export function detectSelects($: CheerioAPI): ElementMeta[] {
  const elements: ElementMeta[] = []
  let index = 0

  $('select').each((_, element) => {
    const $el = $(element)
    const dataTestId = $el.attr('data-testid')
    const id = $el.attr('id')
    const name = $el.attr('name')
    const className = $el.attr('class')

    let locator = ''
    let elementName = ''
    let locatorStrategy: LocatorStrategy

    // Priority order for locator selection
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `select_${sanitizeElementName(dataTestId)}`
      locatorStrategy = 'data-testid'
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `select_${sanitizeElementName(id)}`
      locatorStrategy = 'id'
    } else if (name) {
      locator = `cy.get('select[name="${name}"]')`
      elementName = `select_${sanitizeElementName(name)}`
      locatorStrategy = 'name'
    } else if (className) {
      const firstClass = className.split(' ')[0]
      locator = `cy.get('select.${firstClass}')`
      elementName = `select_${sanitizeElementName(firstClass)}`
      locatorStrategy = 'class'
    } else {
      locator = `cy.get('select').eq(${index})`
      elementName = `select_${index}`
      locatorStrategy = 'index'
    }

    elements.push({
      type: 'select',
      elementName,
      locator,
      locatorStrategy,
      attributes: {
        dataTestId,
        id,
        name,
        className,
      },
      index,
    })

    index++
  })

  return elements
}

/**
 * Detects all textarea elements on the page
 */
export function detectTextareas($: CheerioAPI): ElementMeta[] {
  const elements: ElementMeta[] = []
  let index = 0

  $('textarea').each((_, element) => {
    const $el = $(element)
    const dataTestId = $el.attr('data-testid')
    const id = $el.attr('id')
    const name = $el.attr('name')
    const placeholder = $el.attr('placeholder')
    const className = $el.attr('class')

    let locator = ''
    let elementName = ''
    let locatorStrategy: LocatorStrategy

    // Priority order for locator selection
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `textarea_${sanitizeElementName(dataTestId)}`
      locatorStrategy = 'data-testid'
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `textarea_${sanitizeElementName(id)}`
      locatorStrategy = 'id'
    } else if (name) {
      locator = `cy.get('textarea[name="${name}"]')`
      elementName = `textarea_${sanitizeElementName(name)}`
      locatorStrategy = 'name'
    } else if (placeholder && placeholder.length < 50) {
      locator = `cy.get('textarea[placeholder="${placeholder}"]')`
      elementName = `textarea_${sanitizeElementName(placeholder)}`
      locatorStrategy = 'text'
    } else if (className) {
      const firstClass = className.split(' ')[0]
      locator = `cy.get('textarea.${firstClass}')`
      elementName = `textarea_${sanitizeElementName(firstClass)}`
      locatorStrategy = 'class'
    } else {
      locator = `cy.get('textarea').eq(${index})`
      elementName = `textarea_${index}`
      locatorStrategy = 'index'
    }

    elements.push({
      type: 'textarea',
      elementName,
      locator,
      locatorStrategy,
      attributes: {
        dataTestId,
        id,
        name,
        placeholder,
        className,
      },
      index,
    })

    index++
  })

  return elements
}

/**
 * Detects all interactive elements on the page
 */
export function detectAllElements($: CheerioAPI): ElementMeta[] {
  return [
    ...detectButtons($),
    ...detectInputs($),
    ...detectLinks($),
    ...detectSelects($),
    ...detectTextareas($),
  ]
}
