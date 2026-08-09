"use client";

/**
 * Fetch a full domain `Character` by id (parameterized, non-suspense variant of
 * characters/hooks/useGetCharacterById). Reuses the existing search-by-id query
 * + `toCharacter` mapping so the Combat Lab picker gets exactly the same
 * `Character` shape the rest of the app uses.
 */

import { useMemo } from "react";
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

  // `toCharacter` buduje NOWY obiekt przy każdym wywołaniu. Bez memoizacji każdy
  // render zwracał inną referencję, więc dowolny `useEffect` zależny od
  // `character` odpalał się w kółko — a jeśli ten efekt podnosił stan rodzica,
  // powstawała pętla („Maximum update depth exceeded" w CharacterModeFilter).
  // Referencja musi być stabilna tak długo, jak stabilne są dane z cache'a.
  const character = useMemo(() => (data ? toCharacter(data) : null), [data]);

  return { character, isLoading };
}
