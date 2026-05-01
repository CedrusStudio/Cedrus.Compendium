"use client";

import { MouseEvent } from 'react';
import { Button } from '@/ui/button';
import { mainCharacterIcon } from '@/common/icons';
import { usePersonalization } from '@/common/hooks/usePersonalization';

type MainCharacterButtonProps = {
  characterId: string;
  showLabel?: boolean;
};

export default function MainCharacterButton({ characterId, showLabel = false }: MainCharacterButtonProps)
{
  const { hasApiKey, profile, addFavoriteCharacter, setMainCharacter } = usePersonalization();
  const isMainCharacter = profile.mainCharacterId === characterId;
  const isFavoriteCharacter = profile.favoriteCharacterIds.includes(characterId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) =>
  {
    event.preventDefault();
    event.stopPropagation();

    if (!isMainCharacter && !isFavoriteCharacter) {
      addFavoriteCharacter(characterId);
    }

    setMainCharacter(isMainCharacter ? undefined : characterId);
  };

  return (
    <Button
      type="button"
      variant={isMainCharacter ? 'default' : 'outline'}
      size={showLabel ? 'sm' : 'icon'}
      onClick={handleClick}
      disabled={!hasApiKey}
      aria-label={isMainCharacter ? 'Unset main character' : 'Set main character'}
      title={hasApiKey ? (isMainCharacter ? 'Usun glowna postac' : 'Ustaw jako glowna postac') : 'Ustaw API key aby zapisac glowna postac'}
      className={showLabel ? 'gap-2' : undefined}
    >
      {mainCharacterIcon('h-4 w-4')}
      {showLabel ? 'Main' : null}
    </Button>
  );
}