import { ChatMessage } from '@/components/genie-widgets';
import { Task, TaskAttempt, BaseCodingAgent } from '@/shared/types';

/**
 * API service for Genie widget backend integration.
 *
 * Connects widgets to the Automagik Forge task/attempt API.
 * Each widget (Wishh, Forge, Review) uses executor variants to filter tasks.
 */
export class SubGenieApiService {
  private baseUrl = '/api';

  /**
   * Maps widget IDs to executor variant strings.
   * Used when creating task attempts with specific variants.
   */
  private variantMap = {
    wishh: 'wish',
    forge: 'forge',
    review: 'review',
  } as const;

  /**
   * Creates a task and immediately starts a task attempt with the appropriate variant.
   *
   * This is the primary method for executing workflows from widgets.
   * Tasks created with agent variants will have status="agent" automatically.
   *
   * @param genieId - Widget ID (wishh, forge, review)
   * @param workflowId - Workflow identifier
   * @param projectId - Project UUID
   * @param description - Task description
   * @param executor - Base executor (defaults to CLAUDE_CODE)
   * @param baseBranch - Git branch to use (defaults to "main")
   * @returns Created task and attempt details
   */
  async executeWorkflow(
    genieId: 'wishh' | 'forge' | 'review',
    workflowId: string,
    projectId: string,
    description: string,
    executor: BaseCodingAgent = BaseCodingAgent.CLAUDE_CODE,
    baseBranch: string = 'main'
  ): Promise<{ task: Task; attemptId: string }> {
    // Step 1: Create the task
    const taskResponse = await fetch(`${this.baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        title: `${genieId}: ${workflowId}`,
        description: description,
      }),
    });

    if (!taskResponse.ok) {
      throw new Error(`Failed to create task: ${taskResponse.status}`);
    }

    const { data: task } = await taskResponse.json();

    // Step 2: Start task attempt with variant
    const variant = this.variantMap[genieId];
    const attemptResponse = await fetch(`${this.baseUrl}/task-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: task.id,
        executor_profile_id: {
          executor: executor,
          variant: variant,
        },
        base_branch: baseBranch,
      }),
    });

    if (!attemptResponse.ok) {
      throw new Error(`Failed to start task attempt: ${attemptResponse.status}`);
    }

    const { data: attempt } = await attemptResponse.json();

    return {
      task,
      attemptId: attempt.id,
    };
  }

  /**
   * Fetches all agent tasks for a specific widget variant.
   *
   * Returns tasks with status="agent" that match the widget's variant.
   * Filters by parsing TaskAttempt.executor format: "executor_name:variant"
   * (e.g., "claude_code:wish", "gemini:forge").
   *
   * @param projectId - Project UUID
   * @param genieId - Widget ID (wishh, forge, review)
   * @returns Array of agent tasks for this widget
   */
  async getAgentTasks(
    projectId: string,
    genieId: 'wishh' | 'forge' | 'review'
  ): Promise<Task[]> {
    // Fetch all agent tasks
    const tasksResponse = await fetch(
      `${this.baseUrl}/tasks?project_id=${projectId}&status=agent`
    );

    if (!tasksResponse.ok) {
      throw new Error(`Failed to fetch tasks: ${tasksResponse.status}`);
    }

    const { data: tasks } = await tasksResponse.json();

    // Fetch task attempts to filter by variant
    const attemptsResponse = await fetch(
      `${this.baseUrl}/task-attempts?project_id=${projectId}`
    );

    if (!attemptsResponse.ok) {
      throw new Error(`Failed to fetch task attempts: ${attemptsResponse.status}`);
    }

    const { data: attempts } = await attemptsResponse.json();

    // Filter tasks by variant
    const variant = this.variantMap[genieId];
    return tasks.filter((task: Task) => {
      const attempt = attempts.find((a: TaskAttempt) => a.task_id === task.id);
      if (!attempt) return false;

      // Parse executor string (e.g., "claude_code:wish" → "wish")
      const [, attemptVariant] = attempt.executor.split(':');
      return attemptVariant === variant;
    });
  }

  /**
   * Fetches task attempts for a project.
   *
   * @param projectId - Project UUID
   * @returns Array of task attempts
   */
  async getTaskAttempts(projectId: string): Promise<TaskAttempt[]> {
    const response = await fetch(
      `${this.baseUrl}/task-attempts?project_id=${projectId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch task attempts: ${response.status}`);
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * Sends a follow-up message to a running task attempt.
   *
   * @param attemptId - Task attempt UUID
   * @param message - Follow-up message
   * @returns API response
   */
  async sendFollowUp(
    attemptId: string,
    message: string
  ): Promise<{ success: boolean; attempt_id: string }> {
    const response = await fetch(`${this.baseUrl}/task-attempts/${attemptId}/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send follow-up: ${response.status}`);
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * Stops a running task attempt.
   *
   * @param attemptId - Task attempt UUID
   * @returns API response
   */
  async stopTaskAttempt(attemptId: string): Promise<{ stopped: boolean }> {
    const response = await fetch(`${this.baseUrl}/task-attempts/${attemptId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to stop task attempt: ${response.status}`);
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * Legacy method for sending messages (kept for backward compatibility).
   * Consider using executeWorkflow or sendFollowUp instead.
   */
  async sendMessage(
    genieId: 'wishh' | 'forge' | 'review',
    message: string,
    columnStatus: string
  ): Promise<{ response: string; action?: string }> {
    console.warn(
      'sendMessage is deprecated. Use executeWorkflow for new tasks or sendFollowUp for existing attempts.'
    );
    // Mock response for backward compatibility
    return {
      response: `${genieId} received: "${message}". Use executeWorkflow instead.`,
    };
  }

  /**
   * Legacy method for triggering workflows (kept for backward compatibility).
   * Use executeWorkflow instead.
   */
  async triggerWorkflow(
    genieId: 'wishh' | 'forge' | 'review',
    workflowId: string,
    columnStatus: string,
    context?: Record<string, any>
  ): Promise<{ status: string; result?: any }> {
    console.warn('triggerWorkflow is deprecated. Use executeWorkflow instead.');
    return {
      status: 'deprecated',
      result: 'Use executeWorkflow method',
    };
  }

  /**
   * Skill toggling (placeholder - not yet implemented in backend).
   */
  async toggleSkill(
    genieId: 'wishh' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ): Promise<{ skillId: string; enabled: boolean }> {
    console.warn('toggleSkill not yet implemented in backend');
    return { skillId, enabled };
  }
}

export const subGenieApi = new SubGenieApiService();
