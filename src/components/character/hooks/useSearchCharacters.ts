"use client";

import { useSearchParams } from 'next/navigation';
import { Character } from '@/domain/Character';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allCharactersKey, createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/utils/global/httpUtils';
import bffClient from '@/infrastructure/bffClient';

export const useSearchCharacters = () => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);

    const queryKey = search 
        ? createSearchCharactersKey(search)
        : allCharactersKey;

    const { data = [] } = useSuspenseQuery<Character[]>
    ({
        queryKey,
        queryFn: async () => await bffClient.searchCharacters(search),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { characters: data }
};