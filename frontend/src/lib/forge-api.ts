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
 * Helper function 'wrapper' for fetch to make API requests with timeout and retry logic.
 * Automatically configures the 'Content-Type' to 'application/json'.
 * Includes exponential backoff retry for transient failures (timeout, network errors).
 *
 * IMPORTANT: Retries only happen for idempotent methods (GET, HEAD, OPTIONS).
 * Non-idempotent methods (POST, PUT, DELETE, PATCH) are not retried to avoid duplicate operations.
 *
 * @param {string} url - The URL of the API endpoint
 * @param {RequestInit} options - The options for the request (method, body, etc.)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {number} maxRetries - Maximum number of retry attempts (default: 2, only for idempotent methods)
 * @returns {Promise<Response>} - A promise that resolves to the Response object from fetch.
 * @example
 * const response = await makeRequest('/api/data', { method: 'GET' }, 30000, 2);
 */
const makeRequest = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000,
  maxRetries: number = 2
): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Only retry for idempotent methods (GET, HEAD, OPTIONS)
  // Non-idempotent methods (POST, PUT, DELETE, PATCH) are not retried to avoid duplicates
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = ['GET', 'HEAD', 'OPTIONS'].includes(method);
  const effectiveMaxRetries = isIdempotent ? maxRetries : 0;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= effectiveMaxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // Compose timeout signal with caller's signal (if provided)
      // Use AbortSignal.any() for proper signal composition (modern browsers)
      // Falls back to event listener approach for older browsers
      const callerSignal = options.signal as AbortSignal | undefined;
      let composedSignal = controller.signal;

      if (callerSignal) {
        if ('any' in AbortSignal && typeof AbortSignal.any === 'function') {
          // Modern approach: use AbortSignal.any() to compose signals
          composedSignal = AbortSignal.any([controller.signal, callerSignal]);
        } else {
          // Fallback: listen to caller's signal and abort our controller
          callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: composedSignal,
        });

        clearTimeout(timeout);
        return response;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Skip retry logic for non-idempotent methods
      if (!isIdempotent) {
        throw lastError;
      }

      // Check if abort came from caller (not timeout)
      // If caller aborted, don't retry - they want the request to stop immediately
      const callerSignal = options.signal as AbortSignal | undefined;
      if (lastError.name === 'AbortError' && callerSignal?.aborted) {
        // Caller explicitly aborted - don't retry
        throw lastError;
      }

      // Idempotent methods: retry with exponential backoff
      if (lastError.name === 'AbortError') {
        // Timeout abort (not caller abort) - retry with exponential backoff
        if (attempt < effectiveMaxRetries) {
          const backoffMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          console.warn(
            `[Forge API] ${method} request to ${url} timed out (attempt ${attempt + 1}/${effectiveMaxRetries + 1}). Retrying in ${backoffMs}ms...`
          );
          continue;
        }
      } else if (lastError.name === 'TypeError' && lastError.message === 'Failed to fetch') {
        // Network error - might be transient
        if (attempt < effectiveMaxRetries) {
          const backoffMs = 1000 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          console.warn(
            `[Forge API] ${method} request to ${url} failed: ${lastError.message} (attempt ${attempt + 1}/${effectiveMaxRetries + 1}). Retrying in ${backoffMs}ms...`
          );
          continue;
        }
      } else {
        // Other error types - don't retry
        throw lastError;
      }

      if (attempt === effectiveMaxRetries) {
        throw lastError;
      }
    }
  }

  // Exhausted all retries
  throw lastError || new Error(`Request to ${url} failed after ${effectiveMaxRetries + 1} attempts`);
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
