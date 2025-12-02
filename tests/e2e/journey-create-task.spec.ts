import { test, expect } from '@playwright/test';
import { setupTasksView } from './helpers';

/**
 * Journey 1: Returning User - Create and Execute Task
 *
 * This test follows the complete user journey of creating a task and preparing to execute it.
 * Based on real user exploration documented in USER-JOURNEYS.md
 *
 * User Goal: Create a new task and start working on it with an AI agent
 */

test.describe('Journey: Create Task', () => {
  test('complete flow: navigate → create task → view details → prepare execution', async ({ page }) => {
    // GIVEN: User is on the tasks view with a project loaded
    await setupTasksView(page);

    // WHEN: User clicks "Create new task" button
    await page.getByRole('button', { name: 'Create new task' }).click();

    // THEN: Create task modal opens
    const createModal = page.locator('text=Create New Task').locator('..');
    await expect(createModal).toBeVisible();

    // AND: Form fields are present
    const titleInput = page.getByRole('textbox', { name: 'Title' });
    const descriptionInput = page.getByRole('textbox', { name: /Add more details/ });
    await expect(titleInput).toBeVisible();
    await expect(descriptionInput).toBeVisible();

    // AND: Create button is initially disabled (no title yet)
    const createButton = page.getByRole('button', { name: 'Create Task', exact: true });
    await expect(createButton).toBeDisabled();

    // WHEN: User fills in task title
    await titleInput.fill('E2E Test Task - Journey 1');

    // THEN: Create button becomes enabled
    await expect(createButton).toBeEnabled();

    // WHEN: User fills in description
    await descriptionInput.fill('This task tests the complete create task journey');

    // WHEN: User clicks Create Task
    await createButton.click();

    // THEN: Modal closes
    await expect(createModal).not.toBeVisible();

    // AND: Task appears in the Wish column
    const newTaskCard = page.getByText('E2E Test Task - Journey 1').first();
    await expect(newTaskCard).toBeVisible();

    // AND: Task details panel opens automatically
    const taskTitle = page.locator('h1:has-text("E2E Test Task - Journey 1")');
    await expect(taskTitle).toBeVisible();

    // AND: Description is shown in details panel (scope to panel to avoid duplicates)
    const taskPanel = page.locator('.p-6.flex.flex-col').filter({ hasText: 'Attempts' });
    await expect(taskPanel.getByText('This task tests the complete create task journey')).toBeVisible();

    // AND: Attempts section shows "No attempts yet"
    await expect(page.getByText('Attempts (0)')).toBeVisible();
    await expect(page.getByText('No attempts yet')).toBeVisible();

    // AND: "Start new attempt" button is present
    const startAttemptButton = page.getByRole('button', { name: 'Start new attempt' });
    await expect(startAttemptButton).toBeVisible();

    // WHEN: User clicks "Start new attempt"
    await startAttemptButton.click();

    // THEN: Create Attempt modal opens
    const attemptModal = page.locator('text=Create Attempt').locator('..');
    await expect(attemptModal).toBeVisible();

    // AND: Modal shows explanation text
    await expect(page.getByText(/A git worktree and task branch will be created/)).toBeVisible();

    // AND: Configuration options are present
    await expect(page.getByText('Provider', { exact: true })).toBeVisible();
    await expect(page.getByText('Agent', { exact: true })).toBeVisible();
    await expect(page.getByText(/Base branch/)).toBeVisible();

    // AND: Default values are set (provider buttons exist - values may vary by environment)
    // Provider button contains an image and text
    const providerSection = page.locator('text=Provider').locator('..');
    await expect(providerSection.getByRole('button')).toBeVisible(); // Provider selector exists

    // Agent button exists
    const agentSection = page.locator('text=Agent').locator('..');
    await expect(agentSection.getByRole('button')).toBeVisible(); // Agent selector exists

    // Branch button exists and shows a branch name
    const branchSection = page.locator('text=Base branch').locator('..');
    await expect(branchSection.getByRole('button')).toBeVisible(); // Branch selector exists

    // AND: Start button is enabled
    const startButton = page.getByRole('button', { name: 'Start', exact: true });
    await expect(startButton).toBeEnabled();

    // NOTE: We don't click "Start" to avoid creating actual git worktrees during testing
    // The journey verification is complete - user can successfully create a task and
    // reach the point of starting an attempt

    // Clean up: Cancel the attempt modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(attemptModal).not.toBeVisible();
  });

  test('create task with minimal input (title only)', async ({ page }) => {
    // GIVEN: User is on the tasks view
    await setupTasksView(page);

    // WHEN: User creates a task with only a title
    await page.getByRole('button', { name: 'Create new task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Minimal Task');
    await page.getByRole('button', { name: 'Create Task', exact: true }).click();

    // THEN: Task is created successfully
    await expect(page.getByText('Minimal Task').first()).toBeVisible();

    // AND: Details panel shows the task
    await expect(page.locator('h1:has-text("Minimal Task")')).toBeVisible();
  });

  test('cancel task creation preserves board state', async ({ page }) => {
    // GIVEN: User is on the tasks view
    await setupTasksView(page);

    // WHEN: User opens create task modal and fills it
    await page.getByRole('button', { name: 'Create new task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('This will be cancelled');

    // AND: User clicks Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // AND: Confirms discard (modal appears because form was filled)
    await page.getByRole('button', { name: 'Discard Changes' }).click();

    // THEN: Both modals are not visible
    await expect(page.getByText('Discard unsaved changes?')).not.toBeVisible();
    await expect(page.getByText('Create New Task')).not.toBeVisible();

    // AND: The cancelled task was not created
    await expect(page.getByText('This will be cancelled')).not.toBeVisible();
  });

  test('discard unsaved changes when attempting to cancel with filled form', async ({ page }) => {
    // GIVEN: User is on the tasks view
    await setupTasksView(page);

    // WHEN: User opens create task modal and fills it
    await page.getByRole('button', { name: 'Create new task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Task with unsaved changes');
    await page.getByRole('textbox', { name: /Add more details/ }).fill('Some description');

    // AND: User clicks Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // THEN: Discard changes confirmation appears
    await expect(page.getByText('Discard unsaved changes?')).toBeVisible();
    await expect(page.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeVisible();

    // WHEN: User confirms discard
    await page.getByRole('button', { name: 'Discard Changes' }).click();

    // THEN: Both modals close and we're back at the kanban board
    await expect(page.getByText('Discard unsaved changes?')).not.toBeVisible();
    await expect(page.getByText('Create New Task')).not.toBeVisible();
  });

  test('continue editing when user decides not to discard changes', async ({ page }) => {
    // GIVEN: User is on the tasks view
    await setupTasksView(page);

    // WHEN: User opens create task modal and fills it
    await page.getByRole('button', { name: 'Create new task' }).click();
    const titleInput = page.getByRole('textbox', { name: 'Title' });
    await titleInput.fill('Task I want to keep');

    // AND: User clicks Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // AND: User clicks "Continue Editing" in the confirmation
    await page.getByRole('button', { name: 'Continue Editing' }).click();

    // THEN: We're back at the create task modal with data preserved
    await expect(page.getByText('Create New Task')).toBeVisible();
    await expect(titleInput).toHaveValue('Task I want to keep');
  });
});
