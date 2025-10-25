"use client";

import { useParams } from 'next/navigation';
import { Character } from '@/domain/characters/Character';
import { useSuspenseQuery  } from '@tanstack/react-query';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import client from "@/infrastructure/clients/charactersClient";

export const useGetCharacterById = () => 
{
    const params = useParams();
    const characterId = String(params.id);
    if (!characterId) throw new Error("Character ID is required");
    const queryKey = createCharacterByIdKey(characterId);

    const { data } = useSuspenseQuery<Character>
    ({
        queryKey,
        queryFn: async () => await client.getById(characterId),
        staleTime: 5_000,
        refetchOnWindowFocus: true,
    });

    return { character: data }
};