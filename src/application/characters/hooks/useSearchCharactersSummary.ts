"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allCharactersKey, createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import { charactersClient } from "@/infrastructure/bffClients";
import { CharacterSummary } from '@/persistence/charactersRepository';

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
        queryFn: async () => await charactersClient.searchSummaries(search),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { characters: data }
};