"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { useDebounce } from "use-debounce";
import { SearchEntityPayload } from '@/common/global/SearchPayloads';

type UseSearchParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchReturn<TData> = 
{
  data: TData[];
  isLoading: boolean;
  error: Error | null;
};

type UseSearchConfig = 
{
  createKeysetQuery: (searchTerm: string) => SearchEntityPayload;
  createCacheKey: (searchTerm: string) => readonly [string, string, string | undefined, string, number];
  staleTime?: number;
};

export function useSearch<TData>
(
  { searchTerm, enabled = true }: UseSearchParams,
  { createKeysetQuery, createCacheKey, staleTime = 5_000 }: UseSearchConfig
)
  : UseSearchReturn<TData> 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const query = createKeysetQuery(debouncedSearchTerm);
  const queryKey = createCacheKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<TData[]>
  ({
    queryKey,
    queryFn: () => client.search<TData[]>(query),
    enabled,
    staleTime
  });

  return { 
    data, 
    isLoading, 
    error 
  };
}
