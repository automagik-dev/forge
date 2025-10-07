import { OmniInstance } from './types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error_data?: unknown;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch (error) {
    throw new Error(
      `Failed to parse response from ${url}: ${(error as Error).message}`
    );
  }

  if (!response.ok) {
    throw new Error(payload.message || `Request failed with ${response.status}`);
  }

  if (!payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

// Omni API client
export const omniApi = {
  listInstances: async (): Promise<OmniInstance[]> => {
    return request<OmniInstance[]>('/api/omni/instances');
  },

  validateConfig: async (host: string, apiKey: string): Promise<{
    valid: boolean;
    instances: OmniInstance[];
    error?: string;
  }> => {
    // Direct fetch without envelope wrapper since Forge endpoints return data directly
    const response = await fetch('/api/forge/omni/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ host, api_key: apiKey }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return response.json();
  },

  testNotification: async (): Promise<string> => {
    return request<string>('/api/omni/test', {
      method: 'POST',
    });
  },
};
