"use client";

import { Armor } from '@/domain/characters/equipment/Armor';
import { createArmorKeysetQuery } from '@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery';
import { createKeysetSearchArmorsKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

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
  return useSearch<Armor>(params, {
    createKeysetQuery: createArmorKeysetQuery,
    createCacheKey: createKeysetSearchArmorsKey,
  });
};
