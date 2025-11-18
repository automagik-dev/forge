# Cypress Test Automation - Phase 1 Implementation

**Status:** ✅ Foundation Complete
**Date:** 2025-11-16
**GitHub Issue:** [#185](https://github.com/namastexlabs/automagik-forge/issues/185)

---

## Overview

This directory contains the **Phase 1 foundation** for automated Cypress test generation. The core logic has been extracted from [cypress-mcp](https://github.com/jprealini/cypress-mcp) and adapted to TypeScript for the Automagik-Forge project.

### What's Implemented

✅ **Core Generators:**
- `page-object-generator.ts` - Generate TypeScript Page Objects from HTML
- `test-generator.ts` - Generate comprehensive test suites
- `element-detector.ts` - Smart element detection with locator priority
- `workflow-detector.ts` - Detect common patterns (login, search, register)

✅ **Utilities:**
- `puppeteer-scraper.ts` - Web scraping with Puppeteer + Cheerio
- `file-manager.ts` - Cypress project file operations
- `naming-helpers.ts` - Element and feature name sanitization

✅ **Infrastructure:**
- TypeScript with proper types
- ESM modules
- 80% code reuse from cypress-mcp
- Dependencies installed (puppeteer, cheerio, @types/node)

---

## Architecture

### Locator Priority (From cypress-mcp)

The element detector uses this proven priority order:

1. **`data-testid`** (most reliable, recommended)
2. **`id`** attribute
3. **`name`** attribute (for forms)
4. **text content** (buttons, links)
5. **class names** (last resort)
6. **element index** (fallback)

### Generated Page Object Pattern

```typescript
export class DashboardPage {
  // Private elements (locators)
  private elements = {
    button_new_task: () => cy.get('[data-testid="new-task"]'),
    input_search: () => cy.get('input[name="search"]')
  }

  // Public getters
  get buttonNewTask(): Cypress.Chainable {
    return this.elements.button_new_task()
  }

  // Interaction methods
  clickButtonNewTask(): void {
    this.elements.button_new_task().click()
  }

  typeInputSearch(text: string): void {
    this.elements.input_search().type(text)
  }

  // Workflow methods (auto-detected)
  search(query: string): this {
    this.typeInputSearch(query)
    // Trigger search
    return this
  }
}
```

### Generated Test Pattern

```typescript
describe('DashboardPage Tests', () => {
  let page: DashboardPage

  beforeEach(() => {
    cy.visit('http://localhost:3000')
    page = new DashboardPage()
  })

  describe('Element Interactions', () => {
    it('should click button_new_task', () => {
      page.clickButtonNewTask()
    })

    it('should type in input_search', () => {
      page.typeInputSearch('test query')
      page.inputSearch.should('have.value', 'test query')
    })
  })

  describe('Form Submission', () => {
    it('should submit with valid data', () => {
      page.typeInputSearch('query')
      page.clickButtonSearch()
    })

    it('should handle edge cases', () => {
      page.typeInputSearch('a'.repeat(1000))
    })
  })
})
```

---

## Usage

### Basic Usage (Programmatic)

```typescript
import { generateTestsFromUrl } from './.genie/scripts/helpers/cypress/index.js'

// Generate Page Object + Tests from URL
const result = await generateTestsFromUrl('http://localhost:3000')

console.log('Page Object:', result.pageObjectPath)
console.log('Test File:', result.testFilePath)
console.log('Index:', result.indexPath)
```

### Advanced Usage (Manual)

```typescript
import { scrapePage } from './.genie/scripts/helpers/cypress/utils/puppeteer-scraper.js'
import { generatePageObjectClass } from './.genie/scripts/helpers/cypress/core/page-object-generator.js'
import { generateCypressTests } from './.genie/scripts/helpers/cypress/core/test-generator.js'
import { CypressFileManager } from './.genie/scripts/helpers/cypress/utils/file-manager.js'

// 1. Scrape page
const $ = await scrapePage({ url: 'http://localhost:3000' })

// 2. Generate Page Object
const pageObjectMeta = generatePageObjectClass($, 'http://localhost:3000', 'Dashboard')

// 3. Generate tests
const testCode = generateCypressTests($, pageObjectMeta, 'http://localhost:3000')

// 4. Write files
const fileManager = new CypressFileManager()
const workspaceRoot = await fileManager.detectWorkspace()
await fileManager.ensureDirectoryStructure(workspaceRoot)

await fileManager.createPageObject(workspaceRoot, pageObjectMeta)
await fileManager.createTestFile(workspaceRoot, testCode, pageObjectMeta.featureName)
await fileManager.createIndexFile(workspaceRoot)
```

---

## Validation

### Run Validation Script

```bash
# Validate generators with mock HTML
npx tsx .genie/scripts/helpers/cypress/validate.ts
```

**Expected Output:**
```
🔍 Cypress Test Generator Validation

📄 Generating Page Object...
✅ Generated DashboardPage
   Feature: Dashboard
   Elements detected: 5

📝 Detected Elements:
   - input_search (input): cy.get('[data-testid="search-input"]')
   - button_submit (button): cy.get('[data-testid="search-button"]')
   - link_home (link): cy.get('[data-testid="home-link"]')
   ...

🧪 Generating Tests...
✅ Tests generated successfully

✅ Validation complete! All generators working correctly.
```

### Test Against Real Application

1. **Start dev server:**
   ```bash
   pnpm run dev
   ```

2. **Generate tests for dashboard:**
   ```bash
   npx tsx -e "import('./genie/scripts/helpers/cypress/index.js').then(m => m.generateTestsFromUrl('http://localhost:3000', undefined, 'Dashboard'))"
   ```

3. **Run Cypress tests:**
   ```bash
   pnpm run test:e2e:open
   # Select cypress/e2e/real-scenarios/dashboard.cy.ts
   ```

---

## File Structure

```
.genie/scripts/helpers/cypress/
├── core/
│   ├── types.ts                     # TypeScript type definitions
│   ├── element-detector.ts          # Element detection (priority locators)
│   ├── workflow-detector.ts         # Workflow pattern detection
│   ├── page-object-generator.ts     # Page Object class generator
│   └── test-generator.ts            # Test suite generator
├── utils/
│   ├── puppeteer-scraper.ts         # Web scraping utility
│   ├── file-manager.ts              # File operations
│   └── naming-helpers.ts            # Name sanitization
├── index.ts                         # Main entry point
├── validate.ts                      # Validation script
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

---

## Generated Files

When you run the generator, it creates:

```
cypress/
├── pages/
│   ├── dashboard.ts                 # Generated Page Object
│   └── index.ts                     # Auto-generated exports
└── e2e/
    └── real-scenarios/
        └── dashboard.cy.ts          # Generated tests
```

---

## Next Steps (Phase 2-4)

### Phase 2: Automation
- [ ] PR validation script (`automation/pr-validation.ts`)
- [ ] Test synchronizer (`automation/test-synchronizer.ts`)
- [ ] Coverage reporter (`automation/coverage-reporter.ts`)
- [ ] GitHub Action workflow (`.github/workflows/cypress-validation.yml`)

### Phase 3: Forge-Specific
- [ ] Mobile test generator (`forge-specific/mobile-test-generator.ts`)
- [ ] Workflow templates (`forge-specific/workflow-templates.ts`)
- [ ] Accessibility tests
- [ ] Performance tests

### Phase 4: Integration
- [ ] Genie MCP integration (`cypress:generate` command)
- [ ] Documentation (usage guide)
- [ ] Migrate existing tests
- [ ] Enable PR validation

---

## References

### External
- [cypress-mcp repository](https://github.com/jprealini/cypress-mcp) - Source implementation
- [Cypress Documentation](https://docs.cypress.io)
- [Page Object Model Pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)

### Internal
- [Issue #185](https://github.com/namastexlabs/automagik-forge/issues/185) - Cypress Test Automation System
- [Wish README](../../wishes/cypress-test-automation/README.md) - Complete wish specification
- [Research Doc](../../wishes/cypress-test-automation/research/cypress-mcp-extraction.md) - Code extraction analysis

---

**Created by:** Master Genie (orchestrator)
**Implemented:** Phase 1 Foundation
**Status:** ✅ Ready for Phase 2
