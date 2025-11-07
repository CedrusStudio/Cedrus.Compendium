"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createKeysetSearchSpellsKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { Spell } from '@/domain/characters/combat/Power';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useInitialKeysetSearchSpells = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);
    const spellsQuery = createSpellKeysetQuery(search);
    const queryKey = createKeysetSearchSpellsKey(search);

    const { data = [] } = useSuspenseQuery<Spell[]>
    ({
        queryKey,
        queryFn: () => client.search(spellsQuery),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });


    const initialCursor = data.length === (spellsQuery.pagination?.pageSize ?? DEFAULT_PAGE_SIZE) ? data[data.length - 1]?.id : undefined;
    return { spells: data, initialCursor };
};