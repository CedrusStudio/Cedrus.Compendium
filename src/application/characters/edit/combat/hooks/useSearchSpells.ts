"use client";

import { Spell } from '@/domain/characters/combat/Power';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { createKeysetSearchSpellsKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

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
  return useSearch<Spell>(params, {
    createKeysetQuery: createSpellKeysetQuery,
    createCacheKey: createKeysetSearchSpellsKey,
  });
};
