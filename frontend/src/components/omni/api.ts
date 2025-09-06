import { makeRequest, handleApiResponse } from '@/lib/api';
import { OmniInstance } from './types';

// Omni API client
export const omniApi = {
  listInstances: async (): Promise<OmniInstance[]> => {
    const response = await makeRequest('/api/omni/instances');
    return handleApiResponse<OmniInstance[]>(response);
  },

  validateConfig: async (host: string, apiKey: string): Promise<{
    valid: boolean;
    instances: OmniInstance[];
    error?: string;
  }> => {
    const response = await makeRequest('/api/omni/validate', {
      method: 'POST',
      body: JSON.stringify({ host, api_key: apiKey }),
    });
    return handleApiResponse(response);
  },

  testNotification: async (): Promise<string> => {
    const response = await makeRequest('/api/omni/test', {
      method: 'POST',
    });
    return handleApiResponse<string>(response);
  },
};