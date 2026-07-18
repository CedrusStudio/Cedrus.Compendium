import { describe, expect, it, vi } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { restoreDuplicatedCharacterRefs, toBattleConfiguration } from '@/application/battlePresets/battleConfigurationMapping';
import { createExternalParticipant } from '@/application/bestiary/battle/BattleCombatants';

describe('toBattleConfiguration', () => {
  it('maps the live bestiary state into a BattleConfiguration, reducing duplicates to lightweight refs', () => {
    const externalParticipant = createExternalParticipant('Goblin', 30, 3, 1, 'notes');

    const configuration = toBattleConfiguration({
      addedToBattle: ['char-1', 'char-2'],
      initiatives: { 'char-1': { initiative: 15 } },
      externalParticipants: [externalParticipant],
      duplicatedCharacters: [
        {
          id: 'dup-1',
          originalCharacterId: 'char-1',
          duplicateNumber: 2,
          isDuplicate: true,
          character: CreateEmptyCharacter({ name: 'Dragon', shortName: 'Drg', tags: [], description: '' }),
        },
      ],
    });

    expect(configuration).toEqual({
      characterIds: ['char-1', 'char-2'],
      initiatives: { 'char-1': { initiative: 15 } },
      externalParticipants: [externalParticipant],
      duplicatedCharacterRefs: [{ id: 'dup-1', originalCharacterId: 'char-1', duplicateNumber: 2 }],
    });
  });
});

describe('restoreDuplicatedCharacterRefs', () => {
  it('rebuilds duplicates using the current character data for each ref', () => {
    const currentCharacter = CreateEmptyCharacter({ name: 'Dragon', shortName: 'Drg', tags: [], description: 'refreshed' });

    const restored = restoreDuplicatedCharacterRefs(
      [{ id: 'dup-1', originalCharacterId: currentCharacter.id, duplicateNumber: 3 }],
      [currentCharacter],
    );

    expect(restored).toHaveLength(1);
    expect(restored[0]).toEqual(expect.objectContaining({
      id: 'dup-1',
      originalCharacterId: currentCharacter.id,
      duplicateNumber: 3,
    }));
    expect(restored[0].character.description).toBe('refreshed');
  });

  it('skips a ref whose original character is missing instead of throwing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const restored = restoreDuplicatedCharacterRefs(
      [{ id: 'dup-1', originalCharacterId: 'char-missing', duplicateNumber: 2 }],
      [],
    );

    expect(restored).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns an empty array when there are no refs', () => {
    expect(restoreDuplicatedCharacterRefs([], [])).toEqual([]);
  });
});
