"use client";

import { useState } from 'react';

import { CharacterCreationInitialState, CharacterCreationMode } from '@/application/characters/add/characterCopyRoute';

export const useCharacterCreationMode = ({ initialMode, initialSelectedCharacterId }: CharacterCreationInitialState = {}) => 
{
  const [mode, setMode] = useState<CharacterCreationMode>(
    initialMode === 'copy' && initialSelectedCharacterId ? 'copy' : 'scratch'
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(
    initialMode === 'copy' ? initialSelectedCharacterId : undefined
  );

  const switchToScratch = () => 
  {
    setMode('scratch');
    setSelectedCharacterId(undefined);
  };

  const switchToCopy = () => 
  {
    setMode('copy');
  };

  const switchToAi = () =>
  {
    setMode('ai');
    setSelectedCharacterId(undefined);
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
    switchToAi,
    selectBaseCharacter,
    resetMode,
  };
};
