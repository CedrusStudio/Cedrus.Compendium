"use client";

import { Perk } from '@/domain/characters/Perk';
import { createPerkKeysetQuery } from '@/infrastructure/searchQueries/perks/createPerkKeysetQuery';
import { createKeysetSearchPerksKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

type UseSearchPerksParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchPerksReturn = 
{
  data: Perk[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchPerks = (params: UseSearchPerksParams): UseSearchPerksReturn => 
{
  return useSearch<Perk>(params, {
    createKeysetQuery: createPerkKeysetQuery,
    createCacheKey: createKeysetSearchPerksKey,
  });
};
