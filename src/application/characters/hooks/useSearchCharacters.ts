"use client";

import { useSearchParams } from 'next/navigation';
import { Character } from '@/domain/characters/Character';
import { useQuery  } from '@tanstack/react-query';
import { createSearchCharactersKey } from '@/persistence/cacheKeys';
import { getSearchQueryParam  } from '@/common/global/httpUtils';
import client from "@/infrastructure/clients/searchClient";
import { createCharacterQuery } from "@/infrastructure/searchQueries/characters/createCharacterQuery";
import { DEFAULT_PAGE_SIZE, emptyUlid } from '@/common/global/pagination';

export const useSearchCharacters = (cursor: string = emptyUlid, pageSize: number = DEFAULT_PAGE_SIZE) => 
{
    const searchParams = useSearchParams();
    const search = getSearchQueryParam(searchParams);

    const queryKey = createSearchCharactersKey(search || '', cursor, undefined, pageSize);

    const { data = [] } = useQuery<Character[]>
    ({
        queryKey,
        queryFn: async () => await client.search(createCharacterQuery(search)),
        staleTime: 5_000,
    });
    
    return { characters: data }
};