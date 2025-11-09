"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchWeaponsKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Weapon } from '@/domain/characters/equipment/Weapon';
import { createWeaponKeysetQuery } from '@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchWeapons = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const weaponsQuery = createWeaponKeysetQuery(search);
    const queryKey = createKeysetSearchWeaponsKey(search);

    const { data = [] } = useSuspenseQuery<Weapon[]>
    ({
        queryKey,
        queryFn: () => client.search(weaponsQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (weaponsQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { weapons: data, initialCursor };
};
