"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Armor } from '@/domain/characters/equipment/Armor';
import { createArmorKeysetQuery } from '@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery';
import { createKeysetSearchArmorsKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchArmorsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchArmorsReturn = 
{
  data: Armor[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchArmors = ({ searchTerm, enabled = true }: UseSearchArmorsParams): UseSearchArmorsReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const armorsQuery = createArmorKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchArmorsKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Armor[]>
  ({
    queryKey,
    queryFn: () => client.search(armorsQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
