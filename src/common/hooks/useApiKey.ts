'use client';

import { useEffect, useState } from 'react';

const API_KEY_STORAGE_KEY = 'cedrus-system-api-key';

/**
 * Hook to manage API key in localStorage
 */
export function useApiKey() 
{
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => 
  {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    setApiKey(storedKey);
    setIsLoaded(true);
  }, []);

  // Save API key to localStorage
  const saveApiKey = (key: string) => 
  {
    if (key.trim()) 
    {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
      setApiKey(key.trim());
    }
  };

  // Remove API key from localStorage
  const removeApiKey = () => 
  {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
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
