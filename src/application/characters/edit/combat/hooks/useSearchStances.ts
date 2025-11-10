"use client";

import { Mode } from '@/domain/characters/combat/Mode';
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import { createKeysetSearchStancesKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

type UseSearchStancesParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchStancesReturn = 
{
  data: Mode[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchStances = (params: UseSearchStancesParams): UseSearchStancesReturn => 
{
  return useSearch<Mode>(params, {
    createKeysetQuery: createStanceKeysetQuery,
    createCacheKey: createKeysetSearchStancesKey,
  });
};
