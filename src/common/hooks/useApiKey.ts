'use client';

import { useEffect, useState } from 'react';

export const API_KEY_STORAGE_KEY = 'cedrus-system-api-key';
export const API_KEY_CHANGED_EVENT = 'cedrus-api-key-changed';

/**
 * Hook to manage API key in localStorage
 */
export function useApiKey() 
{
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => 
  {
    const syncFromStorage = () => 
    {
      const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      setApiKey(storedKey);
      setIsLoaded(true);
    };

    syncFromStorage();

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(API_KEY_CHANGED_EVENT, syncFromStorage);

    return () => 
    {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(API_KEY_CHANGED_EVENT, syncFromStorage);
    };
  }, []);

  const saveApiKey = (key: string) => 
  {
    if (key.trim()) 
    {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
      setApiKey(key.trim());
      window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
    }
  };

  const removeApiKey = () => 
  {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
    window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
  };

  return {
    apiKey,
    isLoaded,
    hasApiKey: Boolean(apiKey),
    saveApiKey,
    removeApiKey,
  };
}

/**
 * Get API key from localStorage (synchronous - for use in interceptors)
 */
export function getStoredApiKey(): string | null 
{
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}
