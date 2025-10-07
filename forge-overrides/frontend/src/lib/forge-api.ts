import type { ForgeProjectSettings } from 'shared/forge-types';
import type { ApiResponse } from 'shared/types';

class ApiError<E = unknown> extends Error {
  public status?: number;
  public error_data?: E;

  constructor(
    message: string,
    public statusCode?: number,
    public response?: Response,
    error_data?: E
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = statusCode;
    this.error_data = error_data;
  }
}

const makeRequest = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

const handleApiResponse = async <T, E = T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Fallback to status text if JSON parsing fails
      errorMessage = response.statusText || errorMessage;
    }

    console.error('[Forge API Error]', {
      message: errorMessage,
      status: response.status,
      response,
      endpoint: response.url,
      timestamp: new Date().toISOString(),
    });
    throw new ApiError<E>(errorMessage, response.status, response);
  }

  const result: ApiResponse<T, E> = await response.json();

  if (!result.success) {
    // Check for error_data first (structured errors), then fall back to message
    if (result.error_data) {
      console.error('[Forge API Error with data]', {
        error_data: result.error_data,
        message: result.message,
        endpoint: response.url,
        timestamp: new Date().toISOString(),
      });
      throw new ApiError<E>(
        result.message || 'Forge API request failed',
        response.status,
        response,
        result.error_data
      );
    }

    console.error('[Forge API Error]', {
      message: result.message,
      endpoint: response.url,
      timestamp: new Date().toISOString(),
    });
    throw new ApiError<E>(
      result.message || 'Forge API request failed',
      response.status,
      response
    );
  }

  return result.data as T;
};

export const forgeApi = {
  // Global forge settings
  getGlobalSettings: async (): Promise<ForgeProjectSettings> => {
    const response = await makeRequest('/api/forge/config');
    return handleApiResponse<ForgeProjectSettings>(response);
  },

  setGlobalSettings: async (settings: ForgeProjectSettings): Promise<void> => {
    const response = await makeRequest('/api/forge/config', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    await handleApiResponse<void>(response);
  },

  // Omni instances
  listOmniInstances: async (): Promise<{ instances: any[] }> => {
    const response = await makeRequest('/api/forge/omni/instances');
    return handleApiResponse<{ instances: any[] }>(response);
  },
};
