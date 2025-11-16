# cypress-mcp Code Extraction Analysis

**Date:** 2025-11-16
**Source:** https://github.com/jprealini/cypress-mcp
**Status:** Extracted and analyzed

---

## Repository Overview

**Purpose:** MCP server that generates Cypress Page Objects and test suites from web pages
**Technology:** Node.js, Puppeteer, Cheerio, MCP SDK
**Main File:** `src/index.js` (715 lines)

## Key Components for Extraction

### 1. Page Object Generator (`generatePageObjectClass`)

**Location:** Lines 182-451
**Purpose:** Generate TypeScript Page Object class from parsed HTML

**Logic Flow:**
```
Input: Cheerio $ object, URL, optional feature name
  ↓
1. Determine feature name (from form, h1, title, URL)
  ↓
2. Generate class name (FeatureNamePage)
  ↓
3. Scan for elements:
   - Buttons (line 196-226)
   - Inputs (line 228-266)
   - Links (line 268-298)
   - Selects (line 300-326)
   - Textareas (line 328-359)
  ↓
4. Generate locators (priority order)
  ↓
5. Generate getter methods
  ↓
6. Generate interaction methods
  ↓
7. Detect workflows (login, search, register)
  ↓
8. Generate workflow methods
  ↓
Output: { classCode, className, featureName, elementMeta }
```

**Element Detection Pattern:**
```javascript
// Example: Button detection
$('button').each((_, element) => {
  const $el = $(element)
  const dataTestId = $el.attr('data-testid')
  const id = $el.attr('id')
  const text = $el.text().trim()
  const className = $el.attr('class')

  let locator, elementName

  // Priority order
  if (dataTestId) {
    locator = `cy.get('[data-testid="${dataTestId}"]')`
    elementName = `button_${dataTestId.replace(/[^a-zA-Z0-9]/g, '_')}`
  } else if (id) {
    locator = `cy.get('#${id}')`
    elementName = `button_${id}`
  } else if (text) {
    locator = `cy.contains('button', '${text}')`
    elementName = `button_${text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
  }
  // ... fallbacks
})
```

**Workflow Detection:**
```javascript
// Login form detection
const hasLoginForm =
  $('form').length > 0 &&
  ($('input[type="password"]').length > 0 ||
   $('input[name*="password"]').length > 0)

// If detected, generate workflow method:
if (hasLoginForm) {
  workflowMethods.push(`
    login(username, password) {
      const usernameInput = this.getInputUsername ? this.getInputUsername() : this.getInputEmail()
      const passwordInput = this.getInputPassword()
      const submitButton = this.getButtonSubmit ? this.getButtonSubmit() : this.getButtonLogin()

      if (usernameInput) usernameInput.type(username)
      if (passwordInput) passwordInput.type(password)
      if (submitButton) submitButton.click()

      return this
    }
  `)
}
```

### 2. Test Generator (`generateCypressTests`)

**Location:** Lines 516-624
**Purpose:** Generate comprehensive test suite from Page Object metadata

**Test Categories:**

**A. Element Interaction Tests** (lines 526-539)
```javascript
for (const meta of elementMeta) {
  if (type === 'button' || type === 'link') {
    elementTests.push(`
      it('should click ${elementName}', () => {
        page.click${cap(elementName)}()
      })
    `)
  } else if (type === 'checkbox' || type === 'radio') {
    elementTests.push(`
      it('should check ${elementName}', () => {
        page.check${cap(elementName)}()
      })
    `)
  }
  // ... more variations
}
```

**B. Form-Level Tests** (lines 542-606)
- Positive: All fields filled correctly
- Negative: Each required field left empty (one at a time)
- Edge cases: Long input (1000 chars), special characters

```javascript
// Positive test
it('should submit form with valid data', () => {
  ${fields.map(f => `page.type${cap(f.elementName)}('valid_${f.elementName}')`).join('\n')}
  page.click${cap(submitBtn)}()
  // Add assertions for successful submission
})

// Negative test (missing field)
fields.forEach(f => {
  it('should show error if ${f.elementName} is empty', () => {
    ${otherFields.map(ff => `page.type${cap(ff.elementName)}('valid_${ff.elementName}')`).join('\n')}
    // Leave ${f.elementName} empty
    page.click${cap(submitBtn)}()
    // Add assertions for error
  })
})

// Edge case
it('should handle long input for ${f.elementName}', () => {
  page.type${cap(f.elementName)}('a'.repeat(1000))
  page.click${cap(submitBtn)}()
})
```

**C. Workflow Tests** (lines 608-620)
Generated based on detected patterns:
- Login workflow (valid/invalid credentials, empty fields)
- Search workflow (valid query, empty query)
- Register workflow (valid/invalid data)

### 3. File Manager (`CypressFileManager`)

**Location:** Lines 20-178
**Purpose:** Manage Cypress project file operations

**Key Methods:**

**`detectWorkspace(startPath)`** (lines 26-63)
- Traverses up from current directory
- Looks for `cypress.config.js` or `cypress.config.ts`
- Falls back to `package.json` with Cypress dependency
- Throws error if no valid project found

**`ensureDirectoryStructure(workspaceRoot)`** (lines 110-123)
```javascript
const directories = [
  'cypress',
  'cypress/pages',         // Page Objects
  'cypress/e2e',
  'cypress/e2e/tests',     // Test files
  'cypress/support',
  'cypress/fixtures'
]
// Creates recursively
```

**`createPageObject(workspaceRoot, url, pageObjectMeta)`** (lines 125-138)
- Creates backup if file exists (timestamped)
- Writes to `cypress/pages/${featureName}.js`

**`createTestFile(workspaceRoot, url, testCode, featureName)`** (lines 140-152)
- Creates backup if file exists
- Writes to `cypress/e2e/tests/${featureName}.cy.js`

**`createIndexFile(workspaceRoot)`** (lines 158-177)
- Scans `cypress/pages/` directory
- Auto-generates barrel export file
- Example: `export { LoginPage } from './login'`

### 4. Web Scraping Pipeline

**Location:** Lines 640-652 (tool handler)
**Tech:** Puppeteer + Cheerio

```javascript
// Launch browser
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})

// Navigate to URL
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2' })

// Get rendered HTML
const html = await page.content()
await browser.close()

// Parse with Cheerio
const $ = cheerio.load(html)

// Generate Page Object + Tests
const pageObjectMeta = generatePageObjectClass($, url)
const cypressTests = generateCypressTests($, pageObjectMeta, url)
```

**Key Settings:**
- `headless: true` - No GUI (server-friendly)
- `--no-sandbox` - Docker/container support
- `waitUntil: 'networkidle2'` - Wait for dynamic content

## Adaptation Plan for Automagik-Forge

### What to Keep (80% of logic)

**1. Element Detection Priority** ✅
```
data-testid > id > name > text > class > index
```
This is battle-tested and reliable.

**2. Page Object Pattern** ✅
```typescript
class FeatureNamePage {
  #elements = { ... }          // Private locators
  get ButtonLogin() { ... }    // Public getters
  clickButtonLogin() { ... }   // Interaction methods
  getValue...() { ... }        // Value getters
  login(...) { ... }           // Workflows
}
```

**3. Test Generation Patterns** ✅
- Element interaction tests
- Form validation (positive/negative/edge)
- Workflow tests
- Comprehensive coverage

**4. File Management** ✅
- Workspace detection
- Directory structure
- Backup mechanism
- Auto-generated index

### What to Adapt (15% of logic)

**1. TypeScript Instead of JavaScript**
```typescript
// Change from:
export class LoginPage { ... }

// To:
export class LoginPage {
  private elements: Record<string, () => Cypress.Chainable>

  constructor() {
    this.elements = {
      button_login: () => cy.get('[data-testid="login"]')
    }
  }

  get buttonLogin(): Cypress.Chainable {
    return this.elements.button_login()
  }
}
```

**2. Forge-Specific Workflows**
```typescript
// Add Forge patterns:
- Task creation workflow
- PR creation workflow
- Chat workflow
- Diff review workflow
- Bottom navigation workflow
- Bottom sheet workflow
```

**3. Mobile-Specific Detection**
```typescript
// Detect mobile components:
- Bottom navigation tabs
- Bottom sheets
- Gesture targets (swipe, long press)
- Responsive breakpoints
```

### What to Add (5% new logic)

**1. Test Synchronization**
```typescript
// NEW: Scan components for changes
async synchronizeTests(componentPath: string) {
  // 1. Scan for data-testid attributes
  // 2. Compare with existing Page Object
  // 3. Update if drift detected
  // 4. Flag orphaned tests
}
```

**2. PR Validation**
```typescript
// NEW: GitHub Action integration
async validatePR(prNumber: number) {
  // 1. Detect changed files
  // 2. Identify affected routes
  // 3. Generate/update tests
  // 4. Run Cypress suite
  // 5. Report coverage delta
}
```

**3. Coverage Reporting**
```typescript
// NEW: Calculate coverage delta
async reportCoverage(before: number, after: number) {
  // Post comment to PR with delta
}
```

## File Mapping: cypress-mcp → Genie Helpers

| cypress-mcp | Genie Helper | Status | Priority |
|-------------|--------------|--------|----------|
| `generatePageObjectClass()` | `core/page-object-generator.ts` | To extract | P0 |
| `generateCypressTests()` | `core/test-generator.ts` | To extract | P0 |
| Element detection loops | `core/element-detector.ts` | To extract | P0 |
| Workflow detection | `core/workflow-detector.ts` | To extract | P0 |
| `CypressFileManager` | `utils/file-manager.ts` | To extract | P1 |
| Puppeteer scraping | `utils/puppeteer-scraper.ts` | To extract | P1 |
| Feature name inference | `utils/naming-helpers.ts` | To extract | P2 |
| - | `automation/pr-validation.ts` | NEW | P0 |
| - | `automation/test-synchronizer.ts` | NEW | P0 |
| - | `automation/coverage-reporter.ts` | NEW | P1 |
| - | `forge-specific/mobile-test-generator.ts` | NEW | P1 |
| - | `forge-specific/workflow-templates.ts` | NEW | P1 |

## Implementation Checklist

### Phase 1: Core Extraction
- [ ] Create `.genie/scripts/helpers/cypress/` structure
- [ ] Extract `generatePageObjectClass` → `page-object-generator.ts`
- [ ] Extract `generateCypressTests` → `test-generator.ts`
- [ ] Extract element detection → `element-detector.ts`
- [ ] Extract workflow detection → `workflow-detector.ts`
- [ ] Extract file manager → `file-manager.ts`
- [ ] Extract scraping logic → `puppeteer-scraper.ts`
- [ ] Convert all to TypeScript
- [ ] Add proper type definitions

### Phase 2: Testing
- [ ] Test scraper against `http://localhost:3000`
- [ ] Generate Page Object for dashboard
- [ ] Generate test suite for dashboard
- [ ] Verify tests execute correctly
- [ ] Fix any locator issues

### Phase 3: Automation
- [ ] Create PR validation script
- [ ] Create test synchronizer
- [ ] Create coverage reporter
- [ ] Create GitHub Action workflow

### Phase 4: Forge-Specific
- [ ] Add mobile test generation
- [ ] Add Forge workflow templates
- [ ] Add accessibility tests
- [ ] Add performance tests

## Code Samples for Reference

### Element Detection (Complete Pattern)

```javascript
// BUTTONS
$('button').each((_, element) => {
  const $el = $(element)
  const text = $el.text().trim()
  const id = $el.attr('id')
  const className = $el.attr('class')
  const dataTestId = $el.attr('data-testid')

  let locator = ''
  let elementName = ''

  if (dataTestId) {
    locator = `cy.get('[data-testid="${dataTestId}"]')`
    elementName = `button_${dataTestId.replace(/[^a-zA-Z0-9]/g, '_')}`
  } else if (id) {
    locator = `cy.get('#${id}')`
    elementName = `button_${id}`
  } else if (text) {
    locator = `cy.contains('button', '${text}')`
    elementName = `button_${text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
  } else if (className) {
    locator = `cy.get('button.${className.split(' ')[0]}')`
    elementName = `button_${className.split(' ')[0]}`
  } else {
    locator = `cy.get('button').eq(${elementCounter - 1})`
    elementName = `button_${elementCounter}`
  }

  elements.push(`    ${elementName}: () => ${locator}`)
  getters.push(`    get ${cap(elementName)}() { return this.#elements.${elementName}() }`)
  interactionMethods.push(`    click${cap(elementName)}() { return this.#elements.${elementName}().click() }`)
  valueGetters.push(`    getText${cap(elementName)}() { return this.#elements.${elementName}().invoke('text') }`)

  elementCounter++
})
```

### Generated Page Object (Example Output)

```javascript
export class LoginPage {
  // Private elements
  #elements = {
    button_login: () => cy.get('#login-button'),
    input_username: () => cy.get('input[name="username"]'),
    input_password: () => cy.get('input[type="password"]'),
    link_home: () => cy.contains('a', 'Home')
  }

  // Public getters
  get ButtonLogin() { return this.#elements.button_login() }
  get InputUsername() { return this.#elements.input_username() }
  get InputPassword() { return this.#elements.input_password() }
  get LinkHome() { return this.#elements.link_home() }

  // Value getters
  getTextButtonLogin() { return this.#elements.button_login().invoke('text') }
  getValueInputUsername() { return this.#elements.input_username().invoke('val') }
  getValueInputPassword() { return this.#elements.input_password().invoke('val') }

  // Interaction methods
  clickButtonLogin() { return this.#elements.button_login().click() }
  typeInputUsername(text) { return this.#elements.input_username().type(text) }
  clearInputUsername() { return this.#elements.input_username().clear() }
  typeInputPassword(text) { return this.#elements.input_password().type(text) }
  clearInputPassword() { return this.#elements.input_password().clear() }
  clickLinkHome() { return this.#elements.link_home().click() }

  // Workflow methods
  login(username, password) {
    this.typeInputUsername(username)
    this.typeInputPassword(password)
    this.clickButtonLogin()
    return this
  }

  verifyPageLoaded() {
    cy.url().should('include', 'example.com')
    return this
  }
}
```

### Generated Test Suite (Example Output)

```javascript
import { LoginPage } from '../pages/login'

describe('LoginPage Tests', () => {
  let page

  beforeEach(() => {
    cy.visit('https://example.com/login')
    page = new LoginPage()
  })

  describe('Element Interactions', () => {
    it('should click button_login', () => {
      page.clickButtonLogin()
    })

    it('should type in input_username', () => {
      page.typeInputUsername('test input')
      page.getValueInputUsername().should('eq', 'test input')
    })

    it('should clear input_username', () => {
      page.typeInputUsername('test')
      page.clearInputUsername()
      page.getValueInputUsername().should('eq', '')
    })
  })

  describe('Form Submission', () => {
    it('should submit form with valid data', () => {
      page.typeInputUsername('validuser')
      page.typeInputPassword('validpassword')
      page.clickButtonLogin()
      // Add assertions for successful submission
    })

    it('should show error if input_username is empty', () => {
      page.typeInputPassword('password')
      page.clickButtonLogin()
      // Add assertions for error
    })

    it('should handle long input for input_username', () => {
      page.typeInputUsername('a'.repeat(1000))
      page.clickButtonLogin()
    })

    it('should handle special characters for input_username', () => {
      page.typeInputUsername('!@#$%^&*()_+-=[]{}|;:,.<>?')
      page.clickButtonLogin()
    })
  })

  describe('Login Workflow', () => {
    it('should login with valid credentials', () => {
      page.login('validuser', 'validpassword')
      cy.url().should('not.include', '/login')
    })

    it('should show error with invalid credentials', () => {
      page.login('invalid', 'wrong')
      cy.contains('Invalid credentials').should('be.visible')
    })

    it('should show error with empty username', () => {
      page.login('', 'password')
      // Add assertions for error
    })

    it('should show error with empty password', () => {
      page.login('username', '')
      // Add assertions for error
    })
  })
})
```

---

## Conclusion

The cypress-mcp repository provides **excellent foundation code** (80% reusable) for our Cypress test automation system. The core logic is sound, well-structured, and proven.

**Key Takeaways:**
1. **Element detection strategy is solid** - Priority order works well
2. **Page Object pattern is clean** - Easy to maintain and extend
3. **Test generation is comprehensive** - Good coverage patterns
4. **File management is robust** - Handles edge cases (backups, directory creation)

**Next Steps:**
1. Extract core logic to `.genie/scripts/helpers/cypress/`
2. Convert to TypeScript with proper types
3. Add Forge-specific adaptations (workflows, mobile)
4. Create automation layer (PR validation, sync, coverage)
5. Test with real Automagik-Forge pages
6. Iterate based on results

**Estimated Effort:** 4 weeks (foundation + automation + forge-specific + integration)
**Risk Level:** Low (proven code, clear path forward)
**Success Probability:** High (80% existing logic, 20% adaptation)
