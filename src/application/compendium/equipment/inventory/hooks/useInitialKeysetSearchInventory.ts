"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchInventoryKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Item } from '@/domain/characters/equipment/Item';
import { createInventoryItemKeysetQuery } from '@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchInventory = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const inventoryQuery = createInventoryItemKeysetQuery(search);
    const queryKey = createKeysetSearchInventoryKey(search);

    const { data = [] } = useSuspenseQuery<Item[]>
    ({
        queryKey,
        queryFn: () => client.search(inventoryQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (inventoryQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { inventory: data, initialCursor };
};
