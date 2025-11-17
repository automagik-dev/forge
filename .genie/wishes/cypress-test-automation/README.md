# Cypress Test Automation System: PR-Driven Test Generation

**Status:** 🎯 Active
**GitHub Issue:** [#185](https://github.com/namastexlabs/automagik-forge/issues/185)
**Created:** 2025-11-16
**Priority:** High
**Domain:** Testing Infrastructure / Quality Automation

---

## Executive Summary

Remake the entire Cypress testing infrastructure from scratch with an automated, PR-driven test generation system. Current tests are fundamentally broken (62.3% skipped) and based on assumptions rather than real application state. This wish establishes a system where every PR to `main` automatically generates/updates Cypress test scenarios based on actual UI implementation.

## Problem Statement

### Current State
- **43 out of 69 tests skipped** (62.3%) due to modal overlay blocking (#139)
- Tests written based on assumptions, not real DOM structure
- Manual test maintenance causes drift from actual implementation
- No automated test creation or validation pipeline
- Tests break when UI changes (brittle locators)

### Root Causes
1. **Manual test creation** - Written without scraping actual application state
2. **Assumption-based locators** - Hard-coded selectors that don't match reality
3. **No synchronization** - Tests drift as components evolve
4. **Modal handling issues** - `skipOnboarding()` doesn't fully work
5. **No PR validation** - Changes merged without test coverage verification

### Impact
- Low confidence in test suite (can't trust skipped tests)
- Manual QA burden increased
- UI regressions ship to production
- Slow development velocity (broken tests block PRs)

## Vision

### Goal
**Every PR to `main` branch should automatically have Cypress tests that:**
1. ✅ Reflect real application state (not assumptions)
2. ✅ Are generated from actual DOM scraping
3. ✅ Cover UI changes introduced in the PR
4. ✅ Pass before merge (block if coverage decreases)
5. ✅ Stay synchronized with component evolution

### Principles
1. **Real State Over Assumptions** - Scrape actual DOM, don't guess
2. **Automation Over Manual** - Generate tests, don't write them
3. **PR-Driven Validation** - Every UI change has test coverage
4. **Synchronization** - Tests update automatically with components
5. **Evidence-Based** - Page Objects generated from actual elements

## Inspiration: cypress-mcp

**Repository:** https://github.com/jprealini/cypress-mcp
**What It Does:** MCP server that generates Cypress Page Objects and test suites from web pages

### Key Components We'll Extract

#### 1. Page Object Generation
```typescript
// Uses Puppeteer + Cheerio to scrape and parse
generatePageObjectClass($, url, featureName) {
  // Detect elements with priority:
  // 1. data-testid (most reliable)
  // 2. id attribute
  // 3. name attribute
  // 4. text content
  // 5. class names
  // 6. element index (fallback)

  // Generate:
  // - Private locators: #elements = {...}
  // - Public getters: get ButtonLogin() {...}
  // - Interaction methods: clickButtonLogin() {...}
  // - Value getters: getTextButtonLogin() {...}
  // - Workflow methods: login(username, password) {...}
}
```

#### 2. Test Generation
```typescript
generateCypressTests($, pageObjectMeta, url) {
  // Generate comprehensive tests:
  // - Element interaction tests (click, type, check)
  // - Form validation (positive/negative)
  // - Workflow tests (login, search, register)
  // - Edge cases (long input, special chars)
  // - Error handling (network errors, validation)
}
```

#### 3. Workflow Detection
```typescript
// Intelligently detects patterns:
- Login forms (username + password + submit)
- Search forms (search input + submit)
- Registration forms (multiple inputs + submit)
- Navigation (home links, menu items)
```

#### 4. File Management
```typescript
CypressFileManager {
  - detectWorkspace()         // Find cypress.config.js
  - ensureDirectoryStructure() // Create pages/, e2e/tests/
  - createPageObject()        // Write Page Object files
  - createTestFile()          // Write test files
  - createIndexFile()         // Auto-generate imports
}
```

## Solution Architecture

### Core Components

```
.genie/
  scripts/
    helpers/
      cypress/
        core/
          page-object-generator.ts    # Puppeteer + Cheerio scraping
          test-generator.ts           # Comprehensive test suite generation
          element-detector.ts         # Smart element detection (data-testid priority)
          workflow-detector.ts        # Forge-specific workflow detection

        automation/
          pr-validation.ts            # GitHub Action integration
          test-synchronizer.ts        # Keep tests in sync with components
          coverage-reporter.ts        # Report coverage delta to PR

        forge-specific/
          mobile-test-generator.ts    # Mobile scenarios (gestures, responsive)
          workflow-templates.ts       # Forge workflows (task creation, PR, chat)

        utils/
          puppeteer-scraper.ts        # Reusable web scraping
          file-manager.ts             # File operations

cypress/
  pages/                             # Generated Page Objects (TypeScript)
  e2e/
    real-scenarios/                  # Auto-generated from PR changes
      dashboard.cy.ts
      tasks-view.cy.ts
      chat-view.cy.ts
```

### Workflow Pipeline

```
PR opened to main
  ↓
GitHub Action triggered
  ↓
.genie/scripts/helpers/cypress/automation/pr-validation.ts
  ↓
1. Detect changed files (React components)
  ↓
2. Identify affected routes/pages
  ↓
3. Start local dev server (http://localhost:3000)
  ↓
4. Scrape affected pages with Puppeteer
  ↓
5. Generate Page Objects (pages/<route>.ts)
  ↓
6. Generate test suites (e2e/real-scenarios/<route>.cy.ts)
  ↓
7. Run Cypress tests (npm run test:e2e)
  ↓
8. Report coverage delta to PR
  ↓
9. Block merge if coverage decreases
```

### Locator Strategy (Extracted from cypress-mcp)

**Priority Order:**
1. `data-testid` (most reliable, recommended)
2. `id` attribute
3. `name` attribute (forms)
4. Text content (buttons, links)
5. Class names (last resort)
6. Element index (fallback)

**Example:**
```typescript
// Button detection
if (dataTestId) {
  locator = `cy.get('[data-testid="${dataTestId}"]')`
  elementName = `button_${dataTestId}`
} else if (id) {
  locator = `cy.get('#${id}')`
  elementName = `button_${id}`
} else if (text) {
  locator = `cy.contains('button', '${text}')`
  elementName = `button_${text.toLowerCase()}`
}
```

### Test Generation Patterns

#### Element Interaction Tests
```typescript
// For each detected element:
it('should click button_login', () => {
  page.clickButtonLogin()
  // Add assertions based on expected behavior
})

it('should type in input_username', () => {
  page.typeInputUsername('test input')
  page.getInputUsername().should('have.value', 'test input')
})
```

#### Form Validation Tests
```typescript
// Positive test
it('should submit form with valid data', () => {
  page.typeInputUsername('validuser')
  page.typeInputPassword('validpassword')
  page.clickButtonSubmit()
  // Add assertions for successful submission
})

// Negative test (missing field)
it('should show error if username is empty', () => {
  page.typeInputPassword('password')
  page.clickButtonSubmit()
  // Add assertions for error
})

// Edge case test
it('should handle long input for username', () => {
  page.typeInputUsername('a'.repeat(1000))
  page.clickButtonSubmit()
  // Add assertions for edge case
})
```

#### Workflow Tests (Forge-Specific)
```typescript
// Task creation workflow
describe('Task Creation Workflow', () => {
  it('should create new task', () => {
    page.clickBottomNavNew()
    page.typeInputTaskTitle('New feature request')
    page.typeInputTaskDescription('Detailed description')
    page.clickButtonCreate()
    // Assertions: task appears in list
  })
})

// PR workflow
describe('PR Creation Workflow', () => {
  it('should create PR from task', () => {
    page.clickTaskCard('task-123')
    page.clickButtonCreatePR()
    page.selectBranchBase('main')
    page.clickButtonSubmitPR()
    // Assertions: PR created successfully
  })
})
```

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Extract core logic and create base generators

**Tasks:**
1. Clone cypress-mcp repository (already done ✅)
2. Create `.genie/scripts/helpers/cypress/` directory structure
3. Extract and adapt `generatePageObjectClass` → `page-object-generator.ts`
4. Extract and adapt `generateCypressTests` → `test-generator.ts`
5. Extract and adapt element detection logic → `element-detector.ts`
6. Extract and adapt workflow detection → `workflow-detector.ts`
7. Create Puppeteer scraper utility → `puppeteer-scraper.ts`
8. Create file manager utility → `file-manager.ts`

**Validation:**
- Run scraper against `http://localhost:3000`
- Generate Page Object for dashboard
- Generate test suite for dashboard
- Verify tests pass

### Phase 2: Automation (Week 2)
**Goal:** Create PR validation pipeline

**Tasks:**
1. Create PR validation script → `pr-validation.ts`
   - Detect changed files in PR
   - Identify affected routes
   - Trigger test generation
2. Create test synchronizer → `test-synchronizer.ts`
   - Scan components for `data-testid`
   - Detect removed components
   - Update Page Objects
3. Create coverage reporter → `coverage-reporter.ts`
   - Calculate coverage delta
   - Post comment to PR
4. Create GitHub Action workflow → `.github/workflows/cypress-validation.yml`
   - Trigger on PR to main
   - Run test generation
   - Execute Cypress tests
   - Report results

**Validation:**
- Create test PR
- Verify action triggers
- Confirm tests generated
- Check coverage reported

### Phase 3: Forge-Specific (Week 3)
**Goal:** Add mobile and workflow-specific test generation

**Tasks:**
1. Create mobile test generator → `mobile-test-generator.ts`
   - Gesture tests (swipe, long press, pinch)
   - Responsive tests (viewport changes)
   - Bottom navigation tests
   - Bottom sheet tests
2. Create workflow templates → `workflow-templates.ts`
   - Task creation workflow
   - PR creation workflow
   - Chat workflow
   - Diff review workflow
3. Add accessibility test generation
   - ARIA label validation
   - Keyboard navigation
   - Screen reader compatibility
4. Add performance test generation
   - Load time assertions
   - Interaction latency

**Validation:**
- Generate mobile tests
- Run on iPhone 14 Pro viewport (393×852)
- Verify gestures work
- Check workflow completeness

### Phase 4: Integration & Migration (Week 4)
**Goal:** Integrate with Genie and migrate old tests

**Tasks:**
1. Create Genie MCP integration
   - Add `cypress:generate` command
   - Add `cypress:validate` command
   - Add `cypress:sync` command
2. Create documentation
   - Usage guide for developers
   - Contribution guide
   - Architecture overview
3. Migrate existing tests
   - Mark phase-1 through phase-4 as deprecated
   - Run scraper against all routes
   - Generate comprehensive test suite
   - Validate new tests cover all scenarios
4. Cleanup
   - Remove old test directories
   - Update CI/CD pipeline
   - Enable PR validation

**Validation:**
- Full test suite passes (0 skipped)
- Coverage ≥ 90%
- PR validation works end-to-end
- Documentation complete

## Success Criteria

### Quantitative
1. **Test Coverage:** ≥ 90% of UI components have Cypress tests
2. **Skip Rate:** 0% skipped tests (down from 62.3%)
3. **Generation Speed:** < 2 minutes to generate tests for PR
4. **Reliability:** 95% test pass rate in CI
5. **Automation:** 100% of PRs to main have automated test validation

### Qualitative
1. **Developer Experience:** "Tests just work" - no manual intervention
2. **Maintainability:** Tests update automatically with component changes
3. **Confidence:** Team trusts test suite results
4. **Speed:** Tests don't slow down development
5. **Coverage:** All UI changes have corresponding tests

### Technical
1. **Architecture:** Clean separation of core/automation/forge-specific
2. **Code Quality:** TypeScript, proper types, tested helpers
3. **Documentation:** Clear usage guide and architecture docs
4. **Integration:** Seamless Genie MCP integration
5. **Performance:** Scraping + generation completes quickly

## Risks & Mitigations

### Risk 1: Puppeteer Scraping Slow
**Impact:** Test generation takes too long
**Probability:** Medium
**Mitigation:**
- Cache scraped pages between runs
- Parallel scraping for multiple routes
- Only scrape changed routes (not full site)

### Risk 2: Generated Tests Too Brittle
**Impact:** Tests break frequently with UI changes
**Probability:** Low (using data-testid priority)
**Mitigation:**
- Prioritize `data-testid` locators (most stable)
- Add fallback locator strategies
- Regenerate tests automatically on component changes

### Risk 3: GitHub Action Timeout
**Impact:** PR validation fails to complete
**Probability:** Low
**Mitigation:**
- Set realistic timeout (10 minutes)
- Fail fast on errors
- Cache dependencies (node_modules, Cypress binary)

### Risk 4: Modal Overlay Issues Persist
**Impact:** Generated tests also get blocked
**Probability:** Low (scraping real state)
**Mitigation:**
- Scrape with modals already handled
- Generate `skipOnboarding()` calls in beforeEach
- Add proper wait conditions

### Risk 5: Developer Resistance
**Impact:** Team doesn't adopt new system
**Probability:** Low
**Mitigation:**
- Clear documentation and examples
- Gradual migration (keep old tests until new proven)
- Show benefits early (faster, more reliable)

## Dependencies

### External
- **Puppeteer:** Web scraping and page rendering
- **Cheerio:** HTML parsing and element selection
- **Cypress:** Test execution framework
- **GitHub Actions:** CI/CD automation

### Internal
- **Genie MCP:** Integration with orchestration
- **Forge:** Backend API for coordination
- **Frontend:** Application to test
- **Git:** Branch management

## Resources Required

### Time
- **Phase 1:** 1 week (foundation)
- **Phase 2:** 1 week (automation)
- **Phase 3:** 1 week (forge-specific)
- **Phase 4:** 1 week (integration)
- **Total:** 4 weeks

### Tools
- cypress-mcp repository (reference implementation)
- Puppeteer + Cheerio (extraction dependencies)
- GitHub Actions (automation platform)
- Genie MCP (orchestration)

### Knowledge
- Cypress best practices
- Page Object pattern
- Puppeteer web scraping
- GitHub Actions workflows
- Genie architecture

## Next Steps

1. **Create Forge task** linked to issue #185
2. **Extract cypress-mcp logic** to `.genie/scripts/helpers/cypress/`
3. **Implement base generator** (scrape → Page Object → tests)
4. **Test with simple page** (dashboard or tasks view)
5. **Create PR validation workflow** (GitHub Action)
6. **Iterate and improve** based on feedback

## References

### External
- [cypress-mcp repository](https://github.com/jprealini/cypress-mcp)
- [Cypress Documentation](https://docs.cypress.io)
- [Page Object Model Pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)
- [Puppeteer Documentation](https://pptr.dev)

### Internal
- [Issue #139](https://github.com/namastexlabs/automagik-forge/issues/139) - Cypress Modal Overlay Issues
- [Issue #185](https://github.com/namastexlabs/automagik-forge/issues/185) - Cypress Test Automation System (this wish)
- `cypress.config.ts` - Current Cypress configuration
- `cypress/e2e/` - Existing test structure (to be replaced)
- `/tmp/genie/cypress-remake-context.md` - Detailed context document

---

## Appendix: cypress-mcp Code Analysis

### Key Files Analyzed

**`/tmp/cypress-mcp/src/index.js`** (715 lines)
- MCP server implementation
- CypressFileManager class (workspace detection, file operations)
- generatePageObjectClass function (lines 182-451)
- generateCypressTests function (lines 516-624)
- Workflow detection logic (lines 363-415)

**Key Insights:**
1. **Element Detection Strategy** (lines 196-359)
   - Priority: data-testid > id > name > text > class > index
   - Type-specific handling (buttons, inputs, links, selects, textareas)
   - Sanitization for safe element names

2. **Workflow Detection** (lines 363-415)
   - Login: password input + submit button
   - Search: search input + submit
   - Registration: multiple inputs + submit
   - Generates reusable workflow methods

3. **Test Generation Patterns** (lines 516-624)
   - Element interaction tests per detected element
   - Form-level tests (positive/negative/edge cases)
   - Workflow tests (login, search, register)
   - Comprehensive coverage

4. **File Management** (lines 20-178)
   - Workspace detection (finds cypress.config.js)
   - Directory structure creation
   - Backup mechanism for existing files
   - Auto-generated index files

### Adaptation Strategy

**What to Keep:**
- Element detection priority (data-testid first)
- Page Object pattern (private locators, public getters, interaction methods)
- Test generation patterns (element/form/workflow)
- File management utilities

**What to Adapt:**
- TypeScript instead of JavaScript
- Forge-specific workflows (task creation, PR, chat)
- Mobile-specific scenarios (gestures, responsive)
- GitHub Actions integration (PR validation)

**What to Add:**
- Test synchronization (detect component changes)
- Coverage reporting (delta to PR)
- Accessibility test generation
- Performance test generation

---

**Created by:** Master Genie (orchestrator)
**Delegated to:** Code collective (via Forge task)
**Branch:** `forge/c0d1-remake-cypress-t`
**Status:** Ready for implementation
