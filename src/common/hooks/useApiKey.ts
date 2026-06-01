'use client';

import { useEffect, useState } from 'react';
import { API_KEY_CHANGED_EVENT, API_KEY_STORAGE_KEY, getStoredApiKey } from '@/lib/apiKeyStorage';

export { API_KEY_CHANGED_EVENT, API_KEY_STORAGE_KEY, getStoredApiKey } from '@/lib/apiKeyStorage';

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
      const storedKey = getStoredApiKey();
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
