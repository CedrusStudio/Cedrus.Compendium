"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createSearchManeuversKeyWithFallback } from '@/persistence/cacheKeys';
import { getSearchQueryParam, getSortDirectionQueryParam, getSortQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverQuery';

export const useSearchManeuvers = (pageSize: number) => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const sort = getSortQueryParam(searchParams);
    const sortDirection = getSortDirectionQueryParam(searchParams);
    const cursor = searchParams.get('cursor') || "0000WZXVD68PVAE7QCBNH45B8F";

    const pagination = { cursor, pageSize: pageSize + 1 };
    const queryKey = createSearchManeuversKeyWithFallback(search, sort, sortDirection);
    const maneuversQuery = createManeuverQuery(search, sort, sortDirection, pagination);

    console.log("useSearchManeuvers called with:", maneuversQuery);
    const { data = [] } = useSuspenseQuery<Maneuver[]>
    ({
        queryKey,
        queryFn: async () => client.search(maneuversQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });
    console.log("data:", data);

    const newCursor = data.length > 0 ? data[data.length - 1].id : undefined;
    const dataSlice = data.length > pageSize ? data.slice(0, -1) : data;
    return { maneuvers: dataSlice, cursor: newCursor };
};