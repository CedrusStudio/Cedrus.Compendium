"use client";

import { useQuery  } from '@tanstack/react-query';
import { createSearchCharactersKey } from '@/persistence/cacheKeys';
import client from "@/infrastructure/clients/searchClient";
import { CharacterSummary, createCharacterSummaryQuery } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export function useSearchCharactersSummary
(
    search: string, 
    cursor: string, 
    includeTags?: string[], 
    pageSize: number = DEFAULT_PAGE_SIZE,
    excludeTags?: string[]
)
{
    const queryKey = createSearchCharactersKey(search, cursor, includeTags, pageSize, excludeTags);

    const { data = [] } = useQuery<CharacterSummary[]>
    ({
        queryKey,
        queryFn: async () => await client.search<CharacterSummary[]>(createCharacterSummaryQuery(search, cursor, includeTags, pageSize, excludeTags)),
        staleTime: 5_000,
    });

    return { characters: data }
};