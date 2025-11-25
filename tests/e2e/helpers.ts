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

/**
 * WebSocket Event Types for Real-Time Streams
 *
 * The Forge system uses 6 types of real-time WebSocket events:
 * 1. Task Stream: `/api/tasks/stream/ws?project_id={id}`
 * 2. Execution Processes: `/api/execution-processes/stream/ws`
 * 3. Diff Stream: `/api/task-attempts/{id}/diff/ws`
 * 4. Raw Logs: `/api/execution-processes/{id}/raw-logs/ws`
 * 5. Normalized Logs: `/api/execution-processes/{id}/normalized-logs/ws`
 * 6. Drafts Stream: `/api/drafts/stream/ws?project_id={id}`
 */
export interface CapturedWebSocketEvents {
  taskStream: any[];
  executionProcesses: any[];
  diffStream: any[];
  rawLogs: any[];
  normalizedLogs: any[];
  drafts: any[];
  unclassified: { url: string; msg: any }[];
}

/**
 * Set up WebSocket capture for all real-time event types
 * MUST be called BEFORE navigating to pages that establish WebSocket connections
 *
 * @example
 * const captured = setupWebSocketCapture(page);
 * await page.goto('/projects/123/tasks');
 * await page.waitForTimeout(2000);
 * expect(captured.taskStream.length).toBeGreaterThan(0);
 */
export function setupWebSocketCapture(page: Page): CapturedWebSocketEvents {
  const captured: CapturedWebSocketEvents = {
    taskStream: [],
    executionProcesses: [],
    diffStream: [],
    rawLogs: [],
    normalizedLogs: [],
    drafts: [],
    unclassified: [],
  };

  page.on('websocket', ws => {
    const url = ws.url();

    ws.on('framereceived', event => {
      try {
        const msg = JSON.parse(event.payload as string);

        // Classify message by WebSocket endpoint
        if (url.includes('/tasks/stream/ws')) {
          captured.taskStream.push(msg);
        } else if (url.includes('/execution-processes/stream/ws')) {
          captured.executionProcesses.push(msg);
        } else if (url.includes('/diff/ws')) {
          captured.diffStream.push(msg);
        } else if (url.includes('/raw-logs/ws')) {
          captured.rawLogs.push(msg);
        } else if (url.includes('/normalized-logs/ws')) {
          captured.normalizedLogs.push(msg);
        } else if (url.includes('/drafts/stream/ws')) {
          captured.drafts.push(msg);
        } else {
          captured.unclassified.push({ url, msg });
        }
      } catch {
        // Ignore non-JSON messages (e.g., ping/pong)
      }
    });
  });

  return captured;
}

/**
 * Check if WebSocket messages contain a JSON Patch operation
 * Handles both formats:
 * - Direct array: [{ op, path, value }]
 * - Wrapped: { JsonPatch: [{ op, path, value }] }
 *
 * @param messages - Array of WebSocket messages
 * @param op - JSON Patch operation type (add, remove, replace, move, copy, test)
 * @param pathPattern - Optional path pattern to match (e.g., '/tasks')
 *
 * @example
 * const hasSnapshot = hasJsonPatchOp(captured.taskStream, 'replace', '/tasks');
 * expect(hasSnapshot).toBe(true);
 */
export function hasJsonPatchOp(messages: any[], op: string, pathPattern?: string): boolean {
  return messages.some(msg => {
    // Handle wrapped format: { JsonPatch: [...] }
    const patches = msg?.JsonPatch || (Array.isArray(msg) ? msg : null);
    if (!patches || !Array.isArray(patches)) return false;

    return patches.some(patch =>
      patch.op === op && (!pathPattern || patch.path.includes(pathPattern))
    );
  });
}

/**
 * Get human-readable summary of captured WebSocket events
 *
 * @example
 * console.log(getWebSocketEventSummary(captured));
 * // Output:
 * // Task Stream: 5 messages
 * // Execution Processes: 0 messages
 * // ...
 */
export function getWebSocketEventSummary(captured: CapturedWebSocketEvents): string {
  return [
    `Task Stream: ${captured.taskStream.length} messages`,
    `Execution Processes: ${captured.executionProcesses.length} messages`,
    `Diff Stream: ${captured.diffStream.length} messages`,
    `Raw Logs: ${captured.rawLogs.length} messages`,
    `Normalized Logs: ${captured.normalizedLogs.length} messages`,
    `Drafts: ${captured.drafts.length} messages`,
    `Unclassified: ${captured.unclassified.length} messages`,
  ].join('\n');
}
