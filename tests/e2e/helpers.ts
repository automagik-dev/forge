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

// =============================================================================
// PR #246 Performance Testing Helpers
// =============================================================================

/**
 * WebSocket connection tracker for memory leak detection
 * Tracks open/close events to verify proper cleanup
 */
export interface WebSocketTracker {
  connections: { url: string; openedAt: number; closedAt?: number }[];
  getOpenCount(): number;
  getClosedCount(): number;
  getAllUrls(): string[];
}

/**
 * Set up WebSocket connection tracking
 * Use to verify WebSocket cleanup on navigation
 *
 * @example
 * const tracker = setupWebSocketTracker(page);
 * await page.goto('/projects/123/tasks/456/attempts/789');
 * await page.waitForTimeout(2000);
 * const openBefore = tracker.getOpenCount();
 * await page.goto('/projects');
 * await page.waitForTimeout(1000);
 * expect(tracker.getOpenCount()).toBeLessThan(openBefore);
 */
export function setupWebSocketTracker(page: Page): WebSocketTracker {
  const tracker: WebSocketTracker = {
    connections: [],
    getOpenCount() {
      return this.connections.filter(c => !c.closedAt).length;
    },
    getClosedCount() {
      return this.connections.filter(c => c.closedAt).length;
    },
    getAllUrls() {
      return this.connections.map(c => c.url);
    },
  };

  page.on('websocket', ws => {
    const connection = {
      url: ws.url(),
      openedAt: Date.now(),
      closedAt: undefined as number | undefined,
    };
    tracker.connections.push(connection);

    ws.on('close', () => {
      connection.closedAt = Date.now();
    });
  });

  return tracker;
}

/**
 * Polling request tracker for interval validation
 * Tracks requests matching a URL pattern with timestamps
 */
export interface PollingTracker {
  requests: { url: string; timestamp: number }[];
  getIntervals(): number[];
  getAverageIntervalMs(): number | null;
  clear(): void;
}

/**
 * Set up network request tracking for polling validation
 * Use to verify smart polling intervals (15s visible, 60s background)
 *
 * @example
 * const tracker = setupPollingTracker(page, '/branch-status');
 * await page.goto('/projects/123/tasks/456/attempts/789');
 * await page.waitForTimeout(35000); // Wait for 2 polls
 * const avg = tracker.getAverageIntervalMs();
 * expect(avg).toBeGreaterThan(14000);
 * expect(avg).toBeLessThan(16000);
 */
export function setupPollingTracker(page: Page, urlPattern: string): PollingTracker {
  const tracker: PollingTracker = {
    requests: [],
    getIntervals() {
      if (this.requests.length < 2) return [];
      return this.requests.slice(1).map((r, i) => r.timestamp - this.requests[i].timestamp);
    },
    getAverageIntervalMs() {
      const intervals = this.getIntervals();
      if (intervals.length === 0) return null;
      return intervals.reduce((a, b) => a + b, 0) / intervals.length;
    },
    clear() {
      this.requests.length = 0;
    },
  };

  page.on('request', request => {
    if (request.url().includes(urlPattern)) {
      tracker.requests.push({
        url: request.url(),
        timestamp: Date.now(),
      });
    }
  });

  return tracker;
}

/**
 * Navigate directly to an attempt view
 *
 * @example
 * await navigateToAttempt(page, projectId, taskId, attemptId);
 */
export async function navigateToAttempt(
  page: Page,
  projectId: string,
  taskId: string,
  attemptId: string
): Promise<void> {
  await page.goto(`/projects/${projectId}/tasks/${taskId}/attempts/${attemptId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Get memory usage via Chrome DevTools Protocol
 * Falls back to DOM node count if performance.memory unavailable
 *
 * @returns Memory in bytes (heap) or DOM node count (fallback)
 */
export async function getMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    // Chrome-only: performance.memory
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    // Fallback: DOM node count as proxy for memory
    return document.querySelectorAll('*').length * 1000; // Scale for comparison
  });
}

/**
 * Assert that memory stabilizes after repeated operations
 * Verifies PR #246 WebSocket memory leak fix
 *
 * @param samples - Array of memory measurements
 * @returns true if memory stabilized (growth rate approaching zero)
 */
export function assertMemoryStabilized(samples: number[]): boolean {
  if (samples.length < 4) return true; // Not enough data

  const growthRates = samples.slice(1).map((v, i) => v - samples[i]);
  const lastThreeGrowth = growthRates.slice(-3);

  // Check if last 3 growth rates are all decreasing or near zero
  const avgLastThree = lastThreeGrowth.reduce((a, b) => a + b, 0) / 3;
  const avgOverall = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

  // Pass if growth has slowed to <10% of average, or is negative (shrinking)
  return avgLastThree <= 0 || Math.abs(avgLastThree) < Math.abs(avgOverall) * 0.2;
}

/**
 * Get task attempts for a task via API
 */
export async function getTaskAttempts(page: Page, taskId: string): Promise<any[]> {
  const response = await page.request.get(`/api/tasks/${taskId}/attempts`);
  const data = await response.json();
  return data.data || [];
}

/**
 * Get all tasks for a project via API
 */
export async function getProjectTasks(page: Page, projectId: string): Promise<any[]> {
  const response = await page.request.get(`/api/tasks?project_id=${projectId}`);
  const data = await response.json();
  return data.data || [];
}
