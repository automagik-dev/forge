# Playwright Testing Framework - Quick Start

## 🎯 What We Built

A **LLM-friendly** testing framework that actually works for AI-assisted development.

### Why Playwright > Cypress?

| Issue | Cypress | Playwright |
|-------|---------|-----------|
| **Hover events** | ❌ Synthetic (broken) | ✅ Real browser events |
| **Selectors** | ❌ Brittle CSS | ✅ Accessibility-first |
| **Waits** | ❌ Manual timers | ✅ Auto-wait |
| **Debugging** | ❌ Screenshots only | ✅ Videos, traces, screenshots |
| **LLM-friendly** | ❌ Hard to automate | ✅ Designed for LLMs |

## 🚀 Get Started (30 seconds)

### 1. Run the template test

```bash
pnpm test:playwright
```

That's it! Playwright will:
- Start your app automatically
- Run the test
- Generate reports on failure

### 2. Write your first test

Copy the template:

```bash
cp tests/e2e/task-actions.spec.ts tests/e2e/my-feature.spec.ts
```

Edit it:

```typescript
import { test, expect } from '@playwright/test';
import { setupTasksView } from './helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await setupTasksView(page);
  });

  test('does something cool', async ({ page }) => {
    // GIVEN: Some initial state
    const button = page.getByRole('button', { name: 'Cool Button' });

    // WHEN: User clicks
    await button.click();

    // THEN: Something happens
    await expect(page.getByText('Success!')).toBeVisible();
  });
});
```

### 3. Run with UI (best for development)

```bash
pnpm test:playwright:ui
```

This opens a visual interface where you can:
- See the browser
- Step through tests
- Inspect elements
- Time-travel debug

## 📚 The Four Sacred Files

### 1. `tests/e2e/USER-JOURNEYS.md` - THE JOURNEY MAP 🗺️
- Documented user journeys with screenshots
- Testing philosophy: follow complete user flows, not micro-interactions
- What makes a good E2E test
- **START HERE** to understand user flows

### 2. `tests/e2e/README.md` - THE FRAMEWORK BIBLE
- All patterns and best practices
- Selector hierarchy
- Common patterns (modals, forms, navigation)
- Anti-patterns (what NOT to do)
- **READ THIS SECOND**

### 3. `tests/e2e/helpers.ts` - Your Utility Belt
- `setupTasksView()` - Standard test setup
- `skipOnboarding()` - Skip onboarding
- `createTestTask()` - Create test data
- Add more as you find patterns!

### 4. `tests/e2e/journey-create-task.spec.ts` - THE TEMPLATE
- Copy this for new tests
- Shows complete user journey (create task → start attempt)
- Shows Given/When/Then pattern
- Shows helper usage
- Shows all selector types

## 🤖 For LLMs

When asking an LLM to write/fix tests:

### ✅ Good Prompt

```
Write a Playwright test for the complete user journey of deleting a task.

The journey should:
1. Navigate to a project and see tasks
2. Click on an existing task to open details
3. Click delete button
4. Confirm deletion in modal
5. Verify task is removed from kanban board

Use getByRole for buttons, getByTestId for custom components.
Follow the Given/When/Then pattern from journey-create-task.spec.ts.
Use helpers from helpers.ts for setup.
Check USER-JOURNEYS.md for documented flows.
```

### ❌ Bad Prompt

```
Write a test for deleting tasks
```

### 🎯 Journey-Based Prompts

```
Write tests for Journey 1 from USER-JOURNEYS.md - the complete create task flow.
Follow the structure in journey-create-task.spec.ts.
Include edge cases like cancelling and validating required fields.
```

## 🐛 Debugging Failed Tests

When a test fails, Playwright auto-generates:

1. **Screenshot** - `test-results/` folder
2. **Video** - `test-results/` folder
3. **Trace** - `test-results/` folder (on retry)

View the trace (time-travel debugging!):

```bash
npx playwright show-trace test-results/trace.zip
```

## 🎓 Learning Resources

1. **Our docs**: `tests/e2e/README.md` (start here!)
2. **Playwright docs**: https://playwright.dev
3. **Accessibility**: https://playwright.dev/docs/locators#locate-by-role

## 🔥 Pro Tips

### Tip 1: Use the VS Code Extension

Install "Playwright Test for VSCode" to:
- Run tests from editor
- Set breakpoints
- See test results inline

### Tip 2: Generate Selectors

```bash
npx playwright codegen http://localhost:3000
```

Opens a browser where you click elements and it generates the selector code!

### Tip 3: Debug a Specific Test

```bash
pnpm test:playwright:debug task-actions
```

Opens a debugger with step-through controls.

## 📊 The Framework Workflow

```
1. Copy template test
   ↓
2. Use helpers for setup
   ↓
3. Write Given/When/Then
   ↓
4. Use semantic selectors
   ↓
5. Run with --ui for debugging
   ↓
6. Commit when green ✅
```

## 🚨 Common Gotchas

### ❌ DON'T: Manual waits
```typescript
await page.waitForTimeout(5000); // NO!
```

### ✅ DO: Auto-wait with assertions
```typescript
await expect(element).toBeVisible(); // YES!
```

### ❌ DON'T: Brittle CSS
```typescript
page.locator('.some-class-123'); // NO!
```

### ✅ DO: Semantic selectors
```typescript
page.getByRole('button', { name: 'Submit' }); // YES!
```

## 🎯 Migration from Cypress

Have existing Cypress tests? Here's the mapping:

| Cypress | Playwright |
|---------|-----------|
| `cy.get('[data-testid="foo"]')` | `page.getByTestId('foo')` |
| `cy.contains('text')` | `page.getByText('text')` |
| `cy.get('button').click()` | `page.getByRole('button').click()` |
| `cy.wait(1000)` | `await expect(el).toBeVisible()` |
| `cy.hover()` | `await el.hover()` ✅ WORKS! |

## 🤝 Contributing

1. Follow the template pattern
2. Add helpers for common patterns
3. Update `tests/e2e/README.md` with new patterns
4. Keep tests simple and readable
5. Think "Could an LLM understand this?"

---

**Questions?** Check `tests/e2e/README.md` or ask in the repo!

Let's build something fucking awesome! 🚀
