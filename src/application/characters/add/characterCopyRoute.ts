export type CharacterCreationMode = 'scratch' | 'copy' | 'ai';

export type CharacterCreationInitialState = {
  initialMode?: CharacterCreationMode;
  initialSelectedCharacterId?: string;
};

const copyMode: CharacterCreationMode = 'copy';

const getFirstParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const createCharacterCopyHref = (characterId: string) => {
  const params = new URLSearchParams({
    mode: copyMode,
    id: characterId,
  });

  return `/characters/add?${params.toString()}`;
};

export const getInitialCharacterCreationState = (
  searchParams: { [key: string]: string | string[] | undefined },
): CharacterCreationInitialState => {
  const mode = getFirstParamValue(searchParams.mode);
  const selectedCharacterId = getFirstParamValue(searchParams.id);

  if (mode !== copyMode || !selectedCharacterId) {
    return {};
  }

  return {
    initialMode: copyMode,
    initialSelectedCharacterId: selectedCharacterId,
  };
};
