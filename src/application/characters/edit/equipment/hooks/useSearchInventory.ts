"use client";

import { Item } from '@/domain/characters/equipment/Item';
import { createInventoryItemKeysetQuery } from '@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery';
import { createKeysetSearchInventoryKey } from '@/persistence/cacheKeys';
import { useSearch } from '@/infrastructure/hooks/useSearch';

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

export const useSearchInventory = (params: UseSearchInventoryParams): UseSearchInventoryReturn => 
{
  return useSearch<Item>(params, {
    createKeysetQuery: createInventoryItemKeysetQuery,
    createCacheKey: createKeysetSearchInventoryKey,
  });
};
