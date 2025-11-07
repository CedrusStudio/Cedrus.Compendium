"use client";

import { useState } from 'react';

export type CharacterCreationMode = 'scratch' | 'copy';

export const useCharacterCreationMode = () => 
{
  const [mode, setMode] = useState<CharacterCreationMode>('scratch');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>();

  const switchToScratch = () => 
  {
    setMode('scratch');
    setSelectedCharacterId(undefined);
  };

  const switchToCopy = () => 
  {
    setMode('copy');
  };

  const selectBaseCharacter = (characterId: string) => 
  {
    setSelectedCharacterId(characterId);
  };

  const resetMode = () => 
  {
    setMode('scratch');
    setSelectedCharacterId(undefined);
  };

  return {
    mode,
    selectedCharacterId,
    switchToScratch,
    switchToCopy,
    selectBaseCharacter,
    resetMode,
  };
};
