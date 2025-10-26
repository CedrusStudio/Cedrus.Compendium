"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allCharactersKey, createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/charactersClient";
import { CharacterSummary } from '@/persistence/charactersRepository';
import { createCharacterSummaryQuery } from '../grid/createCharacterSummaryQuery';

export const useSearchCharactersSummary = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);

    const queryKey = search 
        ? createSearchCharactersKey(search)
        : allCharactersKey;

    const { data = [] } = useSuspenseQuery<CharacterSummary[]>
    ({
        queryKey,
        queryFn: async () => await client.searchWithPayload(createCharacterSummaryQuery(search)),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { characters: data }
};