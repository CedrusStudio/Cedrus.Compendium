"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchManeuversKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchManeuvers = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const maneuversQuery = createManeuverKeysetQuery(search);
    const queryKey = createKeysetSearchManeuversKey(search);

    const { data = [] } = useSuspenseQuery<Maneuver[]>
    ({
        queryKey,
        queryFn: () => client.search(maneuversQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (maneuversQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { maneuvers: data, initialCursor };
};