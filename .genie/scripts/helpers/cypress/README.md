# Cypress Test Automation System

Automated Page Object and test generation from real DOM structure, extracted from [cypress-mcp](https://github.com/jprealini/cypress-mcp) and adapted for Automagik-Forge.

## Overview

This system scrapes your application using Puppeteer, detects interactive elements, and generates:
- **TypeScript Page Objects** with proper locators (data-testid priority)
- **Comprehensive test suites** (element interactions, form validation, workflows)
- **Mobile-optimized tests** for Forge's PWA interface

## Features

✅ **Real DOM Scraping** - Uses Puppeteer to capture actual rendered HTML
✅ **Smart Element Detection** - Priority-based locator strategy (data-testid > id > name > text > class > index)
✅ **Workflow Detection** - Automatically detects login, search, task creation, PR creation, chat workflows
✅ **TypeScript Page Objects** - Type-safe, maintainable Page Object pattern
✅ **Comprehensive Tests** - Element interactions, form validation (positive/negative/edge), workflows
✅ **Mobile Support** - Default viewport 393×852 (iPhone 14 Pro), gesture support
✅ **Modal Handling** - Automatically skips onboarding modals
✅ **Backup System** - Creates timestamped backups before overwriting

## Architecture

```
.genie/scripts/helpers/cypress/
├── core/
│   ├── element-detector.ts       # Detects buttons, inputs, links, selects, textareas
│   ├── workflow-detector.ts      # Detects login, search, task creation, etc.
│   ├── page-object-generator.ts  # Generates TypeScript Page Object classes
│   └── test-generator.ts         # Generates comprehensive test suites
├── utils/
│   ├── puppeteer-scraper.ts      # Headless browser scraping
│   └── file-manager.ts           # Workspace detection, file operations
├── automation/ (future)
│   ├── pr-validation.ts          # GitHub Action integration
│   ├── test-synchronizer.ts      # Keep tests in sync with components
│   └── coverage-reporter.ts      # Report coverage delta to PR
├── forge-specific/ (future)
│   ├── mobile-test-generator.ts  # Mobile gestures and responsive tests
│   └── workflow-templates.ts     # Forge-specific workflow templates
├── types.ts                      # TypeScript type definitions
├── generate.ts                   # Main CLI entry point
└── README.md                     # This file
```

## Installation

Dependencies are already installed:
- `puppeteer` - Headless browser automation
- `cheerio` - Fast HTML parsing
- `@types/node` - Node.js type definitions

## Usage

### Basic Usage

Generate Page Object and tests for a single page:

```bash
# Generate for dashboard (http://localhost:3000)
npx tsx .genie/scripts/helpers/cypress/generate.ts

# Generate for tasks view
npx tsx .genie/scripts/helpers/cypress/generate.ts --url http://localhost:3000/tasks

# Generate with custom feature name
npx tsx .genie/scripts/helpers/cypress/generate.ts --url http://localhost:3000/tasks --feature TasksList
```

### What Gets Generated

**Page Object** (`cypress/pages/dashboard.ts`):
```typescript
export class DashboardPage {
  private elements = {
    button_new_task: () => cy.get('[data-testid="fab-new-task"]'),
    button_tasks: () => cy.get('[data-testid="bottom-nav-tasks"]'),
    input_search: () => cy.get('[data-testid="search-input"]')
  }

  get ButtonNewTask(): Cypress.Chainable {
    return this.elements.button_new_task()
  }

  clickButtonNewTask(): Cypress.Chainable {
    return this.elements.button_new_task().click()
  }

  // ... more methods
}
```

**Test Suite** (`cypress/e2e/real-scenarios/dashboard.cy.ts`):
```typescript
import { DashboardPage } from '../pages/dashboard'

describe('Dashboard Tests', () => {
  let page: DashboardPage

  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.skipOnboarding()
    cy.waitForAppReady()
    page = new DashboardPage()
  })

  describe('Element Interactions', () => {
    it('should click button_new_task', () => {
      page.clickButtonNewTask()
      // Add assertions
    })
  })

  describe('Form Validation', () => {
    // Positive/negative/edge case tests
  })

  describe('Workflows', () => {
    // Detected workflow tests
  })
})
```

## Locator Strategy

Priority order (most reliable to least):

1. **`data-testid`** - Most reliable, recommended for all interactive elements
   ```html
   <button data-testid="create-task">Create</button>
   ```
   ```typescript
   locator: cy.get('[data-testid="create-task"]')
   ```

2. **`id`** - Stable, but may change
   ```html
   <button id="submit-btn">Submit</button>
   ```
   ```typescript
   locator: cy.get('#submit-btn')
   ```

3. **`name`** - Good for forms
   ```html
   <input name="username" />
   ```
   ```typescript
   locator: cy.get('input[name="username"]')
   ```

4. **Text content** - For buttons/links with stable text
   ```html
   <button>Sign In</button>
   ```
   ```typescript
   locator: cy.contains('button', 'Sign In')
   ```

5. **Class names** - Last resort (brittle)
   ```html
   <button class="btn-primary">Click</button>
   ```
   ```typescript
   locator: cy.get('button.btn-primary')
   ```

6. **Index** - Fallback when nothing else works
   ```typescript
   locator: cy.get('button').eq(0)
   ```

## Detected Workflows

### Standard Workflows

**Login**
- Criteria: password input + submit button
- Method: `login(username, password)`

**Search**
- Criteria: search input + submit
- Method: `search(query)`

**Registration**
- Criteria: email + passwords + submit
- Method: `register(email, password, confirmPassword)`

### Forge-Specific Workflows

**Task Creation**
- Criteria: title input + description textarea + create button
- Method: `createTask(title, description)`

**PR Creation**
- Criteria: branch selector + create PR button
- Method: `createPR(baseBranch)`

**Chat**
- Criteria: message input + send button
- Method: `sendMessage(message)`

## File Structure

After generation:

```
cypress/
├── pages/
│   ├── dashboard.ts           # Generated Page Object
│   ├── tasks.ts               # Generated Page Object
│   └── index.ts               # Auto-generated barrel export
└── e2e/
    └── real-scenarios/
        ├── dashboard.cy.ts    # Generated tests
        └── tasks.cy.ts        # Generated tests
```

## Configuration

Generated tests use existing Cypress configuration:

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    viewportWidth: 393,
    viewportHeight: 852,
  },
  env: {
    viewports: {
      "iphone-14-pro": { width: 393, height: 852 }
    }
  }
})
```

## Best Practices

### 1. Add `data-testid` to Components

For maximum reliability, add `data-testid` attributes to all interactive elements:

```tsx
// Good ✅
<button data-testid="create-task" onClick={handleCreate}>
  Create Task
</button>

// Less reliable ❌
<button className="btn-primary" onClick={handleCreate}>
  Create Task
</button>
```

### 2. Run Dev Server First

Ensure your app is running before generating tests:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Generate tests
npx tsx .genie/scripts/helpers/cypress/generate.ts
```

### 3. Review Generated Tests

Generated tests are a starting point. Review and add proper assertions:

```typescript
// Generated (basic)
it('should click button_login', () => {
  page.clickButtonLogin()
})

// After review (with assertions)
it('should click button_login', () => {
  page.clickButtonLogin()
  cy.url().should('not.include', '/login')
  cy.get('[data-testid="dashboard"]').should('be.visible')
})
```

### 4. Handle Modals Consistently

Use `cy.skipOnboarding()` in `beforeEach`:

```typescript
beforeEach(() => {
  cy.visit('/')
  cy.skipOnboarding()  // Handles all modals
  cy.waitForAppReady() // Waits for overlays to clear
  page = new DashboardPage()
})
```

## Troubleshooting

### Issue: Puppeteer timeout

**Solution:** Increase timeout or check if dev server is running

```typescript
scrapePage({
  url: 'http://localhost:3000',
  timeout: 60000  // Increase to 60 seconds
})
```

### Issue: Elements not detected

**Possible causes:**
1. Page not fully loaded - Increase wait time
2. Dynamic content - Elements rendered after initial load
3. Modal blocking content - Check `skipOnboarding()` implementation

**Solution:** Take screenshot for debugging

```typescript
import { takeScreenshot } from './utils/puppeteer-scraper'

await takeScreenshot(
  'http://localhost:3000',
  './debug-screenshot.png'
)
```

### Issue: Tests fail with "element not found"

**Possible causes:**
1. Locator changed (class name, text content)
2. Element rendered conditionally
3. Modal still blocking

**Solution:**
1. Add `data-testid` to component
2. Regenerate Page Object
3. Check modal handling in test

### Issue: Backup files accumulating

**Solution:** Clean up old backups

```typescript
import { cleanupBackups } from './utils/file-manager'

// Remove backups older than 7 days
cleanupBackups(7)
```

## Development

### Adding New Workflow Detection

Edit `.genie/scripts/helpers/cypress/core/workflow-detector.ts`:

```typescript
export function detectCustomWorkflow(elements: ElementMeta[]): WorkflowMeta | null {
  // Find required elements
  const element1 = elements.find(el => /* criteria */)
  const element2 = elements.find(el => /* criteria */)

  if (element1 && element2) {
    return {
      type: 'custom-workflow',
      elements: [element1, element2],
      methodName: 'customWorkflow',
      parameters: ['param1', 'param2'],
    }
  }

  return null
}

// Add to detectAllWorkflows()
export function detectAllWorkflows(elements: ElementMeta[]): WorkflowMeta[] {
  const workflows: WorkflowMeta[] = []

  // ... existing workflows

  const custom = detectCustomWorkflow(elements)
  if (custom) workflows.push(custom)

  return workflows
}
```

### Adding Mobile-Specific Detection

Future: `.genie/scripts/helpers/cypress/forge-specific/mobile-test-generator.ts`

```typescript
// Detect bottom navigation
export function detectBottomNav(elements: ElementMeta[]): WorkflowMeta | null {
  const navButtons = elements.filter(el =>
    el.attributes.dataTestId?.includes('bottom-nav')
  )

  if (navButtons.length > 0) {
    return {
      type: 'mobile-navigation',
      elements: navButtons,
      methodName: 'navigateToTab',
      parameters: ['tabName'],
    }
  }

  return null
}
```

## Next Steps

### Phase 2: PR Validation (planned)

Create `.genie/scripts/helpers/cypress/automation/pr-validation.ts`:
- Detect changed files in PR
- Identify affected routes
- Auto-generate/update tests
- Run Cypress suite
- Report coverage delta to PR

### Phase 3: Test Synchronization (planned)

Create `.genie/scripts/helpers/cypress/automation/test-synchronizer.ts`:
- Scan components for `data-testid` changes
- Detect removed components
- Update Page Objects automatically
- Flag orphaned tests

### Phase 4: Mobile & Accessibility (planned)

Create `.genie/scripts/helpers/cypress/forge-specific/`:
- Mobile gesture tests (swipe, long press, pinch)
- Responsive breakpoint tests
- Accessibility tests (ARIA, keyboard nav)
- Performance tests (load time, interaction latency)

## Code Statistics

**Total:** 2,447 lines of TypeScript

- `types.ts`: 86 lines
- `element-detector.ts`: 383 lines
- `workflow-detector.ts`: 278 lines
- `page-object-generator.ts`: 229 lines
- `test-generator.ts`: 338 lines
- `puppeteer-scraper.ts`: 185 lines
- `file-manager.ts`: 337 lines
- `generate.ts`: 154 lines

## References

### External
- [cypress-mcp](https://github.com/jprealini/cypress-mcp) - Original inspiration (80% code reuse)
- [Cypress Documentation](https://docs.cypress.io)
- [Page Object Model Pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)
- [Puppeteer Documentation](https://pptr.dev)

### Internal
- [Issue #185](https://github.com/namastexlabs/automagik-forge/issues/185) - Cypress Test Automation System
- [Issue #139](https://github.com/namastexlabs/automagik-forge/issues/139) - Modal Overlay Issues
- `.genie/wishes/cypress-test-automation/` - Full wish documentation
- `cypress.config.ts` - Cypress configuration
- `cypress/support/e2e.ts` - Custom commands (skipOnboarding, waitForAppReady)

---

**Created:** 2025-11-16
**Status:** Phase 1 Complete ✅
**Next:** Test with dashboard, iterate based on results
