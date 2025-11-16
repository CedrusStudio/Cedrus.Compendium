"use client";

import { Shield } from '@/domain/characters/equipment/Shield';
import { createShieldKeysetQuery } from '@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

type UseSearchShieldsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchShieldsReturn = 
{
  data: Shield[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchShields = (params: UseSearchShieldsParams): UseSearchShieldsReturn => 
{
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createShieldKeysetQuery(searchTerm, emptyUlid);

  const createKey = (searchTerm: string) => 
    ['shields', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Shield>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
