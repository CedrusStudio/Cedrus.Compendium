"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchPerksKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Perk } from '@/domain/characters/Perk';
import { createPerkKeysetQuery } from '@/infrastructure/searchQueries/perks/createPerkKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchPerks = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const perksQuery = createPerkKeysetQuery(search);
    const queryKey = createKeysetSearchPerksKey(search);

    const { data = [] } = useSuspenseQuery<Perk[]>
    ({
        queryKey,
        queryFn: () => client.search(perksQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (perksQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { perks: data, initialCursor };
};