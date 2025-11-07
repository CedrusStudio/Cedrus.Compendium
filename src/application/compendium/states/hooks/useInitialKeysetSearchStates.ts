"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchStatesKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Mode } from '@/domain/characters/combat/Mode';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchStates = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const statesQuery = createStateKeysetQuery(search);
    const queryKey = createKeysetSearchStatesKey(search);

    const { data = [] } = useSuspenseQuery<Mode[]>
    ({
        queryKey,
        queryFn: () => client.search(statesQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (statesQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { states: data, initialCursor };
};