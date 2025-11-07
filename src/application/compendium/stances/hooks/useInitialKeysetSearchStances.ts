"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchStancesKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Mode } from '@/domain/characters/combat/Mode';
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchStances = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const stancesQuery = createStanceKeysetQuery(search);
    const queryKey = createKeysetSearchStancesKey(search);

    const { data = [] } = useSuspenseQuery<Mode[]>
    ({
        queryKey,
        queryFn: () => client.search(stancesQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (stancesQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { stances: data, initialCursor };
};