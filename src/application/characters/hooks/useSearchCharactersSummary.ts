"use client";

import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allCharactersKey, createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import bffClient from '@/infrastructure/bffClient';
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
        queryFn: async () => await bffClient.searchCharactersSummary(search),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { characters: data }
};