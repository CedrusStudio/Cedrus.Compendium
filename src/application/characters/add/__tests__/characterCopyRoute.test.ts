import { describe, expect, it } from 'vitest';

import { createCharacterCopyHref, getInitialCharacterCreationState } from '../characterCopyRoute';

describe('characterCopyRoute', () => {
  it('creates a copy-mode href for the selected base character', () => {
    expect(createCharacterCopyHref('character-1')).toBe('/characters/add?mode=copy&id=character-1');
  });

  it('extracts the initial copy state from add-page search params', () => {
    expect(getInitialCharacterCreationState({ mode: 'copy', id: 'character-1' })).toEqual({
      initialMode: 'copy',
      initialSelectedCharacterId: 'character-1',
    });
  });

  it('ignores incomplete or invalid copy-mode params', () => {
    expect(getInitialCharacterCreationState({ mode: 'copy' })).toEqual({});
    expect(getInitialCharacterCreationState({ mode: 'scratch', id: 'character-1' })).toEqual({});
  });
});