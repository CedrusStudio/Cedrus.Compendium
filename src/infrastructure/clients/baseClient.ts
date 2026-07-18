import axios from 'axios';
import { getStoredApiKey } from '@/lib/apiKeyStorage';
import { API_KEY_HEADER } from '@/proxy';

/**
 * Extracts the server-provided `message` field from an API error response
 * body, e.g. `{ message: "Invalid API key(s), not part of the configured
 * admin keys: BOGUS" }`. Returns undefined when there's nothing usable, so
 * callers can fall back to axios's own generic message.
 */
export function extractServerErrorMessage(error: { response?: { data?: unknown } }): string | undefined
{
  const data = error.response?.data;
  if (!data || typeof data !== 'object') return undefined;

  const message = (data as Record<string, unknown>).message;
  return typeof message === 'string' && message.length > 0 ? message : undefined;
}

const client = axios.create
({
  baseURL: '/api',
  headers: 
  {
    Accept: 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

// Add API key interceptor.
// Note: the key is attached to every request, including POST /search — the
// proxy (src/proxy.ts) does not require it there, but /api/search uses it to
// scope character visibility (see src/persistence/characterVisibility.ts).
client.interceptors.request.use
(
  (config) =>
  {
    if (!config.method) return config;

    const apiKey = getStoredApiKey();
    if (apiKey)
    {
      config.headers[API_KEY_HEADER] = apiKey;
    }

    return config;
  },
  (error) => 
  {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
client.interceptors.response.use
(
  (response) => response,
  (error) =>
  {
    if (error.response?.status === 401)
    {
      console.error('🔒 Authentication required: Please set your API key in settings');
    }
    else if (error.response?.status === 403)
    {
      console.error('🚫 Access denied: Invalid API key');
    }

    // Surface the server's own error message (e.g. "Invalid API key(s), not
    // part of the configured admin keys: ...") instead of axios's generic
    // "Request failed with status code 4xx/5xx" — callers (e.g. the toast in
    // onSaveCallbacks.tsx) read `error.message`, not the response body.
    const serverMessage = extractServerErrorMessage(error);
    if (serverMessage)
    {
      error.message = serverMessage;
    }

    return Promise.reject(error);
  }
);

export default client;