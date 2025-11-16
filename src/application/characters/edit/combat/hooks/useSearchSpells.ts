"use client";

import { Spell } from '@/domain/characters/combat/Power';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

type UseSearchSpellsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchSpellsReturn = 
{
  data: Spell[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchSpells = (params: UseSearchSpellsParams): UseSearchSpellsReturn => 
{
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createSpellKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['spells', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Spell>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
