"use client";

import { useQuery } from '@tanstack/react-query';
import client from "@/infrastructure/clients/searchClient";
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';
import { CharacterWithRelations, toCharacter } from '@/persistence/mappings/characterMapping';
import { Character } from '@/domain/characters/Character';

type UseCharacterItemsSourceParams =
{
  characterId: string | undefined;
  enabled: boolean;
};

type UseCharacterItemsSourceReturn =
{
  sourceCharacter: Character | undefined;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Fetches a full character (with all relations) by id and maps it to the
 * domain `Character` shape, so its item collections (maneuvers, perks,
 * stances, states, powers[].spells, equipment.*) can be used as the source
 * list for the "import from another character" feature.
 *
 * Shares its query key with `useBaseCharacter` (same underlying fetch), so
 * the two features reuse each other's cache entries.
 */
export function useCharacterItemsSource({ characterId, enabled }: UseCharacterItemsSourceParams)
  : UseCharacterItemsSourceReturn
{
  const { data, isLoading, error } = useQuery<CharacterWithRelations>
  ({
    queryKey: ['character', characterId],
    queryFn: async () => await client.searchById(characterId!, characterQueryById) as CharacterWithRelations,
    enabled: enabled && !!characterId,
    staleTime: 5_000,
  });

  return {
    sourceCharacter: data ? toCharacter(data) : undefined,
    isLoading,
    error,
  };
}
