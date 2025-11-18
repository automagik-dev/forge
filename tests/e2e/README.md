# E2E Testing Framework - LLM-Friendly Playwright Pattern

## Philosophy

This framework is designed to be **LLM-friendly** - meaning both humans and AI assistants can easily read, write, and debug tests.

### Core Principles

1. **User Journey Testing** - Tests follow complete user flows from start to finish, not isolated micro-interactions
2. **Real Browser Events** - No synthetic event issues (Playwright uses real CDP)
3. **Accessibility-First Selectors** - Use semantic roles, not brittle CSS selectors
4. **Auto-Wait** - Playwright waits automatically, no manual `cy.wait()`
5. **Clear Structure** - Given/When/Then pattern for readability
6. **Reusable Helpers** - DRY principle with helper functions

### User Journey Focus

**Tests should make sense when you watch them run.** They should follow real user workflows:

✅ **Good**: Test the complete flow of creating a task and starting an attempt
❌ **Bad**: Test that hovering shows a button

See `USER-JOURNEYS.md` for documented user journeys and testing strategy.

## Test Structure Template

```typescript
import { test, expect } from '@playwright/test';
import { setupTasksView } from './helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - use helpers when possible
    await setupTasksView(page);
  });

  test('what the test does', async ({ page }) => {
    // GIVEN: Initial state
    const element = page.getByTestId('some-element');
    await expect(element).toBeVisible();

    // WHEN: User action
    await element.click();

    // THEN: Expected result
    await expect(page.getByText('Expected text')).toBeVisible();
  });
});
```

## Selector Hierarchy (Best to Worst)

1. **`getByRole()`** - Accessibility roles (button, link, textbox)
   ```ts
   page.getByRole('button', { name: 'Submit' })
   ```

2. **`getByLabel()`** - Form labels
   ```ts
   page.getByLabel('Email')
   ```

3. **`getByText()`** - Visible text content
   ```ts
   page.getByText('Delete Task')
   ```

4. **`getByTestId()`** - Test IDs (when above don't work)
   ```ts
   page.getByTestId('task-card')
   ```

5. **CSS Selectors** - Last resort only
   ```ts
   page.locator('.some-class') // Avoid!
   ```

## Common Patterns

### Hovering
```typescript
const card = page.getByTestId('task-card');
await card.hover(); // Real browser hover - no synthetic events!
await expect(card.getByTestId('hover-action')).toBeVisible();
```

### Dropdown Menus
```typescript
await page.getByTestId('menu-trigger').click();
const menu = page.getByTestId('menu');
await expect(menu).toBeVisible();
await menu.getByText('Option 1').click();
```

### Modals
```typescript
await page.getByRole('button', { name: 'Delete' }).click();
const modal = page.getByRole('dialog'); // or getByTestId if needed
await expect(modal).toBeVisible();
await modal.getByRole('button', { name: 'Confirm' }).click();
```

### API Calls (Setup/Cleanup)
```typescript
// Create test data via API (faster than UI)
await page.request.post('/api/tasks', {
  data: { title: 'Test Task' }
});

// Clean up
await page.request.delete('/api/tasks/123');
```

## Running Tests

```bash
# Run all tests
pnpm test:playwright

# Run specific test file
pnpm test:playwright task-actions

# Run in UI mode (visual debugging)
pnpm test:playwright:ui

# Run in headed mode (see the browser)
pnpm test:playwright:headed
```

## Debugging Failed Tests

Playwright auto-generates debugging artifacts:

1. **Screenshots** - `test-results/` folder
2. **Videos** - `test-results/` folder (on failure)
3. **Trace** - `test-results/` folder (on retry)
   - Open with: `npx playwright show-trace trace.zip`

## LLM Prompting Tips

When asking an LLM to write/fix tests:

### Good Prompt
```
Write a Playwright test that verifies the task archive functionality.
Use getByRole for buttons, getByTestId for custom components.
Follow the Given/When/Then pattern.
```

### Bad Prompt
```
Write a test for archiving tasks
```

### Debug Prompt
```
This test is failing: [paste error]
Screenshot shows: [describe what you see]
The test is trying to: [describe expected behavior]
```

## Anti-Patterns (Don't Do This)

❌ **Manual waits**
```typescript
await page.waitForTimeout(5000); // NO!
```

✅ **Auto-wait with assertions**
```typescript
await expect(element).toBeVisible(); // YES!
```

❌ **Brittle CSS selectors**
```typescript
page.locator('.MuiButton-root-123'); // NO!
```

✅ **Semantic selectors**
```typescript
page.getByRole('button', { name: 'Submit' }); // YES!
```

❌ **Synthetic events in code**
```typescript
await page.evaluate(() => element.click()); // NO!
```

✅ **Real browser interactions**
```typescript
await page.click('button'); // YES!
```

## Adding New Tests

1. **Identify the user journey**: See `USER-JOURNEYS.md` for documented journeys
2. **Create test file**: `tests/e2e/journey-name.spec.ts` (follow user journey naming)
3. **Follow the complete flow**: Don't test micro-interactions, test the full journey
4. **Use the template**: See `journey-create-task.spec.ts` as reference
5. **Add test helpers** if needed in `helpers.ts`
6. **Add data-testid** to components if semantic selectors don't work
7. **Run test locally** before committing
8. **Update USER-JOURNEYS.md** if you discover new journeys

## Framework Improvements

This is V1. As we learn, we'll improve:
- Add more helpers for common patterns
- Add visual regression testing
- Add performance testing
- Add accessibility testing (built into Playwright!)

## Questions?

Ask in the repo - this is a living document. Help us make it better! 🚀
