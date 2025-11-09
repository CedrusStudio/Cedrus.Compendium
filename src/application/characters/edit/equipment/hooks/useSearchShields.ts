"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Shield } from '@/domain/characters/equipment/Shield';
import { createShieldKeysetQuery } from '@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery';
import { createKeysetSearchShieldsKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchShieldsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchShieldsReturn = 
{
  data: Shield[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchShields = ({ searchTerm, enabled = true }: UseSearchShieldsParams): UseSearchShieldsReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const shieldsQuery = createShieldKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchShieldsKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Shield[]>
  ({
    queryKey,
    queryFn: () => client.search(shieldsQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
