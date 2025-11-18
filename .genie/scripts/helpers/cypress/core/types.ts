/**
 * Core types for Cypress test generation
 * Extracted from cypress-mcp and adapted for TypeScript
 */

import type { CheerioAPI } from 'cheerio'

/**
 * Types of HTML elements we detect and generate tests for
 */
export type ElementType = 'button' | 'input' | 'link' | 'select' | 'textarea' | 'checkbox' | 'radio'

/**
 * Metadata about a detected element
 */
export interface ElementMeta {
  type: ElementType
  elementName: string
  locator: string
  text?: string
  attributes: Record<string, string>
}

/**
 * Detected workflow patterns (login, search, register, etc.)
 */
export interface DetectedWorkflow {
  type: 'login' | 'search' | 'register' | 'navigation'
  method: string // Generated workflow method code
  elements: string[] // Required element names
}

/**
 * Page Object metadata returned by generator
 */
export interface PageObjectMeta {
  classCode: string
  className: string
  featureName: string
  elementMeta: ElementMeta[]
}

/**
 * Options for Puppeteer scraping
 */
export interface ScraperOptions {
  url: string
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  timeout?: number
  headless?: boolean
}
