"use client";

import { Mode } from '@/domain/characters/combat/Mode';
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

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
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createStanceKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['stances', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Mode>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
