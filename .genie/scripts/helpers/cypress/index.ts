/**
 * Cypress Test Automation - Main Entry Point
 * Phase 1: Foundation (core generators extracted from cypress-mcp)
 */

// Core types
export type {
  ElementType,
  ElementMeta,
  DetectedWorkflow,
  PageObjectMeta,
  ScraperOptions
} from './core/types.js'

// Core generators
export { generatePageObjectClass } from './core/page-object-generator.js'
export { generateCypressTests } from './core/test-generator.js'

// Element detection
export {
  detectButtons,
  detectInputs,
  detectLinks,
  detectSelects,
  detectTextareas,
  detectAllElements
} from './core/element-detector.js'

// Workflow detection
export {
  detectLoginWorkflow,
  detectSearchWorkflow,
  detectRegisterWorkflow,
  detectAllWorkflows
} from './core/workflow-detector.js'

// Utilities
export { scrapePage, scrapePages } from './utils/puppeteer-scraper.js'
export { CypressFileManager } from './utils/file-manager.js'
export {
  sanitizeElementName,
  sanitizeFeatureName,
  capitalize,
  inferFeatureName,
  generateClassName
} from './utils/naming-helpers.js'

/**
 * High-level convenience function to generate tests from URL
 * @param url Page URL to scrape
 * @param workspacePath Optional workspace path (auto-detected if not provided)
 * @param featureName Optional custom feature name
 * @returns Object with file paths and metadata
 */
export async function generateTestsFromUrl(
  url: string,
  workspacePath?: string,
  featureName?: string
): Promise<{
  pageObjectPath: string
  testFilePath: string
  indexPath: string
  pageObjectMeta: PageObjectMeta
}> {
  const { scrapePage } = await import('./utils/puppeteer-scraper.js')
  const { generatePageObjectClass } = await import('./core/page-object-generator.js')
  const { generateCypressTests } = await import('./core/test-generator.js')
  const { CypressFileManager } = await import('./utils/file-manager.js')
  const { PageObjectMeta } = await import('./core/types.js')

  // Scrape the page
  const $ = await scrapePage({ url })

  // Generate Page Object
  const pageObjectMeta = generatePageObjectClass($, url, featureName)

  // Generate tests
  const testCode = generateCypressTests($, pageObjectMeta, url)

  // Write files
  const fileManager = new CypressFileManager()
  const workspaceRoot = await fileManager.detectWorkspace(workspacePath)
  await fileManager.ensureDirectoryStructure(workspaceRoot)

  const pageObjectPath = await fileManager.createPageObject(workspaceRoot, pageObjectMeta)
  const testFilePath = await fileManager.createTestFile(
    workspaceRoot,
    testCode,
    pageObjectMeta.featureName
  )
  const indexPath = await fileManager.createIndexFile(workspaceRoot)

  return {
    pageObjectPath,
    testFilePath,
    indexPath,
    pageObjectMeta
  }
}
