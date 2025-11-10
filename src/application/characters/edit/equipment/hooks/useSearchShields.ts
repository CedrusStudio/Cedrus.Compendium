"use client";

import { Shield } from '@/domain/characters/equipment/Shield';
import { createShieldKeysetQuery } from '@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery';
import { createKeysetSearchShieldsKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

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
  return useSearch<Shield>(params, {
    createKeysetQuery: createShieldKeysetQuery,
    createCacheKey: createKeysetSearchShieldsKey,
  });
};
