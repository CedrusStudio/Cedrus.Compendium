"use client";

import { Mode } from '@/domain/characters/combat/Mode';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';
import { createKeysetSearchStatesKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

type UseSearchStatesParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchStatesReturn = 
{
  data: Mode[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchStates = (params: UseSearchStatesParams): UseSearchStatesReturn => 
{
  return useSearch<Mode>(params, {
    createKeysetQuery: createStateKeysetQuery,
    createCacheKey: createKeysetSearchStatesKey,
  });
};
