import { Task, TaskAttempt, BaseCodingAgent } from 'shared/types';

/**
 * Neuron type for Master Genie neural network
 */
export interface Neuron {
  type: 'WISH' | 'FORGE' | 'REVIEW';
  task: Task;
  attempt?: TaskAttempt;
}

/**
 * API service for Genie widget backend integration.
 *
 * Connects widgets to the Automagik Forge task/attempt API.
 * Each widget (Wish, Forge, Review) uses executor variants to filter tasks.
 */
export class SubGenieApiService {
  private baseUrl = '/api';

  /**
   * Maps widget IDs to executor variant strings.
   * Used when creating task attempts with specific variants.
   */
  private variantMap = {
    wish: 'WISH',
    forge: 'FORGE',
    review: 'REVIEW',
  } as const;

  /**
   * Creates a task and immediately starts a task attempt with the appropriate variant.
   *
   * This is the primary method for executing workflows from widgets.
   * Tasks are tracked via forge_agents table (not status field).
   *
   * @param genieId - Widget ID (wish, forge, review)
   * @param workflowId - Workflow identifier
   * @param projectId - Project UUID
   * @param description - Task description
   * @param executor - Base executor (defaults to CLAUDE_CODE)
   * @param baseBranch - Git branch to use (defaults to "main")
   * @returns Created task and attempt details
   */
  async executeWorkflow(
    genieId: 'wish' | 'forge' | 'review',
    _workflowId: string,
    projectId: string,
    _description: string,
    executor: BaseCodingAgent = BaseCodingAgent.CLAUDE_CODE,
    baseBranch: string = 'main'
  ): Promise<{ task: Task; attemptId: string }> {
    // Step 1: Create agent entry and its fixed task via forge_agents API
    const agentResponse = await fetch(`${this.baseUrl}/forge/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        agent_type: genieId,
      }),
    });

    if (!agentResponse.ok) {
      throw new Error(`Failed to create agent: ${agentResponse.status}`);
    }

    const { data: agent } = await agentResponse.json();

    // Step 2: Get the task that was created with the agent
    const taskResponse = await fetch(`${this.baseUrl}/tasks/${agent.task_id}`);

    if (!taskResponse.ok) {
      throw new Error(`Failed to fetch task: ${taskResponse.status}`);
    }

    const { data: task } = await taskResponse.json();

    // Step 3: Start task attempt with variant
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
      throw new Error(
        `Failed to start task attempt: ${attemptResponse.status}`
      );
    }

    const { data: attempt } = await attemptResponse.json();

    return {
      task: task,
      attemptId: attempt.id,
    };
  }

  /**
   * Fetches all agent tasks for a specific widget variant.
   *
   * Returns tasks tracked in forge_agents table for this agent type.
   *
   * @param projectId - Project UUID
   * @param genieId - Widget ID (wish, forge, review)
   * @returns Array of agent tasks for this widget
   */
  async getAgentTasks(
    projectId: string,
    genieId: 'wish' | 'forge' | 'review'
  ): Promise<Task[]> {
    // Fetch agents for this project and type from forge_agents table
    const agentsResponse = await fetch(
      `${this.baseUrl}/forge/agents?project_id=${projectId}&agent_type=${genieId}`
    );

    if (!agentsResponse.ok) {
      throw new Error(`Failed to fetch agents: ${agentsResponse.status}`);
    }

    const { data: agents } = await agentsResponse.json();

    // Fetch the task for each agent
    const tasks: Task[] = [];
    for (const agent of agents) {
      const taskResponse = await fetch(
        `${this.baseUrl}/tasks/${agent.task_id}`
      );
      if (taskResponse.ok) {
        const { data: task } = await taskResponse.json();
        tasks.push(task);
      }
    }

    return tasks;
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
    const response = await fetch(
      `${this.baseUrl}/task-attempts/${attemptId}/follow-up`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
        }),
      }
    );

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
    const response = await fetch(
      `${this.baseUrl}/task-attempts/${attemptId}/stop`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );

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
    genieId: 'wish' | 'forge' | 'review',
    message: string
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
    genieId: 'wish' | 'forge' | 'review',
    workflowId: string
  ): Promise<{ status: string; result?: unknown }> {
    console.warn('triggerWorkflow is deprecated. Use executeWorkflow instead.');
    // Reference parameters to avoid unused variable warnings
    void genieId;
    void workflowId;
    return {
      status: 'deprecated',
      result: 'Use executeWorkflow method',
    };
  }

  /**
   * Skill toggling (placeholder - not yet implemented in backend).
   */
  async toggleSkill(
    _genieId: 'wish' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ): Promise<{ skillId: string; enabled: boolean }> {
    console.warn('toggleSkill not yet implemented in backend');
    return { skillId, enabled };
  }

  /**
   * Ensures a Master Genie agent exists for a project, creating it if needed.
   *
   * Master Genie is a special agent that orchestrates other specialists.
   * There should be exactly one Master Genie per project.
   * Uses forge_agents table to track the fixed task per agent type.
   *
   * @param projectId - Project UUID
   * @returns Master Genie task with optional active attempt
   */
  async ensureMasterGenie(
    projectId: string
  ): Promise<{ task: Task; attempt?: TaskAttempt }> {
    // Check if Master Genie agent already exists in forge_agents table
    const agentResponse = await fetch(
      `${this.baseUrl}/forge/agents?project_id=${projectId}&agent_type=master`
    );

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      throw new Error(
        `Failed to fetch agents: ${agentResponse.status} - ${errorText.substring(0, 200)}`
      );
    }

    const contentType = agentResponse.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const responseText = await agentResponse.text();
      throw new Error(
        `Expected JSON response from /forge/agents, got: ${contentType}. Response: ${responseText.substring(0, 200)}`
      );
    }

    const { data: agents } = await agentResponse.json();

    // Get or create the agent entry
    let agent = agents?.[0];
    if (!agent) {
      // Create both agent entry and task
      const createResponse = await fetch(`${this.baseUrl}/forge/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          agent_type: 'master',
        }),
      });

      if (!createResponse.ok) {
        throw new Error(
          `Failed to create Master Genie agent: ${createResponse.status}`
        );
      }

      const { data } = await createResponse.json();
      agent = data;
    }

    // Fetch the task
    const taskResponse = await fetch(`${this.baseUrl}/tasks/${agent.task_id}`);
    if (!taskResponse.ok) {
      throw new Error(
        `Failed to fetch Master Genie task: ${taskResponse.status}`
      );
    }
    const { data: task } = await taskResponse.json();

    // Get latest attempt for this task
    const attemptsResponse = await fetch(
      `${this.baseUrl}/task-attempts?project_id=${projectId}`
    );

    if (!attemptsResponse.ok) {
      throw new Error(
        `Failed to fetch task attempts: ${attemptsResponse.status}`
      );
    }

    const { data: attempts } = await attemptsResponse.json();
    const masterAttempt = attempts
      .filter((a: TaskAttempt) => a.task_id === task.id)
      .sort((a: TaskAttempt, b: TaskAttempt) =>
        b.created_at.localeCompare(a.created_at)
      )[0];

    return {
      task: task,
      attempt: masterAttempt,
    };
  }

  /**
   * Creates a new task attempt for the Master Genie.
   *
   * @param taskId - Master Genie task UUID
   * @param baseBranch - Git branch to use (defaults to current branch)
   * @param executorProfileId - Executor configuration (defaults to user's profile)
   * @returns Created task attempt
   */
  async createMasterGenieAttempt(
    taskId: string,
    baseBranch: string,
    executorProfileId: { executor: BaseCodingAgent; variant?: string | null }
  ): Promise<TaskAttempt> {
    const response = await fetch(`${this.baseUrl}/task-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        executor_profile_id: executorProfileId,
        base_branch: baseBranch,
        use_worktree: false, // Genie runs in current branch without worktrees
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create Master Genie attempt: ${response.status}`
      );
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * Get neurons for a Master Genie task attempt.
   *
   * Fetches Wish, Forge, and Review neurons (tasks with parent_task_attempt = master_attempt_id).
   *
   * @param masterAttemptId - Master Genie attempt UUID
   * @returns Array of neurons with their tasks and attempts
   */
  async getNeurons(masterAttemptId: string): Promise<Neuron[]> {
    const response = await fetch(
      `${this.baseUrl}/forge/master-genie/${masterAttemptId}/neurons`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch neurons: ${response.status}`);
    }

    const { data } = await response.json();
    return data;
  }

  /**
   * Get subtasks for a neuron.
   *
   * Fetches workflow executions spawned by this neuron
   * (tasks with parent_task_attempt = neuron_attempt_id).
   *
   * @param neuronAttemptId - Neuron attempt UUID
   * @returns Array of subtasks
   */
  async getSubtasks(neuronAttemptId: string): Promise<Task[]> {
    const response = await fetch(
      `${this.baseUrl}/forge/neurons/${neuronAttemptId}/subtasks`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch subtasks: ${response.status}`);
    }

    const { data } = await response.json();
    return data;
  }
}

export const subGenieApi = new SubGenieApiService();
