import type { ForgeProjectSettings } from 'shared/forge-types';
import type { ApiResponse } from 'shared/types';

/**
 * Custom error class for Forge API failures.
 * Extends the native Error class with API-specific details.
 *
 * @param {string} message - The error message
 * @param {number} statusCode - The HTTP status code
 * @param {Response} response - The original fetch Response object
 * @param {E} error_data - The error data payload
 * @example
 * throw new ApiError('Request failed', 500, response, error_data);
 */
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

/**
 * Helper function 'wrapper' for fetch to make API requests.
 * Automatically configures the 'Content-Type' to 'application/json'.
 *
 * @param {string} url - The URL of the API endpoint
 * @param {RequestInit} options - The options for the request (method, body, etc.)
 * @returns {Promise<Response>} - A promise that resolves to the Response object from fetch.
 * @example
 * const response = await makeRequest('/api/data', { method: 'GET' });
 */
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

/**
 * Process the API response
 * @template T
 * @template E
 * @param {Response} response - The response object
 * @returns promise that resolves to the response data
 * @throws {ApiError<E>} - Throws an ApiError if the request fails
 * @example
 * const response = await makeRequest('https://api.example.com/data', { method: 'GET' });
 * const data = await handleApiResponse<Data>(response);
 * return data;
 */
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
  /**
   * Get the global Forge settings
   * @returns {Promise<ForgeProjectSettings>} - The global Forge settings
   * @throws {ApiError<ForgeProjectSettings>} - Throws an ApiError if the request fails
   * @example
   * const settings = await forgeApi.getGlobalSettings();
   * return settings;
   */
  getGlobalSettings: async (): Promise<ForgeProjectSettings> => {
    const response = await makeRequest('/api/forge/config');
    return handleApiResponse<ForgeProjectSettings>(response);
  },


  /**
   * Set the global Forge settings
   * @param {ForgeProjectSettings} settings - The Forge settings to set 
   * @returns {Promise<void>} - A promise that resolves when the settings are set
   * @throws {ApiError} - Throws an ApiError if the request fails
   * @example
   * await forgeApi.setGlobalSettings({
   *   omni_enabled: true,
   *   omni_config: {
   *     enabled: true,
   *     host: 'https://omni-api-instance',
   *     api_key: 'evo_1234567890abcdef',
   *     instance: 'automagik-forge',
   *     recipient: '+15551234567',
   *     recipient_type: 'PhoneNumber',
   *   },
   * });
   */
  setGlobalSettings: async (settings: ForgeProjectSettings): Promise<void> => {
    const response = await makeRequest('/api/forge/config', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    await handleApiResponse<void>(response);
  },

  // Omni instances
  /**
   * List the Omni instances
   * @returns {Promise<{ instances: Array<Record<string, unknown>> }>} - A promise that resolves to the Omni instances
   * @throws {ApiError} - Throws an ApiError if the request fails
   * @example
   * const instances = await forgeApi.listOmniInstances();
   * return instances;
   */
  listOmniInstances: async (): Promise<{ instances: Array<Record<string, unknown>> }> => {
    const response = await makeRequest('/api/forge/omni/instances');
    return handleApiResponse<{ instances: Array<Record<string, unknown>> }>(response);
  },
};
