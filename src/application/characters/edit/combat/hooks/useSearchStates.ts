"use client";

import { Mode } from '@/domain/characters/combat/Mode';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

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
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createStateKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['states', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Mode>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
