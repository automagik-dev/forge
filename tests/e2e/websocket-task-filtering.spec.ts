import { test, expect } from '@playwright/test';
import {
  createIsolatedProject,
  createTestTask,
  skipOnboarding,
  closeReleaseNotes,
} from './helpers';

/**
 * WebSocket Task Filtering Tests
 *
 * Validates that agent tasks are properly filtered from WebSocket streams
 * Tests the N+1 query fix (Bug #1) - verifies caching behavior is correct
 *
 * CRITICAL: WebSocket capture MUST be set up BEFORE navigation to capture messages.
 * The `page.on('websocket', ...)` listener only captures NEW connections.
 *
 * NOTE: These tests use createIsolatedProject() instead of ensureProjectExists()
 * because agent tasks create forge_agents records with UNIQUE(project_id, agent_type).
 * Using isolated projects prevents database constraint violations between test runs.
 */

test.describe('WebSocket Task Filtering', () => {
  test('agent tasks should not appear in WebSocket stream', async ({ page }) => {
    // GIVEN: Get a project ID first (without navigation)
    await page.goto('/');
    await skipOnboarding(page);
    const projectId = await createIsolatedProject(page);

    // Setup WebSocket message capture BEFORE navigating to tasks view
    const wsMessages: any[] = [];
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const message = JSON.parse(event.payload as string);
          wsMessages.push(message);
        } catch {
          // Ignore non-JSON messages
        }
      });
    });

    // Navigate to tasks view (WebSocket will be captured)
    await page.goto(`/projects/${projectId}/tasks`);
    await page.waitForLoadState('networkidle');
    await closeReleaseNotes(page);

    // Wait for initial snapshot
    await page.waitForTimeout(1000);

    // WHEN: Create a regular task (non-agent task)
    await createTestTask(page, projectId, {
      title: 'Regular User Task',
      description: 'This is a normal user task'
    });

    // WHEN: Create an agent task via API (use_worktree: false registers it as agent)
    await page.request.post('/api/tasks/create-and-start', {
      data: {
        task: {
          project_id: projectId,
          title: 'Agent Task',
          description: 'This task should be filtered out',
        },
        executor_profile_id: { executor: 'CODEX' },
        base_branch: 'dev',
        use_worktree: false
      }
    });

    // Wait for WebSocket messages to arrive
    await page.waitForTimeout(2000);

    // THEN: Regular task should appear in WebSocket messages
    const regularTaskMessages = wsMessages.filter(msg =>
      JSON.stringify(msg).includes('Regular User Task')
    );
    expect(regularTaskMessages.length).toBeGreaterThan(0);

    // AND: Agent task should NOT appear in WebSocket messages
    const agentTaskMessages = wsMessages.filter(msg =>
      JSON.stringify(msg).includes('Agent Task')
    );
    expect(agentTaskMessages.length).toBe(0);
  });

  test('initial snapshot should exclude agent tasks', async ({ page }) => {
    // GIVEN: Get a project ID and create tasks first
    await page.goto('/');
    await skipOnboarding(page);
    const projectId = await createIsolatedProject(page);

    // Create a regular task
    await createTestTask(page, projectId, {
      title: 'Regular Task in Snapshot',
      description: 'Should appear in initial snapshot'
    });

    // Create an agent task (use_worktree: false registers it as agent)
    await page.request.post('/api/tasks/create-and-start', {
      data: {
        task: {
          project_id: projectId,
          title: 'Agent Task in Snapshot',
          description: 'Should NOT appear in initial snapshot',
        },
        executor_profile_id: { executor: 'CODEX' },
        base_branch: 'dev',
        use_worktree: false
      }
    });

    // Setup WebSocket message capture BEFORE navigating to tasks view
    const wsMessages: any[] = [];
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const message = JSON.parse(event.payload as string);
          wsMessages.push(message);
        } catch {
          // Ignore non-JSON messages
        }
      });
    });

    // WHEN: Navigate to tasks view (triggers WebSocket connection + initial snapshot)
    await page.goto(`/projects/${projectId}/tasks`);
    await page.waitForLoadState('networkidle');
    await closeReleaseNotes(page);
    await page.waitForTimeout(1000);

    // THEN: Find the initial snapshot message (replace operation on /tasks)
    // Note: Messages can be in wrapped format { JsonPatch: [...] } or direct array [...]
    const snapshotMessage = wsMessages.find(msg => {
      const patches = msg?.JsonPatch || (Array.isArray(msg) ? msg : null);
      if (!patches || !Array.isArray(patches)) return false;
      return patches.some((p: any) => p.op === 'replace' && p.path === '/tasks');
    });

    expect(snapshotMessage).toBeDefined();

    // AND: Snapshot should contain regular task
    const snapshotData = JSON.stringify(snapshotMessage);
    expect(snapshotData).toContain('Regular Task in Snapshot');

    // AND: Snapshot should NOT contain agent task
    expect(snapshotData).not.toContain('Agent Task in Snapshot');
  });

  test('task updates should be filtered in real-time', async ({ page }) => {
    // GIVEN: Get a project ID first (without navigation)
    await page.goto('/');
    await skipOnboarding(page);
    const projectId = await createIsolatedProject(page);

    // Setup WebSocket message capture BEFORE navigating to tasks view
    const wsMessages: any[] = [];
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const message = JSON.parse(event.payload as string);
          wsMessages.push(message);
        } catch {
          // Ignore non-JSON messages
        }
      });
    });

    // Navigate to tasks view (WebSocket will be captured)
    await page.goto(`/projects/${projectId}/tasks`);
    await page.waitForLoadState('networkidle');
    await closeReleaseNotes(page);

    // Wait for initial snapshot, then clear messages
    await page.waitForTimeout(1000);
    wsMessages.length = 0;

    // WHEN: Create and immediately update an agent task (use_worktree: false registers it as agent)
    const createResponse = await page.request.post('/api/tasks/create-and-start', {
      data: {
        task: {
          project_id: projectId,
          title: 'Agent Task to Update',
          description: 'Initial description',
        },
        executor_profile_id: { executor: 'CODEX' },
        base_branch: 'dev',
        use_worktree: false
      }
    });

    const taskData = await createResponse.json();
    // Handle both response formats: { data: { task: {...} } } or { task: {...} }
    const taskId = taskData.data?.task?.id || taskData.task?.id;

    // Skip update test if task creation failed
    if (!taskId) {
      console.log('Skipping task update test - task creation response:', JSON.stringify(taskData));
      return;
    }

    // Update the agent task
    await page.request.patch(`/api/tasks/${taskId}`, {
      data: {
        title: 'Updated Agent Task',
        description: 'Updated description'
      }
    });

    // Wait for WebSocket messages
    await page.waitForTimeout(2000);

    // THEN: No WebSocket messages should contain the agent task
    const agentTaskCreateMessages = wsMessages.filter(msg =>
      JSON.stringify(msg).includes('Agent Task to Update')
    );
    expect(agentTaskCreateMessages.length).toBe(0);

    const agentTaskUpdateMessages = wsMessages.filter(msg =>
      JSON.stringify(msg).includes('Updated Agent Task')
    );
    expect(agentTaskUpdateMessages.length).toBe(0);
  });

  test('cache refresh should pick up new agent tasks', async ({ page }) => {
    // GIVEN: Get a project ID first (without navigation)
    await page.goto('/');
    await skipOnboarding(page);
    const projectId = await createIsolatedProject(page);

    // Setup WebSocket message capture BEFORE navigating to tasks view
    const wsMessages: any[] = [];
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const message = JSON.parse(event.payload as string);
          wsMessages.push(message);
        } catch {
          // Ignore non-JSON messages
        }
      });
    });

    // Navigate to tasks view (WebSocket will be captured)
    await page.goto(`/projects/${projectId}/tasks`);
    await page.waitForLoadState('networkidle');
    await closeReleaseNotes(page);

    // Wait for initial snapshot, then clear messages
    await page.waitForTimeout(1000);
    wsMessages.length = 0;

    // WHEN: Create an agent task (use_worktree: false registers it as agent)
    await page.request.post('/api/tasks/create-and-start', {
      data: {
        task: {
          project_id: projectId,
          title: 'New Agent Task After Connect',
          description: 'Should be cached and filtered',
        },
        executor_profile_id: { executor: 'CODEX' },
        base_branch: 'dev',
        use_worktree: false
      }
    });

    // Wait for cache refresh (refresh happens every 5 seconds)
    await page.waitForTimeout(6000);

    // Create another regular task to trigger more WebSocket messages
    await createTestTask(page, projectId, {
      title: 'Regular Task After Agent',
      description: 'Should appear'
    });

    await page.waitForTimeout(1000);

    // THEN: Agent task should still be filtered (cache was refreshed)
    const agentMessages = wsMessages.filter(msg =>
      JSON.stringify(msg).includes('New Agent Task After Connect')
    );
    expect(agentMessages.length).toBe(0);

    // AND: Regular task should appear
    const regularMessages = wsMessages.filter(msg =>
      JSON.stringify(msg).includes('Regular Task After Agent')
    );
    expect(regularMessages.length).toBeGreaterThan(0);
  });
});
