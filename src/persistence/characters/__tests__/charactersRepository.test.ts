import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetailsDto } from '@/persistence/schemas/characters/headerSchema';

const { characterFindUnique, characterUpdate, raceFindUnique, perkFindMany } = vi.hoisted(() => ({
  characterFindUnique: vi.fn(),
  characterUpdate: vi.fn(),
  raceFindUnique: vi.fn(),
  perkFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    character: { findUnique: characterFindUnique, update: characterUpdate },
    race: { findUnique: raceFindUnique },
    perk: { findMany: perkFindMany },
  },
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys: ['VALID-KEY-1', 'VALID-KEY-2'],
}));

import { updateCharacterDetails } from '@/persistence/characters/charactersRepository';
import { CharacterValidationError } from '@/persistence/characters/characterErrors';

function detailsPayload(overrides: Partial<DetailsDto> = {}): DetailsDto
{
  return {
    name: 'Postać testowa',
    shortName: 'Test',
    description: 'Opis postaci',
    tags: [],
    perks: [],
    ...overrides,
  };
}

describe('updateCharacterDetails - apiKeys pool validation', () => {
  beforeEach(() => {
    characterFindUnique.mockReset();
    characterUpdate.mockReset();
    raceFindUnique.mockReset();
    perkFindMany.mockReset();

    characterFindUnique.mockResolvedValue({ perksIds: [], raceId: null });
    characterUpdate.mockResolvedValue({ id: 'character-1' });
    perkFindMany.mockResolvedValue([]);
  });

  it('throws CharacterValidationError when an apiKey is not part of the configured admin pool', async () => {
    await expect(
      updateCharacterDetails('character-1', detailsPayload({ apiKeys: ['NOT-A-REAL-KEY'] })),
    ).rejects.toThrow(CharacterValidationError);

    expect(characterUpdate).not.toHaveBeenCalled();
  });

  it('includes the offending key(s) in the error message', async () => {
    await expect(
      updateCharacterDetails('character-1', detailsPayload({ apiKeys: ['VALID-KEY-1', 'BOGUS'] })),
    ).rejects.toThrow('BOGUS');
  });

  it('allows apiKeys that are part of the configured admin pool', async () => {
    const result = await updateCharacterDetails('character-1', detailsPayload({ apiKeys: ['VALID-KEY-1', 'VALID-KEY-2'] }));

    expect(result).toBe(true);
    expect(characterUpdate).toHaveBeenCalledTimes(1);
  });

  it('allows an empty apiKeys array (character stays public)', async () => {
    const result = await updateCharacterDetails('character-1', detailsPayload({ apiKeys: [] }));

    expect(result).toBe(true);
    expect(characterUpdate).toHaveBeenCalledTimes(1);
  });

  it('allows omitting apiKeys entirely', async () => {
    const result = await updateCharacterDetails('character-1', detailsPayload());

    expect(result).toBe(true);
    expect(characterUpdate).toHaveBeenCalledTimes(1);
  });

  it('throws CharacterValidationError when raceId does not exist', async () => {
    raceFindUnique.mockResolvedValue(null);

    await expect(
      updateCharacterDetails('character-1', detailsPayload({ raceId: 'missing-race' })),
    ).rejects.toThrow(CharacterValidationError);

    expect(characterUpdate).not.toHaveBeenCalled();
  });

  it('returns false when the character does not exist', async () => {
    characterFindUnique.mockResolvedValue(null);

    const result = await updateCharacterDetails('missing-character', detailsPayload());

    expect(result).toBe(false);
    expect(characterUpdate).not.toHaveBeenCalled();
  });
});
