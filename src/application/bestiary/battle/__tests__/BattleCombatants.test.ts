import { describe, expect, it } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import {
  createDuplicatedCharacter,
  DuplicatedCharacter,
  restoreDuplicatedCharacter,
} from '@/application/bestiary/battle/BattleCombatants';

function buildCharacter()
{
  return CreateEmptyCharacter({
    name: 'Dragon',
    shortName: 'Drg',
    tags: [],
    description: 'A dragon',
  });
}

describe('createDuplicatedCharacter', () => {
  it('numbers the first duplicate as 2 and renames the character', () => {
    const source = buildCharacter();

    const duplicate = createDuplicatedCharacter(source, []);

    expect(duplicate.duplicateNumber).toBe(2);
    expect(duplicate.character.name).toBe('Dragon 2');
    expect(duplicate.character.shortName).toBe('Drg2');
    expect(duplicate.originalCharacterId).toBe(source.id);
    expect(duplicate.isDuplicate).toBe(true);
  });

  it('numbers subsequent duplicates after the highest existing one for the same original', () => {
    const source = buildCharacter();
    const existing: DuplicatedCharacter[] = [
      createDuplicatedCharacter(source, []),
      createDuplicatedCharacter(source, []),
    ];
    // Force a known max, since ids/timestamps in createDuplicatedCharacter are non-deterministic
    existing[0].duplicateNumber = 2;
    existing[1].duplicateNumber = 3;

    const duplicate = createDuplicatedCharacter(source, existing);

    expect(duplicate.duplicateNumber).toBe(4);
    expect(duplicate.character.name).toBe('Dragon 4');
  });

  it('does not mutate the source character', () => {
    const source = buildCharacter();
    const originalName = source.name;

    createDuplicatedCharacter(source, []);

    expect(source.name).toBe(originalName);
  });
});

describe('restoreDuplicatedCharacter', () => {
  it('rebuilds the duplicate using the ref id and duplicateNumber verbatim, not regenerated ones', () => {
    const source = buildCharacter();
    const ref = { id: 'dup_fixed_id', originalCharacterId: source.id, duplicateNumber: 5 };

    const restored = restoreDuplicatedCharacter(source, ref);

    expect(restored.id).toBe('dup_fixed_id');
    expect(restored.duplicateNumber).toBe(5);
    expect(restored.originalCharacterId).toBe(source.id);
    expect(restored.character.name).toBe('Dragon 5');
    expect(restored.character.shortName).toBe('Drg5');
  });

  it('reflects the current character data, not a frozen snapshot (e.g. an updated description)', () => {
    const source = buildCharacter();
    source.description = 'Updated after the preset was saved';
    const ref = { id: 'dup_fixed_id', originalCharacterId: source.id, duplicateNumber: 2 };

    const restored = restoreDuplicatedCharacter(source, ref);

    expect(restored.character.description).toBe('Updated after the preset was saved');
  });
});
