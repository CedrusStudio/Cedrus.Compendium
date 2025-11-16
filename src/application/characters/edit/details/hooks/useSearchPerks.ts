"use client";

import { Perk } from '@/domain/characters/Perk';
import { createPerkKeysetQuery } from '@/infrastructure/searchQueries/perks/createPerkKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

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
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createPerkKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['perks', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Perk>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
