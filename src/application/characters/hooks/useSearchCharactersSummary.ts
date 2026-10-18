"use client";

import { useQuery  } from '@tanstack/react-query';
import { createSearchCharactersKey } from '@/persistence/cacheKeys';
import client from "@/infrastructure/clients/searchClient";
import { CharacterSummary, createCharacterSummaryQuery } from "@/infrastructure/searchQueries/characters/createCharacterSummaryQuery";
import { DEFAULT_PAGE_SIZE } from '@/common/global/pagination';
import { useApiKey } from '@/common/hooks/useApiKey';

export function useSearchCharactersSummary
(
    search: string,
    cursor: string,
    includeTags?: string[],
    pageSize: number = DEFAULT_PAGE_SIZE,
    excludeTags?: string[],
    pageNumber?: number
)
{
    const { apiKey } = useApiKey();
    const baseKey = createSearchCharactersKey(search, cursor, includeTags, pageSize, excludeTags, apiKey);
    const queryKey = pageNumber === undefined ? baseKey : [...baseKey, { pageNumber }];

    const query = useQuery<CharacterSummary[]>
    ({
        queryKey,
        queryFn: async () => {
            const payload = createCharacterSummaryQuery(search, cursor, includeTags, pageSize, excludeTags);
            if (pageNumber !== undefined) payload.pagination = { pageNumber, pageSize };
            return client.search<CharacterSummary[]>(payload);
        },
        staleTime: 5_000,
    });

    return { ...query, characters: query.data ?? [], accessKey: apiKey };
};
