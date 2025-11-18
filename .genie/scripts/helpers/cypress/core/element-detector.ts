/**
 * Element detection with priority locator strategies
 * Extracted from cypress-mcp (lines 196-359)
 *
 * Priority order for locators:
 * 1. data-testid (most reliable, recommended)
 * 2. id attribute
 * 3. name attribute (for forms)
 * 4. text content (buttons, links)
 * 5. class names (last resort)
 * 6. element index (fallback)
 */

import type { CheerioAPI, Element } from 'cheerio'
import type { ElementMeta } from './types.js'
import { sanitizeElementName, capitalize } from '../utils/naming-helpers.js'

/**
 * Detect all buttons on the page
 */
export function detectButtons($: CheerioAPI): ElementMeta[] {
  const buttons: ElementMeta[] = []
  let elementCounter = 1

  $('button').each((_, element) => {
    const $el = $(element as Element)
    const text = $el.text().trim()
    const id = $el.attr('id')
    const className = $el.attr('class')
    const dataTestId = $el.attr('data-testid')

    let locator = ''
    let elementName = ''

    // Priority order
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `button_${sanitizeElementName(dataTestId)}`
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `button_${id}`
    } else if (text) {
      locator = `cy.contains('button', '${text}')`
      elementName = `button_${sanitizeElementName(text.toLowerCase())}`
    } else if (className) {
      locator = `cy.get('button.${className.split(' ')[0]}')`
      elementName = `button_${className.split(' ')[0]}`
    } else {
      locator = `cy.get('button').eq(${elementCounter - 1})`
      elementName = `button_${elementCounter}`
    }

    buttons.push({
      type: 'button',
      elementName,
      locator,
      text,
      attributes: {
        id: id || '',
        class: className || '',
        'data-testid': dataTestId || ''
      }
    })

    elementCounter++
  })

  return buttons
}

/**
 * Detect all inputs on the page
 */
export function detectInputs($: CheerioAPI): ElementMeta[] {
  const inputs: ElementMeta[] = []
  let elementCounter = 1

  $('input').each((_, element) => {
    const $el = $(element as Element)
    const type = $el.attr('type') || 'text'
    const id = $el.attr('id')
    const name = $el.attr('name')
    const placeholder = $el.attr('placeholder')
    const dataTestId = $el.attr('data-testid')

    let locator = ''
    let elementName = ''

    // Priority order
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `input_${sanitizeElementName(dataTestId)}`
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `input_${id}`
    } else if (name) {
      locator = `cy.get('input[name="${name}"]')`
      elementName = `input_${name}`
    } else if (placeholder) {
      locator = `cy.get('input[placeholder="${placeholder}"]')`
      elementName = `input_${sanitizeElementName(placeholder.toLowerCase())}`
    } else {
      locator = `cy.get('input[type="${type}"]').eq(${elementCounter - 1})`
      elementName = `input_${type}_${elementCounter}`
    }

    inputs.push({
      type: (type === 'checkbox' || type === 'radio' ? type : 'input') as ElementMeta['type'],
      elementName,
      locator,
      attributes: {
        type,
        id: id || '',
        name: name || '',
        placeholder: placeholder || '',
        'data-testid': dataTestId || ''
      }
    })

    elementCounter++
  })

  return inputs
}

/**
 * Detect all links on the page
 */
export function detectLinks($: CheerioAPI): ElementMeta[] {
  const links: ElementMeta[] = []
  let elementCounter = 1

  $('a').each((_, element) => {
    const $el = $(element as Element)
    const text = $el.text().trim()
    const href = $el.attr('href')
    const id = $el.attr('id')
    const dataTestId = $el.attr('data-testid')

    let locator = ''
    let elementName = ''

    // Priority order
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `link_${sanitizeElementName(dataTestId)}`
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `link_${id}`
    } else if (text) {
      locator = `cy.contains('a', '${text}')`
      elementName = `link_${sanitizeElementName(text.toLowerCase())}`
    } else if (href) {
      locator = `cy.get('a[href="${href}"]')`
      elementName = `link_${sanitizeElementName(href.toLowerCase())}`
    } else {
      locator = `cy.get('a').eq(${elementCounter - 1})`
      elementName = `link_${elementCounter}`
    }

    links.push({
      type: 'link',
      elementName,
      locator,
      text,
      attributes: {
        id: id || '',
        href: href || '',
        'data-testid': dataTestId || ''
      }
    })

    elementCounter++
  })

  return links
}

/**
 * Detect all select elements on the page
 */
export function detectSelects($: CheerioAPI): ElementMeta[] {
  const selects: ElementMeta[] = []
  let elementCounter = 1

  $('select').each((_, element) => {
    const $el = $(element as Element)
    const id = $el.attr('id')
    const name = $el.attr('name')
    const dataTestId = $el.attr('data-testid')

    let locator = ''
    let elementName = ''

    // Priority order
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `select_${sanitizeElementName(dataTestId)}`
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `select_${id}`
    } else if (name) {
      locator = `cy.get('select[name="${name}"]')`
      elementName = `select_${name}`
    } else {
      locator = `cy.get('select').eq(${elementCounter - 1})`
      elementName = `select_${elementCounter}`
    }

    selects.push({
      type: 'select',
      elementName,
      locator,
      attributes: {
        id: id || '',
        name: name || '',
        'data-testid': dataTestId || ''
      }
    })

    elementCounter++
  })

  return selects
}

/**
 * Detect all textarea elements on the page
 */
export function detectTextareas($: CheerioAPI): ElementMeta[] {
  const textareas: ElementMeta[] = []
  let elementCounter = 1

  $('textarea').each((_, element) => {
    const $el = $(element as Element)
    const id = $el.attr('id')
    const name = $el.attr('name')
    const placeholder = $el.attr('placeholder')
    const dataTestId = $el.attr('data-testid')

    let locator = ''
    let elementName = ''

    // Priority order
    if (dataTestId) {
      locator = `cy.get('[data-testid="${dataTestId}"]')`
      elementName = `textarea_${sanitizeElementName(dataTestId)}`
    } else if (id) {
      locator = `cy.get('#${id}')`
      elementName = `textarea_${id}`
    } else if (name) {
      locator = `cy.get('textarea[name="${name}"]')`
      elementName = `textarea_${name}`
    } else if (placeholder) {
      locator = `cy.get('textarea[placeholder="${placeholder}"]')`
      elementName = `textarea_${sanitizeElementName(placeholder.toLowerCase())}`
    } else {
      locator = `cy.get('textarea').eq(${elementCounter - 1})`
      elementName = `textarea_${elementCounter}`
    }

    textareas.push({
      type: 'textarea',
      elementName,
      locator,
      attributes: {
        id: id || '',
        name: name || '',
        placeholder: placeholder || '',
        'data-testid': dataTestId || ''
      }
    })

    elementCounter++
  })

  return textareas
}

/**
 * Detect all elements on the page (convenience function)
 */
export function detectAllElements($: CheerioAPI): ElementMeta[] {
  return [
    ...detectButtons($),
    ...detectInputs($),
    ...detectLinks($),
    ...detectSelects($),
    ...detectTextareas($)
  ]
}
