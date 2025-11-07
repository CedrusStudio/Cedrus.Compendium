"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Perk } from '@/domain/characters/Perk';
import { createPerkKeysetQuery } from '@/infrastructure/searchQueries/perks/createPerkKeysetQuery';
import { createKeysetSearchPerksKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchPerksParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchPerksReturn = 
{
  perks: Perk[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchPerks = ({ searchTerm, enabled = true }: UseSearchPerksParams): UseSearchPerksReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const perksQuery = createPerkKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchPerksKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Perk[]>
  ({
    queryKey,
    queryFn: () => client.search(perksQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    perks: data, 
    isLoading, 
    error 
  };
};
