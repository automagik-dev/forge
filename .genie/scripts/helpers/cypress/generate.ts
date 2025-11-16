#!/usr/bin/env node

/**
 * Cypress Test Generator CLI
 * Main orchestrator that ties everything together
 *
 * Usage:
 *   npm run cypress:generate -- --url http://localhost:3000
 *   npm run cypress:generate -- --url http://localhost:3000/tasks --feature tasks
 *
 * Features:
 * - Scrapes pages with Puppeteer
 * - Generates Page Objects from real DOM
 * - Generates comprehensive test suites
 * - Writes files to proper directories
 */

import { scrapePage } from './utils/puppeteer-scraper'
import { generatePageObjectClass } from './core/page-object-generator'
import { generateCypressTests } from './core/test-generator'
import {
  detectWorkspace,
  writePageObject,
  writeTestFile,
  writeIndexFile,
} from './utils/file-manager'
import type { GeneratorOptions } from './types'

/**
 * Main generation pipeline
 */
export async function generate(url: string, options: GeneratorOptions = {}) {
  console.log('\n=== Cypress Test Generator ===\n')

  try {
    // Step 1: Detect workspace
    console.log('Step 1: Detecting Cypress workspace...')
    const workspaceRoot = detectWorkspace()
    console.log(`Workspace: ${workspaceRoot}\n`)

    // Step 2: Scrape page
    console.log('Step 2: Scraping page...')
    const $ = await scrapePage({
      url,
      skipOnboarding: true,
      viewport: { width: 393, height: 852 },
    })
    console.log('')

    // Step 3: Generate Page Object
    console.log('Step 3: Generating Page Object...')
    const pageObjectMeta = generatePageObjectClass($, url, options.featureName)
    console.log(`  Feature: ${pageObjectMeta.featureName}`)
    console.log(`  Class: ${pageObjectMeta.className}`)
    console.log(`  Elements detected: ${pageObjectMeta.elements.length}`)
    console.log(`  Workflows detected: ${pageObjectMeta.workflows.length}`)
    if (pageObjectMeta.workflows.length > 0) {
      pageObjectMeta.workflows.forEach(w => {
        console.log(`    - ${w.type} (${w.methodName})`)
      })
    }
    console.log('')

    // Step 4: Generate tests
    console.log('Step 4: Generating test suite...')
    const testSuite = generateCypressTests($, pageObjectMeta, url)
    console.log(`  Test cases: ${testSuite.testCases.length}`)
    console.log('')

    // Step 5: Write Page Object
    if (!options.skipTests) {
      console.log('Step 5: Writing Page Object file...')
      const pageObjectPath = writePageObject(pageObjectMeta, {
        workspaceRoot,
        outputDir: options.outputDir,
        backupEnabled: options.createBackup !== false,
      })
      console.log('')

      // Step 6: Write test file
      console.log('Step 6: Writing test file...')
      const testPath = writeTestFile(testSuite, {
        workspaceRoot,
        outputDir: options.outputDir,
        backupEnabled: options.createBackup !== false,
      })
      console.log('')

      // Step 7: Update index
      console.log('Step 7: Updating index file...')
      writeIndexFile([pageObjectMeta], { workspaceRoot })
      console.log('')
    }

    console.log('✅ Generation complete!\n')

    // Print summary
    console.log('=== Summary ===')
    console.log(`URL: ${url}`)
    console.log(`Feature: ${pageObjectMeta.featureName}`)
    console.log(`Elements: ${pageObjectMeta.elements.length}`)
    console.log(`Workflows: ${pageObjectMeta.workflows.length}`)
    console.log(`Test cases: ${testSuite.testCases.length}`)
    console.log('')

    console.log('Next steps:')
    console.log('1. Review generated Page Object: cypress/pages/')
    console.log('2. Review generated tests: cypress/e2e/real-scenarios/')
    console.log('3. Run tests: npm run test:e2e')
    console.log('')

    return {
      pageObjectMeta,
      testSuite,
    }
  } catch (error) {
    console.error('\n❌ Generation failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

/**
 * Generates tests for multiple pages
 */
export async function generateMultiple(urls: string[], options: GeneratorOptions = {}) {
  console.log(`\n=== Generating tests for ${urls.length} pages ===\n`)

  const results = []

  for (const url of urls) {
    console.log(`\n--- Processing: ${url} ---\n`)
    const result = await generate(url, options)
    results.push(result)
  }

  console.log(`\n✅ Generated tests for ${urls.length} pages!\n`)

  return results
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  let url = 'http://localhost:3000'
  let featureName: string | undefined
  let outputDir: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1]
      i++
    } else if (args[i] === '--feature' && args[i + 1]) {
      featureName = args[i + 1]
      i++
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1]
      i++
    } else if (args[i] === '--help') {
      console.log(`
Cypress Test Generator

Usage:
  npm run cypress:generate -- --url <url> [options]

Options:
  --url <url>        URL to scrape (default: http://localhost:3000)
  --feature <name>   Feature name (default: auto-detected)
  --output <dir>     Output directory (default: auto-detected)
  --help             Show this help message

Examples:
  npm run cypress:generate -- --url http://localhost:3000
  npm run cypress:generate -- --url http://localhost:3000/tasks --feature tasks
      `)
      process.exit(0)
    }
  }

  await generate(url, { featureName, outputDir })
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
