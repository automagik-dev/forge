import type { ForgeProjectSettings } from 'shared/forge-types';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const forgeApi = {
  // Global forge settings
  getGlobalSettings: async (): Promise<ForgeProjectSettings> => {
    return request<ForgeProjectSettings>('/api/forge/config');
  },

  setGlobalSettings: async (settings: ForgeProjectSettings): Promise<void> => {
    await request<void>('/api/forge/config', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Omni instances
  listOmniInstances: async (): Promise<{ instances: any[] }> => {
    return request('/api/forge/omni/instances');
  },
};
