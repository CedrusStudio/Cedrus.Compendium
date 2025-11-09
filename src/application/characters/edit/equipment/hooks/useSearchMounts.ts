"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Mount } from '@/domain/characters/equipment/Mount';
import { createMountKeysetQuery } from '@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery';
import { createKeysetSearchMountsKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchMountsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchMountsReturn = 
{
  data: Mount[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchMounts = ({ searchTerm, enabled = true }: UseSearchMountsParams): UseSearchMountsReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const mountsQuery = createMountKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchMountsKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Mount[]>
  ({
    queryKey,
    queryFn: () => client.search(mountsQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
