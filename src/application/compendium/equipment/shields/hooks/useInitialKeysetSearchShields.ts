"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchShieldsKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Shield } from '@/domain/characters/equipment/Shield';
import { createShieldKeysetQuery } from '@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchShields = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const shieldsQuery = createShieldKeysetQuery(search);
    const queryKey = createKeysetSearchShieldsKey(search);

    const { data = [] } = useSuspenseQuery<Shield[]>
    ({
        queryKey,
        queryFn: () => client.search(shieldsQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (shieldsQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { shields: data, initialCursor };
};
