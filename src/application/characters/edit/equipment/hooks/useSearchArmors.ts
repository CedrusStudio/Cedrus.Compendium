"use client";

import { Armor } from '@/domain/characters/equipment/Armor';
import { createArmorKeysetQuery } from '@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

type UseSearchArmorsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchArmorsReturn = 
{
  data: Armor[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchArmors = (params: UseSearchArmorsParams): UseSearchArmorsReturn => 
{
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createArmorKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['armors', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Armor>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
