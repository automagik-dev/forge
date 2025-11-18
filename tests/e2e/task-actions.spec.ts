import { test, expect } from '@playwright/test';
import { setupTasksView } from './helpers';

/**
 * Task Actions E2E Test - TEMPLATE
 *
 * This test demonstrates the LLM-friendly testing pattern:
 * 1. Use accessibility selectors (getByRole, getByText, getByLabel)
 * 2. Real browser interactions (no synthetic events)
 * 3. Auto-wait for elements (no manual timeouts)
 * 4. Clear test structure (Given/When/Then)
 * 5. Page Object pattern for reusability
 */

test.describe('Task Actions', () => {
  test.beforeEach(async ({ page }) => {
    // Setup using helper
    await setupTasksView(page);

    // Wait for tasks to load
    await expect(page.getByTestId('task-card').first()).toBeVisible({ timeout: 20000 });
  });

  test('shows quick actions on hover', async ({ page }) => {
    // GIVEN: A task card exists
    const taskCard = page.getByTestId('task-card').last();
    await expect(taskCard).toBeVisible();

    // WHEN: I hover over the task card
    await taskCard.hover();

    // THEN: Quick action buttons appear
    await expect(page.getByTestId('task-action-quick-play')).toBeVisible();
    await expect(page.getByTestId('task-action-quick-archive')).toBeVisible();
  });

  test('opens actions dropdown menu', async ({ page }) => {
    // GIVEN: A task card exists
    const taskCard = page.getByTestId('task-card').last();

    // WHEN: I click the actions menu trigger
    await taskCard.getByTestId('task-actions-menu-trigger').click();

    // THEN: The dropdown menu opens with expected items
    const menu = page.getByTestId('task-actions-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Edit')).toBeVisible();
    await expect(menu.getByText('Duplicate')).toBeVisible();
    await expect(menu.getByText('Delete')).toBeVisible();
  });

  test('opens delete confirmation modal', async ({ page }) => {
    // GIVEN: A task card with actions menu open
    const taskCard = page.getByTestId('task-card').last();
    await taskCard.getByTestId('task-actions-menu-trigger').click();

    // WHEN: I click Delete
    await page.getByText('Delete').click();

    // THEN: Delete confirmation modal appears
    const modal = page.getByTestId('delete-confirmation-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/are you sure/i)).toBeVisible();
    await expect(modal.getByRole('button', { name: /delete/i })).toBeVisible();
  });
});
