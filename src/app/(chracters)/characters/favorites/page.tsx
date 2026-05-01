"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import MainCharacterBadge from '@/application/personalization/MainCharacterBadge';
import FavoriteCharacterButton from '@/application/personalization/FavoriteCharacterButton';
import { useFavoriteCharacters } from '@/application/personalization/useFavoriteCharacters';
import { usePersonalization } from '@/common/hooks/usePersonalization';

export default function FavoriteCharactersPage()
{
  const { hasApiKey, isLoaded, profile } = usePersonalization();
  const { favoriteCharacters, isLoading } = useFavoriteCharacters();
  const sortedFavoriteCharacters = useMemo(
    () => favoriteCharacters
      .map((character, index) => ({ character, index }))
      .sort((left, right) => {
        const leftIsMain = left.character.id === profile.mainCharacterId;
        const rightIsMain = right.character.id === profile.mainCharacterId;

        if (leftIsMain === rightIsMain) {
          return left.index - right.index;
        }

        return leftIsMain ? -1 : 1;
      })
      .map(({ character }) => character),
    [favoriteCharacters, profile.mainCharacterId],
  );

  if (!isLoaded)
  {
    return null;
  }

  if (!hasApiKey)
  {
    return (
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <h1 className="text-4xl font-bold">Ulubione postacie</h1>
        <p className="mt-4 text-muted-foreground">Ustaw API key, aby wczytac profil personalizacji i ulubione postacie.</p>
      </div>
    );
  }

  if (profile.favoriteCharacterIds.length === 0)
  {
    return (
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <h1 className="text-4xl font-bold">Ulubione postacie</h1>
        <p className="mt-4 text-muted-foreground">Nie zapisano jeszcze zadnych ulubionych postaci.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Ulubione postacie</h1>
        <p className="mt-2 text-muted-foreground">Twoja zapisna lista postaci dla aktywnego API key.</p>
      </div>

      {
        isLoading ? <p className="text-muted-foreground">Ładowanie postaci...</p> : (
          <div className="space-y-4">
            {
              sortedFavoriteCharacters.map(character => (
                <div key={character.id} className="relative rounded-lg border p-5">
                  <div className="absolute inset-y-0 right-4 z-10 flex items-center">
                    <FavoriteCharacterButton characterId={character.id} />
                  </div>

                  <Link href={`/characters/${character.id}`} className="block pr-16">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold">{character.name}</h2>
                      {
                        profile.mainCharacterId === character.id && (
                          <MainCharacterBadge characterLabel={character.name} />
                        )
                      }
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{character.shortName}</p>
                  </Link>
                </div>
              ))
            }
          </div>
        )
      }
    </div>
  );
}