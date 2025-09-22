import { handleApiResponse, makeRequest } from '@/lib/api';

interface BranchTemplateResponse {
  task_id: string;
  branch_template: string | null;
}

interface GenieWish {
  slug: string;
  title: string;
  status?: string | null;
  doc_path: string;
}

interface GenieCommand {
  id: string;
  name: string;
  description: string;
  doc_path: string;
}

const BASE_URL = '/api/forge';

export const forgeApi = {
  async getBranchTemplate(taskId: string) {
    const response = await makeRequest(`${BASE_URL}/branch-templates/${taskId}`);
    const data = await handleApiResponse<BranchTemplateResponse>(response);
    return data.branch_template;
  },

  async upsertBranchTemplate(taskId: string, template: string | null) {
    const response = await makeRequest(`${BASE_URL}/branch-templates/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ branch_template: template }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        message || `Failed to update branch template for task ${taskId}`
      );
    }
  },

  async clearBranchTemplate(taskId: string) {
    const response = await makeRequest(`${BASE_URL}/branch-templates/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        message || `Failed to clear branch template for task ${taskId}`
      );
    }
  },

  async listGenieWishes() {
    const response = await makeRequest(`${BASE_URL}/genie/wishes`);
    const data = await handleApiResponse<{ wishes: GenieWish[] }>(response);
    return data.wishes;
  },

  async listGenieCommands() {
    const response = await makeRequest(`${BASE_URL}/genie/commands`);
    const data = await handleApiResponse<{ commands: GenieCommand[] }>(response);
    return data.commands;
  },
};
