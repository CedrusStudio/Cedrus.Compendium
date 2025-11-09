"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Weapon } from '@/domain/characters/equipment/Weapon';
import { createWeaponKeysetQuery } from '@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery';
import { createKeysetSearchWeaponsKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchWeaponsParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchWeaponsReturn = 
{
  data: Weapon[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchWeapons = ({ searchTerm, enabled = true }: UseSearchWeaponsParams): UseSearchWeaponsReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const weaponsQuery = createWeaponKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchWeaponsKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Weapon[]>
  ({
    queryKey,
    queryFn: () => client.search(weaponsQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
