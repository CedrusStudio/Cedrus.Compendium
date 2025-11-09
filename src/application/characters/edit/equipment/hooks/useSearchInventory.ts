"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { Item } from '@/domain/characters/equipment/Item';
import { createInventoryItemKeysetQuery } from '@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery';
import { createKeysetSearchInventoryKey } from '@/persistence/cacheKeys';
import { useDebounce } from "use-debounce";

type UseSearchInventoryParams = 
{
  searchTerm: string;
  enabled?: boolean;
};

type UseSearchInventoryReturn = 
{
  data: Item[];
  isLoading: boolean;
  error: Error | null;
};

export const useSearchInventory = ({ searchTerm, enabled = true }: UseSearchInventoryParams): UseSearchInventoryReturn => 
{
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const inventoryQuery = createInventoryItemKeysetQuery(debouncedSearchTerm);
  const queryKey = createKeysetSearchInventoryKey(debouncedSearchTerm);

  const { data = [], isLoading, error } = useQuery<Item[]>
  ({
    queryKey,
    queryFn: () => client.search(inventoryQuery),
    enabled,
    staleTime: 5_000,
  });

  return { 
    data, 
    isLoading, 
    error 
  };
};
