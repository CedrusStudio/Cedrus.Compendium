export const API_KEY_STORAGE_KEY = 'cedrus-system-api-key';
export const API_KEY_CHANGED_EVENT = 'cedrus-api-key-changed';

export function getStoredApiKey(): string | null
{
  if (typeof window === 'undefined') return null;

  return localStorage.getItem(API_KEY_STORAGE_KEY);
}