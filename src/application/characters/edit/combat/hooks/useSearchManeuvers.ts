"use client";

import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';
import { createKeysetSearchManeuversKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

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

export const useSearchManeuvers = (params: UseSearchManeuversParams): UseSearchManeuversReturn => 
{
  return useSearch<Maneuver>(params, 
  {
    createKeysetQuery: createManeuverKeysetQuery,
    createCacheKey: createKeysetSearchManeuversKey,
  });
};
