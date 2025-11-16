"use client";

import { Weapon } from '@/domain/characters/equipment/Weapon';
import { createWeaponKeysetQuery } from '@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

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
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createWeaponKeysetQuery(searchTerm, emptyUlid);

  const createKey = (searchTerm: string) => 
    ['weapons', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Weapon>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
