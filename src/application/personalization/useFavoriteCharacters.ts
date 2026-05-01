"use client";

import { useQuery } from '@tanstack/react-query';
import charactersClient from '@/infrastructure/clients/charactersClient';
import { Character } from '@/domain/characters/Character';
import { usePersonalization } from '@/common/hooks/usePersonalization';

const EMPTY_CHARACTERS: Character[] = [];

export function useFavoriteCharacters()
{
  const { hasApiKey, profile } = usePersonalization();
  const favoriteCharacterIds = profile.favoriteCharacterIds;

  const { data, isLoading, error } = useQuery<Character[]>
  ({
    queryKey: ['personalization', 'favoriteCharacters', favoriteCharacterIds.join(',')],
    queryFn: async () =>
    {
      if (favoriteCharacterIds.length === 0) return EMPTY_CHARACTERS;
      return await charactersClient.getByIds(favoriteCharacterIds);
    },
    staleTime: 5_000,
    enabled: hasApiKey && favoriteCharacterIds.length > 0,
  });

  return { favoriteCharacters: data ?? EMPTY_CHARACTERS, isLoading, error };
}