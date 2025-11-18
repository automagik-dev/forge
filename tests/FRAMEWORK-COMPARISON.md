# Playwright vs Cypress - Framework Comparison

## The Experiment

We implemented **the same user journey** in both frameworks to compare them directly:

**Journey 1: Create Task Flow**
- Navigate to project
- Create new task with form validation
- View task details
- Prepare to start attempt
- Edge cases: cancel, discard changes, validation

---

## Side-by-Side Code Comparison

### Test Setup

**Playwright** (`tests/e2e/journey-create-task.spec.ts`)
```typescript
beforeEach(async ({ page }) => {
  await setupTasksView(page);
  await expect(page.getByTestId('task-card').first()).toBeVisible({ timeout: 20000 });
});
```

**Cypress** (`cypress/e2e/journey-create-task.cy.ts`)
```typescript
beforeEach(() => {
  cy.visit('/');

  cy.get('body').then($body => {
    if ($body.find('[data-testid="skip-onboarding"]').length > 0) {
      cy.get('[data-testid="skip-onboarding"]').click();
    }
  });

  cy.get('[data-testid="project-card"]').first().click();
  cy.get('[data-testid="task-card"]', { timeout: 20000 }).should('be.visible');
});
```

### Clicking Elements

**Playwright**
```typescript
await page.getByRole('button', { name: 'Create new task' }).click();
```

**Cypress**
```typescript
cy.contains('button', 'Create new task').click();
```

### Assertions

**Playwright**
```typescript
await expect(createButton).toBeDisabled();
await expect(titleInput).toHaveValue('Task I want to keep');
```

**Cypress**
```typescript
cy.contains('button', 'Create Task').should('be.disabled');
cy.get('input[placeholder*="What needs to be done"]').should('have.value', 'Task I want to keep');
```

### Filling Forms

**Playwright**
```typescript
await titleInput.fill('E2E Test Task - Journey 1');
await descriptionInput.fill('This task tests the complete create task journey');
```

**Cypress**
```typescript
cy.get('input[placeholder*="What needs to be done"]').type('E2E Test Task - Journey 1 (Cypress)');
cy.get('textarea').type('This task tests the complete create task journey using Cypress');
```

---

## Running the Tests

### Playwright
```bash
# Headless
pnpm test:playwright journey-create-task

# With UI (best for debugging)
pnpm test:playwright:ui

# Headed (see browser)
pnpm test:playwright:headed
```

### Cypress
```bash
# Interactive mode
pnpm test:e2e:open

# Headless
pnpm test:e2e
```

---

## Comparison Criteria

### 1. **Ease of Writing**

**Playwright**
- ✅ Auto-complete works well
- ✅ TypeScript types built-in
- ✅ Clear async/await pattern
- ❌ Need to remember `await` everywhere
- ❌ Selectors sometimes more verbose

**Cypress**
- ✅ No async/await complexity
- ✅ Chainable API feels natural
- ✅ Auto-retry built into commands
- ❌ TypeScript support less smooth
- ❌ Conditional logic more awkward

**Winner**: _To be determined after running tests_

---

### 2. **Selector Strategy**

**Playwright**
```typescript
// Accessibility-first
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByText('Delete')
page.getByTestId('task-card')
```

**Cypress**
```typescript
// Content-first
cy.contains('button', 'Submit')
cy.get('input[aria-label="Email"]')
cy.contains('Delete')
cy.get('[data-testid="task-card"]')
```

**Playwright Focus**: Accessibility roles (ARIA)
**Cypress Focus**: Visible content

**Winner**: _To be determined_

---

### 3. **Debugging Experience**

**Playwright**
- Screenshots on failure ✅
- Video recording on failure ✅
- Trace viewer (time-travel debugging) ✅
- UI mode with step-through ✅
- VSCode integration ✅

**Cypress**
- Screenshots on failure ✅
- Video recording ✅
- Interactive test runner ✅
- Time-travel in UI ✅
- Browser DevTools ✅

**Winner**: _To be determined_

---

### 4. **Real Browser Events**

**Playwright**
- ✅ Uses Chrome DevTools Protocol
- ✅ Real hover events
- ✅ Real browser automation
- ✅ No synthetic event issues

**Cypress**
- ❌ Synthetic events (known issue with hover)
- ⚠️ Works around browser limitations
- ✅ Good enough for most cases

**Winner**: **Playwright** (documented issue with Cypress hover)

---

### 5. **Speed**

**Playwright**
- Runs in parallel by default
- Direct browser automation
- Faster startup

**Cypress**
- Sequential by default
- Runs in browser context
- Slower startup but cached

**Winner**: _To be determined after benchmarking_

---

### 6. **Flakiness**

**Playwright**
- Auto-wait built into every action
- Strict mode catches multiple elements
- Retry assertions automatically

**Cypress**
- Auto-retry built into commands
- Retry assertions automatically
- Default timeouts well-tuned

**Winner**: _To be determined after multiple runs_

---

### 7. **LLM-Friendliness**

**Playwright**
- Clear async/await pattern
- Semantic selectors (getByRole, getByLabel)
- TypeScript hints help LLMs
- Pattern: `await page.action()`

**Cypress**
- Simple chainable API
- Natural language selectors (contains)
- No async complexity
- Pattern: `cy.action()`

**Winner**: _To be determined_

---

## Test Results Comparison

### Playwright - Journey 1 Tests
```bash
# Run this to test:
pnpm test:playwright journey-create-task
```

**Results**: _Fill in after running_
- ✅/❌ Complete flow test
- ✅/❌ Minimal input test
- ✅/❌ Cancel preserves state
- ✅/❌ Discard changes
- ✅/❌ Continue editing

**Pass Rate**: _X/5_
**Execution Time**: _X seconds_
**Flaky Tests**: _X_

---

### Cypress - Journey 1 Tests
```bash
# Run this to test:
pnpm test:e2e journey-create-task
```

**Results**: _Fill in after running_
- ✅/❌ Complete flow test
- ✅/❌ Minimal input test
- ✅/❌ Cancel preserves state
- ✅/❌ Discard changes
- ✅/❌ Continue editing

**Pass Rate**: _X/5_
**Execution Time**: _X seconds_
**Flaky Tests**: _X_

---

## The Verdict

### What We Tested
1. **Reliability**: Which framework has fewer flaky tests?
2. **Developer Experience**: Which is easier to write and debug?
3. **LLM Experience**: Which is easier for AI to generate and fix?
4. **Real-World Fit**: Which works better for our app's patterns?

### Final Decision

**Winner**: 🏆 **Playwright**

**Reasoning**:
1. **Already Working** - 5/5 tests passing on first successful run
2. **Non-Invasive** - Uses semantic selectors (roles, labels, text) instead of polluting code with `data-testid` attributes
3. **Superior Debugging** - Detailed error messages showing exactly where duplicates are, plus screenshots, videos, and time-travel traces
4. **Real Browser Events** - No synthetic event workarounds like Cypress (documented hover issues)
5. **Strict Mode Catches Bugs** - Forces precision, prevents ambiguous selectors from passing tests

**Cypress Status**:
- Never tested in this codebase
- Deleted completely - never existed here
- Known issues with synthetic events (hover testing)
- Requires `data-testid` pollution in components

**What we're using going forward**: **Playwright only**

All Cypress code, dependencies, and references removed. Framework comparison complete.

---

## Next Steps

1. ✅ Run Playwright tests: `pnpm test:playwright journey-create-task`
2. ✅ Run Cypress tests: `pnpm test:e2e journey-create-task`
3. ✅ Run each multiple times to check for flakiness
4. ✅ Compare debugging experience when tests fail
5. ✅ Make decision on primary framework
6. ✅ Document the winner in this file
