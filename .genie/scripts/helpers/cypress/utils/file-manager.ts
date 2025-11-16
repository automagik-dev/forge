/**
 * File Manager Utility
 * Extracted from cypress-mcp and adapted for TypeScript
 *
 * Features:
 * - Workspace detection (finds cypress.config.ts)
 * - Directory structure creation
 * - File backup mechanism
 * - Page Object file creation
 * - Test file creation
 * - Index file generation
 */

import * as fs from 'fs'
import * as path from 'path'
import type { FileManagerOptions, PageObjectMeta, TestSuite } from '../types'

/**
 * Default file manager options
 */
const DEFAULT_OPTIONS: FileManagerOptions = {
  workspaceRoot: process.cwd(),
  pagesDir: 'cypress/pages',
  testsDir: 'cypress/e2e/real-scenarios',
  backupEnabled: true,
}

/**
 * Detects Cypress workspace by looking for cypress.config.ts/js
 */
export function detectWorkspace(startPath: string = process.cwd()): string {
  let currentPath = path.resolve(startPath)

  // Traverse up to 10 levels
  for (let i = 0; i < 10; i++) {
    // Check for cypress.config.ts
    const tsConfig = path.join(currentPath, 'cypress.config.ts')
    if (fs.existsSync(tsConfig)) {
      console.log(`✓ Found Cypress workspace: ${currentPath}`)
      return currentPath
    }

    // Check for cypress.config.js
    const jsConfig = path.join(currentPath, 'cypress.config.js')
    if (fs.existsSync(jsConfig)) {
      console.log(`✓ Found Cypress workspace: ${currentPath}`)
      return currentPath
    }

    // Check for package.json with cypress dependency
    const packageJson = path.join(currentPath, 'package.json')
    if (fs.existsSync(packageJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'))
        if (pkg.dependencies?.cypress || pkg.devDependencies?.cypress) {
          console.log(`✓ Found Cypress workspace (via package.json): ${currentPath}`)
          return currentPath
        }
      } catch (err) {
        // Invalid package.json, continue
      }
    }

    // Move up one directory
    const parentPath = path.dirname(currentPath)
    if (parentPath === currentPath) {
      // Reached root
      break
    }
    currentPath = parentPath
  }

  throw new Error(
    'Could not find Cypress workspace. Make sure cypress.config.ts or cypress.config.js exists.'
  )
}

/**
 * Ensures directory structure exists
 */
export function ensureDirectoryStructure(options: Partial<FileManagerOptions> = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const directories = [
    'cypress',
    opts.pagesDir!,
    opts.testsDir!,
    'cypress/support',
    'cypress/fixtures',
  ]

  directories.forEach(dir => {
    const fullPath = path.join(opts.workspaceRoot, dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`✓ Created directory: ${dir}`)
    }
  })
}

/**
 * Creates backup of existing file
 */
function createBackup(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${filePath}.backup-${timestamp}`

  fs.copyFileSync(filePath, backupPath)
  console.log(`✓ Created backup: ${path.basename(backupPath)}`)
}

/**
 * Writes Page Object file
 */
export function writePageObject(
  pageObjectMeta: PageObjectMeta,
  options: Partial<FileManagerOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  ensureDirectoryStructure(opts)

  const fileName = `${pageObjectMeta.featureName.toLowerCase()}.ts`
  const filePath = path.join(opts.workspaceRoot, opts.pagesDir!, fileName)

  // Create backup if file exists
  if (opts.backupEnabled && fs.existsSync(filePath)) {
    createBackup(filePath)
  }

  // Write file
  fs.writeFileSync(filePath, pageObjectMeta.classCode, 'utf-8')
  console.log(`✓ Created Page Object: ${opts.pagesDir}/${fileName}`)

  return filePath
}

/**
 * Writes test file
 */
export function writeTestFile(
  testSuite: TestSuite,
  options: Partial<FileManagerOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  ensureDirectoryStructure(opts)

  const fileName = `${testSuite.featureName.toLowerCase()}.cy.ts`
  const filePath = path.join(opts.workspaceRoot, opts.testsDir!, fileName)

  // Create backup if file exists
  if (opts.backupEnabled && fs.existsSync(filePath)) {
    createBackup(filePath)
  }

  // Write file
  fs.writeFileSync(filePath, testSuite.code, 'utf-8')
  console.log(`✓ Created test file: ${opts.testsDir}/${fileName}`)

  return filePath
}

/**
 * Generates index file that exports all Page Objects
 */
export function writeIndexFile(
  pageObjectMetas: PageObjectMeta[],
  options: Partial<FileManagerOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  ensureDirectoryStructure(opts)

  const indexPath = path.join(opts.workspaceRoot, opts.pagesDir!, 'index.ts')

  // Scan pages directory for existing files
  const pagesDir = path.join(opts.workspaceRoot, opts.pagesDir!)
  const existingFiles = fs.existsSync(pagesDir)
    ? fs.readdirSync(pagesDir).filter(file => file.endsWith('.ts') && file !== 'index.ts')
    : []

  // Generate exports for all Page Objects
  const exports: string[] = []

  // Add existing files
  existingFiles.forEach(file => {
    const className = file
      .replace('.ts', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Page'
    const moduleName = file.replace('.ts', '')

    exports.push(`export { ${className} } from './${moduleName}'`)
  })

  // Add new files from pageObjectMetas
  pageObjectMetas.forEach(meta => {
    const fileName = meta.featureName.toLowerCase()
    const exportLine = `export { ${meta.className} } from './${fileName}'`

    // Don't duplicate if already exists
    if (!exports.includes(exportLine)) {
      exports.push(exportLine)
    }
  })

  const indexContent = `/**
 * Page Objects Index
 * Auto-generated barrel export file
 * Date: ${new Date().toISOString()}
 */

${exports.join('\n')}
`

  fs.writeFileSync(indexPath, indexContent, 'utf-8')
  console.log(`✓ Updated index file: ${opts.pagesDir}/index.ts`)

  return indexPath
}

/**
 * Lists all Page Object files
 */
export function listPageObjects(options: Partial<FileManagerOptions> = {}): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const pagesDir = path.join(opts.workspaceRoot, opts.pagesDir!)

  if (!fs.existsSync(pagesDir)) {
    return []
  }

  return fs
    .readdirSync(pagesDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .map(file => path.join(pagesDir, file))
}

/**
 * Lists all test files
 */
export function listTestFiles(options: Partial<FileManagerOptions> = {}): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const testsDir = path.join(opts.workspaceRoot, opts.testsDir!)

  if (!fs.existsSync(testsDir)) {
    return []
  }

  return fs
    .readdirSync(testsDir)
    .filter(file => file.endsWith('.cy.ts'))
    .map(file => path.join(testsDir, file))
}

/**
 * Cleans up backup files older than specified days
 */
export function cleanupBackups(days: number = 7, options: Partial<FileManagerOptions> = {}): number {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const dirs = [opts.pagesDir!, opts.testsDir!]

  let cleanedCount = 0
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000

  dirs.forEach(dir => {
    const fullPath = path.join(opts.workspaceRoot, dir)
    if (!fs.existsSync(fullPath)) return

    const files = fs.readdirSync(fullPath)

    files.forEach(file => {
      if (file.includes('.backup-')) {
        const filePath = path.join(fullPath, file)
        const stats = fs.statSync(filePath)

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath)
          cleanedCount++
        }
      }
    })
  })

  if (cleanedCount > 0) {
    console.log(`✓ Cleaned up ${cleanedCount} backup files older than ${days} days`)
  }

  return cleanedCount
}
