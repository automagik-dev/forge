/**
 * Cypress File Manager
 * Extracted from cypress-mcp (lines 20-178)
 *
 * Manages Cypress project file operations:
 * - Workspace detection
 * - Directory structure creation
 * - Page Object file creation
 * - Test file creation
 * - Index file generation
 */

import fs from 'fs/promises'
import path from 'path'
import type { PageObjectMeta } from '../core/types.js'

export class CypressFileManager {
  private workspaceRoot: string | null = null
  private cypressConfig: any = null

  /**
   * Detect Cypress workspace by finding cypress.config.js/ts
   * Traverses up from startPath until found
   * @param startPath Starting directory (defaults to cwd)
   * @returns Workspace root path
   */
  async detectWorkspace(startPath: string = process.cwd()): Promise<string> {
    let currentPath = startPath

    while (currentPath !== path.dirname(currentPath)) {
      const cypressConfigJs = path.join(currentPath, 'cypress.config.js')
      const cypressConfigTs = path.join(currentPath, 'cypress.config.ts')
      const packageJson = path.join(currentPath, 'package.json')

      if ((await this.fileExists(cypressConfigJs)) || (await this.fileExists(cypressConfigTs))) {
        this.workspaceRoot = currentPath
        await this.loadCypressConfig(currentPath)
        return currentPath
      }

      // Also check if it's a Node.js project with Cypress in dependencies
      if (await this.fileExists(packageJson)) {
        try {
          const packageContent = await fs.readFile(packageJson, 'utf8')
          const packageData = JSON.parse(packageContent)
          const hasCypress =
            packageData.dependencies?.cypress ||
            packageData.devDependencies?.cypress ||
            packageData.dependencies?.['@cypress/react'] ||
            packageData.devDependencies?.['@cypress/react']

          if (hasCypress) {
            this.workspaceRoot = currentPath
            return currentPath
          }
        } catch (error) {
          // Continue searching
        }
      }

      currentPath = path.dirname(currentPath)
    }

    throw new Error(
      'No valid Cypress project found. Make sure you are in a directory with cypress.config.js/ts or a package.json with Cypress as a dependency.'
    )
  }

  /**
   * Load Cypress configuration (currently returns defaults)
   * @param workspaceRoot Workspace root path
   */
  private async loadCypressConfig(workspaceRoot: string): Promise<void> {
    const configJsPath = path.join(workspaceRoot, 'cypress.config.js')
    const configTsPath = path.join(workspaceRoot, 'cypress.config.ts')

    try {
      let configPath: string | null = null
      if (await this.fileExists(configJsPath)) {
        configPath = configJsPath
      } else if (await this.fileExists(configTsPath)) {
        configPath = configTsPath
      }

      if (configPath) {
        // For now, use default paths
        // In a more sophisticated version, we could dynamically import and parse the config
        this.cypressConfig = {
          e2e: {
            specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
            supportFile: 'cypress/support/e2e.js'
          },
          component: {
            specPattern: 'cypress/component/**/*.cy.{js,ts}'
          }
        }
      }
    } catch (error) {
      console.warn('Could not load Cypress config, using defaults:', (error as Error).message)
      this.cypressConfig = {
        e2e: {
          specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
          supportFile: 'cypress/support/e2e.js'
        }
      }
    }
  }

  /**
   * Check if file exists
   * @param filePath Path to check
   * @returns True if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Ensure Cypress directory structure exists
   * Creates:
   * - cypress/
   * - cypress/pages/
   * - cypress/e2e/
   * - cypress/e2e/real-scenarios/ (for generated tests)
   * - cypress/support/
   * - cypress/fixtures/
   */
  async ensureDirectoryStructure(workspaceRoot: string): Promise<void> {
    const directories = [
      path.join(workspaceRoot, 'cypress'),
      path.join(workspaceRoot, 'cypress', 'pages'),
      path.join(workspaceRoot, 'cypress', 'e2e'),
      path.join(workspaceRoot, 'cypress', 'e2e', 'real-scenarios'),
      path.join(workspaceRoot, 'cypress', 'support'),
      path.join(workspaceRoot, 'cypress', 'fixtures')
    ]

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true })
    }
  }

  /**
   * Create Page Object file
   * Creates backup if file already exists
   * @param workspaceRoot Workspace root path
   * @param pageObjectMeta Page Object metadata
   * @returns Path to created file
   */
  async createPageObject(
    workspaceRoot: string,
    pageObjectMeta: PageObjectMeta
  ): Promise<string> {
    const { featureName, classCode } = pageObjectMeta
    const fileName = `${featureName}.ts` // TypeScript
    const filePath = path.join(workspaceRoot, 'cypress', 'pages', fileName)

    // Create backup if file exists
    if (await this.fileExists(filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(
        workspaceRoot,
        'cypress',
        'pages',
        `${featureName}.backup.${timestamp}.ts`
      )
      await fs.copyFile(filePath, backupPath)
    }

    await fs.writeFile(filePath, classCode, 'utf8')
    return filePath
  }

  /**
   * Create test file
   * Creates backup if file already exists
   * @param workspaceRoot Workspace root path
   * @param testCode Test suite code
   * @param featureName Feature name (for file naming)
   * @returns Path to created file
   */
  async createTestFile(
    workspaceRoot: string,
    testCode: string,
    featureName: string
  ): Promise<string> {
    const fileName = `${featureName}.cy.ts` // TypeScript
    const filePath = path.join(workspaceRoot, 'cypress', 'e2e', 'real-scenarios', fileName)

    // Create backup if file exists
    if (await this.fileExists(filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupPath = path.join(
        workspaceRoot,
        'cypress',
        'e2e',
        'real-scenarios',
        `${featureName}.backup.${timestamp}.cy.ts`
      )
      await fs.copyFile(filePath, backupPath)
    }

    await fs.writeFile(filePath, testCode, 'utf8')
    return filePath
  }

  /**
   * Sanitize file name
   * @param name Raw name
   * @returns Safe file name
   */
  sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  }

  /**
   * Create barrel export index file for Page Objects
   * Auto-generates exports for all page files
   * @param workspaceRoot Workspace root path
   * @returns Path to created index file
   */
  async createIndexFile(workspaceRoot: string): Promise<string> {
    const indexPath = path.join(workspaceRoot, 'cypress', 'pages', 'index.ts')

    // Get all page object files
    const pagesDir = path.join(workspaceRoot, 'cypress', 'pages')
    const files = await fs.readdir(pagesDir)
    const pageFiles = files.filter((file) => file.endsWith('.ts') && file !== 'index.ts')

    const imports = pageFiles
      .map((file) => {
        const className = file.replace('.ts', '')
        return `export { ${className} } from './${file.replace('.ts', '')}'`
      })
      .join('\n')

    const indexContent = `// Auto-generated index file for page objects
${imports}
`

    await fs.writeFile(indexPath, indexContent, 'utf8')
    return indexPath
  }
}
