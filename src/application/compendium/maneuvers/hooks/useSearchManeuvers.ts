"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allManeuversKey, createSearchManeuversKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam, getSortQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/maneuversClient";
import { Maneuver } from '@/domain/characters/combat/Maneuver';

export const useSearchManeuvers = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const sort = getSortQueryParam(searchParams);

    const queryKey = search 
        ? createSearchManeuversKey(search, sort)
        : allManeuversKey;

    const { data = [] } = useSuspenseQuery<Maneuver[]>
    ({
        queryKey,
        queryFn: async () => client.search(search, sort),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { maneuvers: data }
};