import { ChatMessage } from '@/components/genie-widgets';

// Mock API service (replace with real endpoints later)
export class SubGenieApiService {
  private baseUrl = '/api/genie';

  async sendMessage(
    genieId: 'wishh' | 'forge' | 'review',
    message: string,
    columnStatus: string
  ): Promise<{ response: string; action?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${genieId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, column: columnStatus }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('SubGenie API error:', error);
      // Return mock response for development
      return {
        response: `${genieId} received: "${message}". (Mock response)`,
      };
    }
  }

  async triggerWorkflow(
    genieId: 'wishh' | 'forge' | 'review',
    workflowId: string,
    columnStatus: string,
    context?: Record<string, any>
  ): Promise<{ status: string; result?: any }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${genieId}/workflow/${workflowId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnStatus, context }),
        }
      );

      if (!response.ok) {
        throw new Error(`Workflow error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Workflow API error:', error);
      // Mock response
      return {
        status: 'queued',
        result: `Workflow "${workflowId}" queued. (Mock)`,
      };
    }
  }

  async toggleSkill(
    genieId: 'wishh' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ): Promise<{ skillId: string; enabled: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${genieId}/skill/${skillId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error(`Skill error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Skill API error:', error);
      // Mock response
      return { skillId, enabled };
    }
  }
}

export const subGenieApi = new SubGenieApiService();
