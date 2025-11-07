"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Mode } from '@/domain/characters/combat/Mode';
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import { createKeysetSearchStancesKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchStancesParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchStancesReturn = 
{
  data: Mode[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchStances = ({ searchTerm, enabled = true }: UseSearchStancesParams): UseSearchStancesReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const stancesQuery = createStanceKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchStancesKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Mode[]>
  ({
    queryKey,
    queryFn: () => client.search(stancesQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
