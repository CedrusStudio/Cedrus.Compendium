"use client";

import { Weapon } from '@/domain/characters/equipment/Weapon';
import { createWeaponKeysetQuery } from '@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery';
import { createKeysetSearchWeaponsKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

type UseSearchWeaponsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchWeaponsReturn = 
{
  data: Weapon[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchWeapons = (params: UseSearchWeaponsParams): UseSearchWeaponsReturn => 
{
  return useSearch<Weapon>(params, {
    createKeysetQuery: createWeaponKeysetQuery,
    createCacheKey: createKeysetSearchWeaponsKey,
  });
};
