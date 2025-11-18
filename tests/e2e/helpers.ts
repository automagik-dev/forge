import { Page } from '@playwright/test';

/**
 * E2E Test Helpers - LLM-Friendly Utilities
 *
 * These helpers make tests easier to read and maintain.
 * They follow the Page Object Model pattern.
 */

/**
 * Skip onboarding flow if present
 */
export async function skipOnboarding(page: Page) {
  const skipButton = page.getByRole('button', { name: /skip|continue|get started/i });
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
  }
}

/**
 * Get the first project from the API
 */
export async function getFirstProject(page: Page): Promise<string> {
  const response = await page.request.get('/api/projects');
  const data = await response.json();
  return data.data[0]?.id;
}

/**
 * Create a test task via API
 */
export async function createTestTask(
  page: Page,
  projectId: string,
  options?: {
    title?: string;
    description?: string;
  }
) {
  return await page.request.post('/api/tasks', {
    data: {
      project_id: projectId,
      title: options?.title || 'Test Task',
      description: options?.description || 'Test task description',
    },
  });
}

/**
 * Navigate to project tasks view
 */
export async function goToProjectTasks(page: Page, projectId: string) {
  await page.goto(`/projects/${projectId}/tasks`);
  await page.waitForLoadState('networkidle');
}

/**
 * Close release notes banner if present
 */
export async function closeReleaseNotes(page: Page) {
  const closeButton = page.getByText(/let's create|close/i);
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
  }
}

/**
 * Standard test setup - navigates to tasks view with a fresh test task
 */
export async function setupTasksView(page: Page) {
  await page.goto('/');
  await skipOnboarding(page);

  const projectId = await getFirstProject(page);
  await createTestTask(page, projectId);
  await goToProjectTasks(page, projectId);
  await closeReleaseNotes(page);

  return projectId;
}
