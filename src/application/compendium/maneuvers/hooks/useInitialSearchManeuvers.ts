"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createSearchManeuversKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam, getSortDirectionQueryParam, getSortQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { createManeuverQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverQuery';

export const useInitialSearchManeuvers = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const sort = getSortQueryParam(searchParams);
    const sortDirection = getSortDirectionQueryParam(searchParams);
    const maneuversQuery = createManeuverQuery(search, sort, sortDirection);
    const queryKey = createSearchManeuversKey(search, sort, sortDirection);

    const { data = [] } = useSuspenseQuery<Maneuver[]>
    ({
        queryKey,
        queryFn: () => client.search(maneuversQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { maneuvers: data };
};