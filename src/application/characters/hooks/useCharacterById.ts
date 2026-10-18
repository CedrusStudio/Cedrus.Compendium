"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createCharacterByIdKey } from '@/persistence/cacheKeys';
import client from '@/infrastructure/clients/searchClient';
import { characterQueryById } from '@/infrastructure/searchQueries/characters/characterQueryById';
import { type CharacterWithRelations, toCharacter } from '@/persistence/mappings/characterMapping';
import { useApiKey } from '@/common/hooks/useApiKey';

export function useCharacterById(id: string | undefined) {
  const { apiKey, isLoaded } = useApiKey();
  const query = useQuery<CharacterWithRelations | null>({
    queryKey: createCharacterByIdKey(id ?? '', apiKey),
    queryFn: () => client.searchById<CharacterWithRelations | null>(id!, characterQueryById),
    enabled: Boolean(id) && isLoaded,
    staleTime: 5_000,
  });
  const character = useMemo(() => query.data ? toCharacter(query.data) : null, [query.data]);
  return { ...query, character };
}
