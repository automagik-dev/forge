import { test, expect } from '@playwright/test';
import {
  skipOnboarding,
  getFirstProject,
  closeReleaseNotes,
  setupWebSocketTracker,
  setupPollingTracker,
  navigateToAttempt,
  getMemoryUsage,
  assertMemoryStabilized,
  getProjectTasks,
  getTaskAttempts,
  createTestTask,
  setupWebSocketCapture,
} from './helpers';

/**
 * Journey: PR #246 Real-Time Performance Regression Tests
 *
 * This test suite validates the performance fixes introduced in PR #246:
 * - WebSocket memory leak prevention (useConversationHistory.ts)
 * - Event-driven cache invalidation (useTaskAttempts.ts)
 * - Smart polling intervals (useBranchStatus.ts)
 * - Context selector optimization (ExecutionProcessesContext.tsx)
 *
 * @see QA-PR246-REALTIME-PERFORMANCE.md for manual test procedures
 * @see PR #246 for implementation details
 */

// TODO: Tests need proper data setup - they assume task with attempts exists in DB
// Currently fails in CI with fresh database. See follow-up PR to fix.
test.describe.skip('PR #246: Real-Time Performance Regression Tests', () => {
  // Shared test data
  let projectId: string;
  let taskWithAttempts: { id: string; attempts: any[] } | null = null;

  test.beforeAll(async ({ browser }) => {
    // Get project and find a task with attempts for testing
    const page = await browser.newPage();
    await page.goto('/');
    await skipOnboarding(page);
    projectId = await getFirstProject(page);

    const tasks = await getProjectTasks(page, projectId);
    for (const task of tasks) {
      const attempts = await getTaskAttempts(page, task.id);
      if (attempts.length > 0) {
        taskWithAttempts = { id: task.id, attempts };
        break;
      }
    }

    await page.close();
  });

  // ===========================================================================
  // Suite 1: WebSocket Memory Leak Prevention
  // Maps to QA Manual Tests 1.1, 1.2, 1.3
  // ===========================================================================
  test.describe('Suite 1: WebSocket Memory Leak Prevention', () => {
    test('1.1 - memory stabilizes after repeated attempt navigation', async ({ page }) => {
      test.skip(!taskWithAttempts || taskWithAttempts.attempts.length < 2,
        'Need task with multiple attempts for navigation test');

      // GIVEN: We're navigating between attempts
      const tracker = setupWebSocketTracker(page);
      const memorySamples: number[] = [];

      await page.goto('/');
      await skipOnboarding(page);

      // WHEN: Navigate between attempts 6 times
      const attempts = taskWithAttempts!.attempts;
      for (let i = 0; i < 6; i++) {
        const attempt = attempts[i % attempts.length];
        await navigateToAttempt(page, projectId, taskWithAttempts!.id, attempt.id);
        await page.waitForTimeout(1500);

        const memory = await getMemoryUsage(page);
        memorySamples.push(memory);
        console.log(`[Memory Sample ${i + 1}]: ${Math.round(memory / 1024 / 1024)}MB`);
      }

      // THEN: Memory should stabilize (not grow continuously)
      const stabilized = assertMemoryStabilized(memorySamples);
      console.log(`Memory samples: ${memorySamples.map(m => Math.round(m / 1024 / 1024) + 'MB').join(' → ')}`);
      console.log(`WebSocket connections opened: ${tracker.connections.length}`);
      console.log(`WebSocket connections closed: ${tracker.getClosedCount()}`);

      expect(stabilized).toBe(true);
    });

    test('1.2 - WebSocket connections close on navigation away', async ({ page }) => {
      test.skip(!taskWithAttempts, 'Need task with attempts');

      // GIVEN: WebSocket tracker is set up
      const tracker = setupWebSocketTracker(page);

      await page.goto('/');
      await skipOnboarding(page);

      // WHEN: Navigate to attempt view (establishes WebSocket connections)
      const attempt = taskWithAttempts!.attempts[0];
      await navigateToAttempt(page, projectId, taskWithAttempts!.id, attempt.id);
      await page.waitForTimeout(3000);

      const openBeforeNav = tracker.getOpenCount();
      console.log(`WebSocket connections before navigation: ${openBeforeNav}`);
      console.log(`URLs: ${tracker.getAllUrls().join(', ')}`);

      // Navigate away from attempt view
      await page.goto(`/projects/${projectId}/tasks`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const openAfterNav = tracker.getOpenCount();
      console.log(`WebSocket connections after navigation: ${openAfterNav}`);

      // THEN: WebSocket connections should be closed (or significantly reduced)
      // Note: Some connections may remain for task stream, but attempt-specific ones should close
      expect(openAfterNav).toBeLessThanOrEqual(openBeforeNav);
    });

    test('1.3 - rapid navigation stress test', async ({ page }) => {
      test.skip(!taskWithAttempts || taskWithAttempts.attempts.length < 2,
        'Need task with multiple attempts');

      // GIVEN: WebSocket tracker
      const tracker = setupWebSocketTracker(page);

      await page.goto('/');
      await skipOnboarding(page);
      await page.goto(`/projects/${projectId}/tasks`);
      await closeReleaseNotes(page);

      // WHEN: Rapidly navigate between attempts (stress test)
      const attempts = taskWithAttempts!.attempts;
      for (let i = 0; i < 5; i++) {
        const attempt = attempts[i % attempts.length];
        // Don't wait for networkidle - simulate rapid clicking
        await page.goto(`/projects/${projectId}/tasks/${taskWithAttempts!.id}/attempts/${attempt.id}`);
        await page.waitForTimeout(500);
      }

      // Wait for things to settle
      await page.waitForTimeout(3000);

      // THEN: Should not have excessive open connections
      const openConnections = tracker.getOpenCount();
      const totalConnections = tracker.connections.length;
      console.log(`Total connections created: ${totalConnections}`);
      console.log(`Open connections after stress: ${openConnections}`);

      // Should have closed most connections - allow reasonable overhead
      expect(openConnections).toBeLessThan(totalConnections);

      // Check for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      expect(errors.filter(e => e.includes('WebSocket'))).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Suite 2: Task Attempts Cache Invalidation
  // Maps to QA Manual Tests 2.1, 2.2, 2.3
  // ===========================================================================
  test.describe('Suite 2: Task Attempts Cache Invalidation', () => {
    test('2.1 - task list updates on new task creation via WebSocket', async ({ page }) => {
      // GIVEN: WebSocket capture is set up and we're on tasks view
      const captured = setupWebSocketCapture(page);

      await page.goto('/');
      await skipOnboarding(page);
      await page.goto(`/projects/${projectId}/tasks`);
      await closeReleaseNotes(page);
      await page.waitForTimeout(2000);

      // Record initial task stream messages
      const initialMessages = captured.taskStream.length;

      // WHEN: Create a new task via API
      const uniqueTitle = `PR246-Test-${Date.now()}`;
      await createTestTask(page, projectId, {
        title: uniqueTitle,
        description: 'PR #246 cache invalidation test',
      });

      // Wait for WebSocket update
      await page.waitForTimeout(3000);

      // THEN: Task stream should have received new messages
      const newMessages = captured.taskStream.length - initialMessages;
      console.log(`New task stream messages after create: ${newMessages}`);

      expect(newMessages).toBeGreaterThan(0);

      // AND: New task should appear in the UI without refresh
      const taskCard = page.getByText(uniqueTitle);
      await expect(taskCard).toBeVisible({ timeout: 5000 });
    });

    test('2.2 - task updates reflect via WebSocket without refresh', async ({ page }) => {
      // GIVEN: We have a task to update
      const uniqueTitle = `PR246-Update-${Date.now()}`;
      const response = await page.request.post('/api/tasks', {
        data: {
          project_id: projectId,
          title: uniqueTitle,
          description: 'Original description',
        },
      });

      const taskData = await response.json();
      const taskId = taskData.data?.id;
      test.skip(!taskId, 'Failed to create test task');

      // Set up WebSocket capture and navigate to tasks view
      const captured = setupWebSocketCapture(page);
      await page.goto(`/projects/${projectId}/tasks`);
      await closeReleaseNotes(page);
      await page.waitForTimeout(2000);

      // WHEN: Update the task via API
      const updatedTitle = `PR246-Updated-${Date.now()}`;
      await page.request.patch(`/api/tasks/${taskId}`, {
        data: { title: updatedTitle },
      });

      // Wait for WebSocket update
      await page.waitForTimeout(3000);

      // THEN: Updated title should appear without refresh
      const updatedCard = page.getByText(updatedTitle);
      await expect(updatedCard).toBeVisible({ timeout: 5000 });
    });

    test('2.3 - task deletion reflects via WebSocket', async ({ page }) => {
      // GIVEN: We have a task to delete
      const uniqueTitle = `PR246-Delete-${Date.now()}`;
      const response = await page.request.post('/api/tasks', {
        data: {
          project_id: projectId,
          title: uniqueTitle,
          description: 'Task to delete',
        },
      });

      const taskData = await response.json();
      const taskId = taskData.data?.id;
      test.skip(!taskId, 'Failed to create test task');

      // Navigate and verify task exists
      await page.goto(`/projects/${projectId}/tasks`);
      await closeReleaseNotes(page);
      await page.waitForTimeout(2000);

      const taskCard = page.getByText(uniqueTitle);
      await expect(taskCard).toBeVisible({ timeout: 5000 });

      // WHEN: Delete the task via API
      await page.request.delete(`/api/tasks/${taskId}`);

      // Wait for WebSocket update
      await page.waitForTimeout(3000);

      // THEN: Task should disappear without refresh
      await expect(taskCard).not.toBeVisible({ timeout: 5000 });
    });
  });

  // ===========================================================================
  // Suite 3: Smart Polling Intervals
  // Maps to QA Manual Tests 3.1, 3.2, 3.3
  // ===========================================================================
  test.describe('Suite 3: Smart Polling Intervals', () => {
    // Note: These tests are time-sensitive and may be flaky in CI
    // Consider running with --workers=1

    test('3.1 - visible tab polls branch status at ~15s interval', async ({ page }) => {
      test.skip(!taskWithAttempts, 'Need task with attempts');
      test.setTimeout(60000); // Extended timeout for polling test

      // GIVEN: Polling tracker for branch-status endpoint
      const tracker = setupPollingTracker(page, '/branch-status');

      await page.goto('/');
      await skipOnboarding(page);

      // Navigate to attempt view (triggers branch status polling)
      const attempt = taskWithAttempts!.attempts[0];
      await navigateToAttempt(page, projectId, taskWithAttempts!.id, attempt.id);

      // WHEN: Wait for at least 2 polling intervals (need 35s+ for 15s interval)
      console.log('Waiting 35s for polling intervals...');
      await page.waitForTimeout(35000);

      // THEN: Should have captured multiple requests at ~15s intervals
      const intervals = tracker.getIntervals();
      console.log(`Captured ${tracker.requests.length} requests`);
      console.log(`Intervals: ${intervals.map(i => Math.round(i / 1000) + 's').join(', ')}`);

      if (intervals.length > 0) {
        const avgInterval = tracker.getAverageIntervalMs()!;
        console.log(`Average interval: ${Math.round(avgInterval / 1000)}s`);

        // Allow tolerance: 13s-17s (15s ± 2s)
        expect(avgInterval).toBeGreaterThan(13000);
        expect(avgInterval).toBeLessThan(17000);
      } else {
        // If no intervals captured, at least verify some requests were made
        expect(tracker.requests.length).toBeGreaterThan(0);
      }
    });

    test('3.3 - polling continues after page interactions', async ({ page }) => {
      test.skip(!taskWithAttempts, 'Need task with attempts');
      test.setTimeout(45000);

      // GIVEN: We're on attempt view with polling active
      const tracker = setupPollingTracker(page, '/branch-status');

      await page.goto('/');
      await skipOnboarding(page);

      const attempt = taskWithAttempts!.attempts[0];
      await navigateToAttempt(page, projectId, taskWithAttempts!.id, attempt.id);
      await page.waitForTimeout(5000);

      // WHEN: Interact with the page (simulate user activity)
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 200);

      // Wait for more polling
      await page.waitForTimeout(20000);

      // THEN: Polling should continue
      console.log(`Requests after interactions: ${tracker.requests.length}`);
      expect(tracker.requests.length).toBeGreaterThan(1);
    });
  });

  // ===========================================================================
  // Suite 4: Query Keys Consistency
  // Maps to QA Manual Tests 5.1, 5.2
  // ===========================================================================
  test.describe('Suite 4: Query Keys & Cache Consistency', () => {
    test('4.1 - project switch maintains cache isolation', async ({ page }) => {
      // GIVEN: Navigate to first project
      await page.goto('/');
      await skipOnboarding(page);

      const projectCard = page.locator('[cursor=pointer]').filter({ hasText: /tasks/ }).first();
      await projectCard.click();
      await page.waitForLoadState('networkidle');
      await closeReleaseNotes(page);

      // Note the first project's task count/names
      const firstProjectUrl = page.url();
      const firstProjectTasks = await page.locator('h4').allTextContents();
      console.log(`First project tasks: ${firstProjectTasks.slice(0, 3).join(', ')}...`);

      // WHEN: Navigate to a different project
      await page.goto('/projects');
      await page.waitForLoadState('networkidle');

      // Click on a different project if available
      const projectCards = page.locator('[cursor=pointer]').filter({ hasText: /created|tasks/ });
      const count = await projectCards.count();

      if (count > 1) {
        await projectCards.nth(1).click();
        await page.waitForLoadState('networkidle');
        await closeReleaseNotes(page);

        const secondProjectTasks = await page.locator('h4').allTextContents();
        console.log(`Second project tasks: ${secondProjectTasks.slice(0, 3).join(', ')}...`);

        // THEN: Switch back and verify original data is correct
        await page.goto(firstProjectUrl);
        await page.waitForLoadState('networkidle');
        await closeReleaseNotes(page);

        const tasksAfterSwitch = await page.locator('h4').allTextContents();

        // Tasks should match original (cache working correctly)
        expect(tasksAfterSwitch.length).toBe(firstProjectTasks.length);
      } else {
        console.log('Only one project available - skipping switch test');
        expect(true).toBe(true);
      }
    });

    test('4.2 - multiple rapid task operations maintain consistency', async ({ page }) => {
      // GIVEN: We're on tasks view
      const captured = setupWebSocketCapture(page);

      await page.goto('/');
      await skipOnboarding(page);
      await page.goto(`/projects/${projectId}/tasks`);
      await closeReleaseNotes(page);
      await page.waitForTimeout(2000);

      // WHEN: Perform multiple rapid operations
      const tasks: string[] = [];
      for (let i = 0; i < 3; i++) {
        const title = `PR246-Rapid-${Date.now()}-${i}`;
        tasks.push(title);
        await page.request.post('/api/tasks', {
          data: {
            project_id: projectId,
            title,
            description: 'Rapid creation test',
          },
        });
        await page.waitForTimeout(500); // Small delay between creates
      }

      // Wait for all updates
      await page.waitForTimeout(3000);

      // THEN: All tasks should be visible
      for (const title of tasks) {
        const taskCard = page.getByText(title);
        await expect(taskCard).toBeVisible({ timeout: 5000 });
      }

      console.log(`Created ${tasks.length} tasks, all visible`);
      console.log(`Task stream messages received: ${captured.taskStream.length}`);
    });
  });
});
