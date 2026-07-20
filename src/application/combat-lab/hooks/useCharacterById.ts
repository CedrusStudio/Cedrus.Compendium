"use client";

/**
 * Fetch a full domain `Character` by id (parameterized, non-suspense variant of
 * characters/hooks/useGetCharacterById). Reuses the existing search-by-id query
 * + `toCharacter` mapping so the Combat Lab picker gets exactly the same
 * `Character` shape the rest of the app uses.
 */

import { useQuery } from "@tanstack/react-query";
import { createCharacterByIdKey } from "@/persistence/cacheKeys";
import client from "@/infrastructure/clients/searchClient";
import { characterQueryById } from "@/infrastructure/searchQueries/characters/characterQueryById";
import { CharacterWithRelations, toCharacter } from "@/persistence/mappings/characterMapping";
import { useApiKey } from "@/common/hooks/useApiKey";
import type { Character } from "@/domain/characters/Character";

export function useCharacterById(id: string | undefined): { character: Character | null; isLoading: boolean }
{
  const { apiKey } = useApiKey();

  const { data, isLoading } = useQuery<CharacterWithRelations | null>({
    queryKey: createCharacterByIdKey(id ?? "", apiKey),
    queryFn: async () => (id ? await client.searchById<CharacterWithRelations>(id, characterQueryById) : null),
    enabled: Boolean(id),
    staleTime: 5_000,
  });

  return { character: data ? toCharacter(data) : null, isLoading };
}
