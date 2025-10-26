"use client";

import { useSearchParams } from 'next/navigation';
import { Character } from '@/domain/characters/Character';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { allCharactersKey, createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { createCharacterQuery } from '@/persistence/characters/createCharacterQuery';

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
        queryFn: async () => await client.search(createCharacterQuery(search)),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });
    
    return { characters: data }
};