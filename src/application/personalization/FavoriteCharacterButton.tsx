"use client";

import { MouseEvent } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/ui/button';
import { usePersonalization } from '@/common/hooks/usePersonalization';

type FavoriteCharacterButtonProps = 
{
  characterId: string;
  showLabel?: boolean;
};

export default function FavoriteCharacterButton({ characterId, showLabel = false }: FavoriteCharacterButtonProps)
{
  const { hasApiKey, profile, toggleFavoriteCharacter } = usePersonalization();
  const isFavorite = profile.favoriteCharacterIds.includes(characterId);
  const isMainCharacter = profile.mainCharacterId === characterId;

  if (showLabel && isMainCharacter)
  {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) =>
  {
    event.preventDefault();
    event.stopPropagation();
    toggleFavoriteCharacter(characterId);
  };

  return (
    <Button
      type="button"
      variant={isFavorite ? 'default' : 'outline'}
      size={showLabel ? 'sm' : 'icon'}
      onClick={handleClick}
      disabled={!hasApiKey}
      aria-label={isFavorite ? 'Remove favorite character' : 'Add favorite character'}
      title={hasApiKey ? (isFavorite ? 'Usun z ulubionych' : 'Dodaj do ulubionych') : 'Ustaw API key aby zapisac ulubione'}
      className={showLabel ? 'gap-2' : undefined}
    >
      <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
      {showLabel ? (isFavorite ? 'Ulubiona' : 'Ulubione') : null}
    </Button>
  );
}