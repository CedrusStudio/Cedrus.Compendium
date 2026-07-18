'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_KEY_CHANGED_EVENT, API_KEY_STORAGE_KEY, getStoredApiKey } from '@/lib/apiKeyStorage';

export { API_KEY_CHANGED_EVENT, API_KEY_STORAGE_KEY, getStoredApiKey } from '@/lib/apiKeyStorage';

// Characters are the only entity whose visibility depends on the API key
// (see src/persistence/characterVisibility.ts). Both CharactersHeadersList
// and BestiaryTable share this query key prefix, so invalidating it covers
// both views.
const CHARACTERS_QUERY_KEY_PREFIX = ['characters'] as const;

// Battle presets are scoped per API key (see
// features-to-implement/battle-configurations-implementation-plan.md) —
// switching or clearing the key must refresh the preset list, same
// reasoning as CHARACTERS_QUERY_KEY_PREFIX above.
const BATTLE_PRESETS_QUERY_KEY_PREFIX = ['battle-presets'] as const;

/**
 * Hook to manage API key in localStorage
 */
export function useApiKey()
{
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY_PREFIX });
      queryClient.invalidateQueries({ queryKey: BATTLE_PRESETS_QUERY_KEY_PREFIX });
    }
  };

  const removeApiKey = () =>
  {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
    window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
    queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY_PREFIX });
    queryClient.invalidateQueries({ queryKey: BATTLE_PRESETS_QUERY_KEY_PREFIX });
  };

  return {
    apiKey,
    isLoaded,
    hasApiKey: Boolean(apiKey),
    saveApiKey,
    removeApiKey,
  };
}
