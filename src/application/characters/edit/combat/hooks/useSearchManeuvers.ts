"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';
import { createKeysetSearchManeuversKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchManeuversParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchManeuversReturn = 
{
  data: Maneuver[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchManeuvers = ({ searchTerm, enabled = true }: UseSearchManeuversParams): UseSearchManeuversReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const maneuversQuery = createManeuverKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchManeuversKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Maneuver[]>
  ({
    queryKey,
    queryFn: () => client.search(maneuversQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
