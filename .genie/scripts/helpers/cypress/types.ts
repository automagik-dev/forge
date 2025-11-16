/**
 * Type definitions for Cypress test automation generators
 * Extracted from cypress-mcp patterns and adapted for Automagik-Forge
 */

export type ElementType = 'button' | 'input' | 'link' | 'select' | 'textarea' | 'checkbox' | 'radio'

export type LocatorStrategy = 'data-testid' | 'id' | 'name' | 'text' | 'class' | 'index'

export interface ElementMeta {
  type: ElementType
  elementName: string
  locator: string
  locatorStrategy: LocatorStrategy
  attributes: {
    dataTestId?: string
    id?: string
    name?: string
    text?: string
    className?: string
    type?: string
    placeholder?: string
  }
  index: number
}

export interface WorkflowMeta {
  type: 'login' | 'search' | 'register' | 'task-creation' | 'pr-creation' | 'chat'
  elements: ElementMeta[]
  methodName: string
  parameters: string[]
}

export interface PageObjectMeta {
  className: string
  featureName: string
  url: string
  elements: ElementMeta[]
  workflows: WorkflowMeta[]
  classCode: string
}

export interface TestSuite {
  featureName: string
  imports: string[]
  describe: string
  testCases: TestCase[]
  code: string
}

export interface TestCase {
  type: 'element-interaction' | 'form-validation' | 'workflow' | 'accessibility' | 'performance'
  description: string
  code: string
}

export interface ScrapeOptions {
  url: string
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  timeout?: number
  viewport?: {
    width: number
    height: number
  }
  skipOnboarding?: boolean
}

export interface GeneratorOptions {
  featureName?: string
  outputDir?: string
  createBackup?: boolean
  skipTests?: boolean
}

export interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
}

export interface FileManagerOptions {
  workspaceRoot: string
  pagesDir?: string
  testsDir?: string
  backupEnabled?: boolean
}
