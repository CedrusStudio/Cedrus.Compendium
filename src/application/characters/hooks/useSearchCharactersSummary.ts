"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allCharactersKey, createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { CharacterSummary, createCharacterSummaryQuery } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";

export const useSearchCharactersSummary = (includeTags?: string[]) => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);

    const queryKey = search || (includeTags && includeTags.length > 0)
        ? createSearchCharactersKey(search || '', includeTags)
        : allCharactersKey;

    const { data = [] } = useSuspenseQuery<CharacterSummary[]>
    ({
        queryKey,
        queryFn: async () => await client.search<CharacterSummary[]>(createCharacterSummaryQuery(search, includeTags)),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { characters: data }
};