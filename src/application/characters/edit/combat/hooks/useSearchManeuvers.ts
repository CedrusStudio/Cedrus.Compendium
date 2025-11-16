"use client";

import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

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
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createManeuverKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['maneuvers', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Maneuver>(params, 
  {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
