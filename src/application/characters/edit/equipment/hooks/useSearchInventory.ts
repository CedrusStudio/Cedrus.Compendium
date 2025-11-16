"use client";

import { Item } from '@/domain/characters/equipment/Item';
import { createInventoryItemKeysetQuery } from '@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery';
import { useSearch } from '@/infrastructure/hooks/useSearch';
import { emptyUlid, DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { SearchEntityPayload } from '@/common/global/SearchPayloads';
import { searchParamKey } from '@/common/global/httpUtils';

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
  const createQuery = (searchTerm: string): SearchEntityPayload => 
    createInventoryItemKeysetQuery(searchTerm, emptyUlid, DEFAULT_PAGE_SIZE);

  const createKey = (searchTerm: string) => 
    ['inventory', searchParamKey, searchTerm || undefined, emptyUlid, DEFAULT_PAGE_SIZE] as const;

  return useSearch<Item>(params, {
    createKeysetQuery: createQuery,
    createCacheKey: createKey,
  });
};
