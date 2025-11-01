"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createSearchManeuversKeyWithFallback } from '@/persistence/cacheKeys';
import { getCursorQueryParam, getSearchQueryParam, getSortDirectionQueryParam, getSortQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverQuery';

export const useSearchManeuvers = (pageSize: number) => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const sort = getSortQueryParam(searchParams);
    const sortDirection = getSortDirectionQueryParam(searchParams);
    const cursor = getCursorQueryParam(searchParams);

    const pagination = { cursor, pageSize };
    const queryKey = createSearchManeuversKeyWithFallback(search, sort, sortDirection);
    const maneuversQuery = createManeuverQuery(search, sort, sortDirection, pagination);

    const { data = [] } = useSuspenseQuery<Maneuver[]>
    ({
        queryKey,
        queryFn: () => client.search(maneuversQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { maneuvers: data };
};