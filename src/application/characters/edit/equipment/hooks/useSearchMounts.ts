"use client";

import { Mount } from '@/domain/characters/equipment/Mount';
import { createMountKeysetQuery } from '@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery';
import { createKeysetSearchMountsKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

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
  return useSearch<Mount>(params, {
    createKeysetQuery: createMountKeysetQuery,
    createCacheKey: createKeysetSearchMountsKey,
  });
};
