"use client";

import { useSearchParams } from 'next/navigation';
import { useQuery  } from '@tanstack/react-query';
import { createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { CharacterSummary, createCharacterSummaryQuery } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';

export const useSearchCharactersSummary = (cursor: string, includeTags?: string[], pageSize: number = DEFAULT_PAGE_SIZE) => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);

    const queryKey = createSearchCharactersKey(search || '', cursor, includeTags, pageSize);

    const { data = [] } = useQuery<CharacterSummary[]>
    ({
        queryKey,
        queryFn: async () => await client.search<CharacterSummary[]>(createCharacterSummaryQuery(search, cursor, includeTags, pageSize)),
        staleTime: 5_000,
    });

    return { characters: data }
};