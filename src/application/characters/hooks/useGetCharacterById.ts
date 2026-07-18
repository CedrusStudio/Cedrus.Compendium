"use client";

import { useParams } from 'next/navigation';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import client from "@/infrastructure/clients/searchClient";
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';
import { CharacterWithRelations, toCharacter } from '@/persistence/mappings/characterMapping';
import { useApiKey } from '@/common/hooks/useApiKey';

export const useGetCharacterById = () =>
{
    const params = useParams();
    const characterId = String(params.id);
    if (!characterId) throw new Error("Character ID is required");
    const { apiKey } = useApiKey();
    const queryKey = createCharacterByIdKey(characterId, apiKey);

    const { data } = useSuspenseQuery<CharacterWithRelations>
    ({
        queryKey,
        queryFn: async () => await client.searchById(characterId, characterQueryById),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    if (!data) return { character: null };
    return { character: toCharacter(data) };
};