"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchArmorsKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Armor } from '@/domain/characters/equipment/Armor';
import { createArmorKeysetQuery } from '@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchArmors = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const armorsQuery = createArmorKeysetQuery(search);
    const queryKey = createKeysetSearchArmorsKey(search);

    const { data = [] } = useSuspenseQuery<Armor[]>
    ({
        queryKey,
        queryFn: () => client.search(armorsQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (armorsQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { armors: data, initialCursor };
};
