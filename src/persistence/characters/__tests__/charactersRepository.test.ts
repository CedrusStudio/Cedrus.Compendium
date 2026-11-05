import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraftCatalog, createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';

import type { DetailsDto } from '@/persistence/schemas/characters/headerSchema';

const { characterFindUnique, characterFindMany, characterUpdate, characterCreate, characterDelete, raceFindUnique, perkFindMany, weaponFindMany } = vi.hoisted(() => ({
  characterFindUnique: vi.fn(),
  characterFindMany: vi.fn(),
  characterUpdate: vi.fn(),
  characterCreate: vi.fn(),
  characterDelete: vi.fn(),
  weaponFindMany: vi.fn(),
  raceFindUnique: vi.fn(),
  perkFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    character: { findUnique: characterFindUnique, findMany: characterFindMany, update: characterUpdate, create: characterCreate, delete: characterDelete },
    weapon: { findMany: weaponFindMany },
    race: { findUnique: raceFindUnique },
    perk: { findMany: perkFindMany },
  },
}));

vi.mock('@/lib/env', () => ({
  adminApiKeys: ['VALID-KEY-1', 'VALID-KEY-2'],
}));

import {
  addCharacter, deleteCharacter, getCharactersByIds, getCharactersVisibleToApiKeyByIds,
  updateCharacterBuffs, updateCharacterDetails, updateCharacterEquipment, updateCharacterStatistics, updateCharacterTalents,
} from '@/persistence/characters/charactersRepository';
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
    characterFindMany.mockReset();
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

  const perk = (id: string) => ({ id, name: id, grade: 8, price: 1, description: 'Opis', tags: [] });
  const largeSheet = () => Array.from({ length: 100 }, (_, index) => perk(index === 0 ? 'Większy Fechtunek' : `perk-${index}`));

  it('removes one perk from a large character without rewriting the remaining 99', async () => {
    const original = largeSheet();
    const remaining = original.slice(1);
    characterFindUnique.mockResolvedValue({ perksIds: original.map(item => item.id), raceId: null });
    perkFindMany.mockResolvedValue(remaining.map(item => ({ ...item, structuredRequirements: null, replaces: [] })));
    await updateCharacterDetails('character-1', detailsPayload({ perks: remaining, raceId: null }));
    expect(characterUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      perks: { create: [], update: [], connect: [], disconnect: [{ id: original[0].id }] },
    }) }));
    expect(characterUpdate.mock.calls[0][0].data).not.toHaveProperty('race');
    expect(perkFindMany).toHaveBeenCalledOnce();
  });

  it('adds two library perks without rewriting 100 unchanged perks', async () => {
    const original = largeSheet();
    const additions = [perk('Większy Fechtunek 8'), perk('Większy Fortel 8')];
    const incoming = [...original, ...additions];
    characterFindUnique.mockResolvedValue({ perksIds: original.map(item => item.id), raceId: null });
    perkFindMany.mockResolvedValue(incoming);
    await updateCharacterDetails('character-1', detailsPayload({ perks: incoming }));
    expect(characterUpdate.mock.calls[0][0].data.perks).toEqual({
      create: [], update: [], disconnect: [], connect: additions.map(({ id }) => ({ id })),
    });
  });

  it('does not touch relations for a header-only save with a large unchanged repertoire', async () => {
    const original = largeSheet();
    characterFindUnique.mockResolvedValue({ perksIds: original.map(item => item.id), raceId: 'race' });
    perkFindMany.mockResolvedValue(original);
    await updateCharacterDetails('character-1', detailsPayload({ perks: original, raceId: 'race' }));
    expect(characterUpdate.mock.calls[0][0].data).not.toHaveProperty('perks');
    expect(characterUpdate.mock.calls[0][0].data).not.toHaveProperty('race');
    expect(raceFindUnique).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'Nowa nazwa' }, { grade: 9 }, { price: 2 }, { description: 'Zmieniony opis' },
    { tags: ['magiczne'] }, { replaces: ['Stary atut'] },
    { structuredRequirements: [{ kind: 'rankless' as const, text: 'Lekka zbroja' }] },
  ])('preserves a genuine perk edit (%j) while skipping every other perk', async change => {
    const original = largeSheet();
    characterFindUnique.mockResolvedValue({ perksIds: original.map(item => item.id), raceId: null });
    perkFindMany.mockResolvedValue(original);
    await updateCharacterDetails('character-1', detailsPayload({ perks: original.map((item, index) => index === 3 ? { ...item, ...change } : item) }));
    expect(characterUpdate.mock.calls[0][0].data.perks.update).toEqual([
      { where: { id: original[3].id }, data: expect.objectContaining(change) },
    ]);
  });

  it('still creates a new custom perk', async () => {
    const incoming = perk('custom-perk');
    await updateCharacterDetails('character-1', detailsPayload({ perks: [incoming] }));
    expect(characterUpdate.mock.calls[0][0].data.perks).toEqual({ create: [incoming], update: [], connect: [], disconnect: [] });
  });

  it('preserves explicit removal of requirements while leaving omitted optional fields unchanged', async () => {
    const original = perk('perk');
    const stored = { ...original, structuredRequirements: [{ kind: 'rankless', text: 'Lekka zbroja' }], replaces: ['Inny atut'] };
    characterFindUnique.mockResolvedValue({ perksIds: [original.id], raceId: null });
    perkFindMany.mockResolvedValue([stored]);
    await updateCharacterDetails('character-1', detailsPayload({ perks: [original] }));
    expect(characterUpdate.mock.calls[0][0].data).not.toHaveProperty('perks');
    characterUpdate.mockClear();
    await updateCharacterDetails('character-1', detailsPayload({ perks: [{ ...original, structuredRequirements: [] }] }));
    expect(characterUpdate.mock.calls[0][0].data.perks.update).toHaveLength(1);
    expect(characterUpdate.mock.calls[0][0].data.perks.update[0].data.structuredRequirements).toEqual([]);
  });
});

describe('getCharactersVisibleToApiKeyByIds', () => {
  beforeEach(() => {
    characterFindMany.mockReset();
    characterFindMany.mockResolvedValue([]);
  });

  it('pushes the API-key visibility predicate into the database query', async () => {
    await expect(
      getCharactersVisibleToApiKeyByIds(['character-1', 'character-2'], 'VALID-KEY-1'),
    ).resolves.toEqual([]);

    expect(characterFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: [
          { id: { in: ['character-1', 'character-2'] } },
          { OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: 'VALID-KEY-1' } }] },
        ],
      },
    }));
  });
});

describe('character sheet write boundaries', () => {
  const target = 'character-1';
  const sheet = () => createPendingDraft().proposal!;

  beforeEach(() => {
    characterFindUnique.mockReset();
    characterFindMany.mockReset().mockResolvedValue([]);
    characterUpdate.mockReset().mockResolvedValue({ id: target });
    characterCreate.mockReset().mockResolvedValue({ id: 'created-character' });
    characterDelete.mockReset().mockResolvedValue({ id: target });
    weaponFindMany.mockReset();
  });

  it('does not query for empty IDs and reads only the requested IDs otherwise', async () => {
    await expect(getCharactersByIds([])).resolves.toEqual([]);
    await expect(getCharactersVisibleToApiKeyByIds([], 'VALID-KEY-1')).resolves.toEqual([]);
    expect(characterFindMany).not.toHaveBeenCalled();
    await expect(getCharactersByIds([target])).resolves.toEqual([]);
    expect(characterFindMany).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      where: { id: { in: [target] } }, include: expect.objectContaining({ perks: true, spells: true }),
    }));
  });

  it('returns the created ID and uses the requested ID for deletion', async () => {
    const { header } = sheet();
    await expect(addCharacter(header)).resolves.toBe('created-character');
    expect(characterCreate).toHaveBeenCalledExactlyOnceWith({
      data: expect.objectContaining({
        name: header.name, shortName: header.shortName,
        defaultOffenseId: expect.any(String), defaultDefenseId: expect.any(String),
      }),
    });
    await expect(deleteCharacter(target)).resolves.toBeUndefined();
    expect(characterDelete).toHaveBeenCalledExactlyOnceWith({ where: { id: target } });
  });

  it('saves each independent section as its own update', async () => {
    const { statistics, talents, buffs } = sheet();
    await expect(updateCharacterStatistics(target, statistics)).resolves.toBe(true);
    await expect(updateCharacterTalents(target, talents)).resolves.toBe(true);
    await expect(updateCharacterBuffs(target, buffs)).resolves.toBe(true);
    expect(characterUpdate.mock.calls).toEqual([statistics, talents, buffs].map(data => [{ where: { id: target }, data }]));
  });

  it('returns false without writing equipment for a missing character', async () => {
    characterFindUnique.mockResolvedValue(null);
    await expect(updateCharacterEquipment(target, sheet().equipment)).resolves.toBe(false);
    expect(characterUpdate).not.toHaveBeenCalled();
    expect(weaponFindMany).not.toHaveBeenCalled();
  });

  it('connects existing equipment, creates custom items and disconnects removed items', async () => {
    const c = createDraftCatalog();
    const stored = { ...c.weapon, id: 'already-owned', name: 'Włócznia po naprawie' };
    const custom = { ...c.weapon, id: 'custom-weapon', name: 'Włócznia z herbem' };
    characterFindUnique.mockResolvedValue({
      weaponsIds: [stored.id, 'removed-weapon'], armorsIds: [], shieldsIds: [], inventoryIds: [], mountsIds: [],
    });
    weaponFindMany.mockResolvedValue([{ id: c.weapon.id }]);

    await expect(updateCharacterEquipment(target, { ...sheet().equipment, weapons: [stored, c.weapon, custom] })).resolves.toBe(true);
    expect(weaponFindMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: { in: [c.weapon.id, custom.id] } }, select: { id: true },
    });
    expect(characterUpdate).toHaveBeenCalledExactlyOnceWith({
      where: { id: target },
      data: expect.objectContaining({
        weapons: {
          update: [{ where: { id: stored.id }, data: { ...stored, id: undefined } }],
          connect: [{ id: c.weapon.id }],
          create: [custom],
          disconnect: [{ id: 'removed-weapon' }],
        },
      }),
    });
  });
});
