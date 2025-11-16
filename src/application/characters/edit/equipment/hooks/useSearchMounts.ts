"use client";

import { Mount } from '@/domain/characters/equipment/Mount';
import { createMountKeysetQuery } from '@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

type UseSearchMountsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchMountsReturn = 
{
  data: Mount[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchMounts = (params: UseSearchMountsParams): UseSearchMountsReturn => 
{
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createMountKeysetQuery(searchTerm, emptyUlid);

  const createKey = (searchTerm: string) => 
    ['mounts', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Mount>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
