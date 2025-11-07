"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Mode } from '@/domain/characters/combat/Mode';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';
import { createKeysetSearchStatesKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchStatesParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchStatesReturn = 
{
  data: Mode[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchStates = ({ searchTerm, enabled = true }: UseSearchStatesParams): UseSearchStatesReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const statesQuery = createStateKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchStatesKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Mode[]>
  ({
    queryKey,
    queryFn: () => client.search(statesQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
