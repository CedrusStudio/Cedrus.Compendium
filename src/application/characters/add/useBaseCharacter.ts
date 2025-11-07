"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';
import { CharacterWithRelations } from '@/persistence/mappings/characterMapping';

type UseBaseCharacterParams = 
{
  characterId: string | undefined;
  enabled: boolean;
};

type UseBaseCharacterReturn = 
{
  baseCharacter: CharacterWithRelations | undefined;
  isLoading: boolean;
  error: Error | null;
};

export const useBaseCharacter = ({ characterId, enabled }: UseBaseCharacterParams): UseBaseCharacterReturn => 
{
  const { data, isLoading, error } = useQuery<CharacterWithRelations>
  ({
    queryKey: ['character', characterId],
    queryFn: async () => await client.searchById(characterId!, characterQueryById) as CharacterWithRelations,
    enabled: enabled && !!characterId,
    staleTime: 5_000,
  });

  return { 
    baseCharacter: data, 
    isLoading, 
    error 
  };
};
