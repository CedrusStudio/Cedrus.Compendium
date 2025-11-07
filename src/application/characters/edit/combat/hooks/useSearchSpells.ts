"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Spell } from '@/domain/characters/combat/Power';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { createKeysetSearchSpellsKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

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

export const useSearchSpells = ({ searchTerm, enabled = true }: UseSearchSpellsParams): UseSearchSpellsReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const spellsQuery = createSpellKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchSpellsKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Spell[]>
  ({
    queryKey,
    queryFn: () => client.search(spellsQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
