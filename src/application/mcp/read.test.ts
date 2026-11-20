import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AI_CATALOG_KINDS, type AiCatalogKind } from '@/domain/ai-character-generation/catalogKinds';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { getCharactersVisibleToApiKeyByIds } from '@/persistence/characters/charactersRepository';
import { readEntry, searchEntries } from './read';

const { queryCatalog, queryCharacters } = vi.hoisted(() => ({
  queryCatalog: vi.fn(), queryCharacters: vi.fn(),
}));
vi.mock('@/lib/prisma', async () => {
  const { AI_CATALOG_KINDS } = await import('@/domain/ai-character-generation/catalogKinds');
  const models = Object.fromEntries(AI_CATALOG_KINDS.map(kind => [
    kind, { findMany: (args: unknown) => queryCatalog(kind, args) },
  ]));
  return { default: { ...models, character: { findMany: queryCharacters } } };
});
vi.mock('@/persistence/characters/charactersRepository', () => ({ getCharactersVisibleToApiKeyByIds: vi.fn() }));

const key = 'test-key';
const hrefs: Record<AiCatalogKind, string> = {
  race: 'races', perk: 'perks', maneuver: 'maneuvers', stance: 'stances', state: 'states', spell: 'spells',
  powerSpecification: 'powers', weapon: 'equipment/weapons', armor: 'equipment/armors', shield: 'equipment/shields',
  inventoryItem: 'equipment/inventory', mount: 'equipment/mounts',
};
const card = CreateEmptyCharacter({ name: 'Guard', shortName: 'G', description: 'City guard', tags: ['guard'] });
const row = { id: 'entry', name: 'Gate guard', description: 'Full description', tags: ['guard'] };

describe('Compendium reads from chat', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(AI_CATALOG_KINDS)('searches the %s category and opens its hit by ID', async kind => {
    queryCatalog.mockResolvedValue([row]);
    const [hit] = await searchEntries({ kind, query: 'gate', tag: 'guard', limit: 2, offset: 4 }, key);
    const href = '/compendium/' + hrefs[kind];
    expect(hit).toMatchObject({ kind, id: row.id, name: row.name, tags: row.tags, href });
    expect(queryCatalog).toHaveBeenCalledWith(kind, expect.objectContaining({
      where: { name: { contains: 'gate', mode: 'insensitive' }, tags: { has: 'guard' } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: 4, take: 2,
    }));
    const detail = await readEntry({ kind, id: hit.id }, key);
    expect(detail).toMatchObject({ kind, id: row.id, description: row.description, href });
    expect(queryCatalog).toHaveBeenLastCalledWith(kind, expect.objectContaining({
      where: { id: row.id }, skip: 0, take: 1,
    }));
  });

  it('checks catalog requirements against the visible character selected by the caller', async () => {
    queryCatalog.mockResolvedValue([{ ...row, structuredRequirements: [
      { kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 2 },
      { kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 30 },
    ] }]);
    const guard = { ...card, id: 'guard', characteristics: { ...card.characteristics,
      strength: { ...card.characteristics.strength, value: 5, bonus: 0, testBonus: 0 } } };
    vi.mocked(getCharactersVisibleToApiKeyByIds).mockResolvedValueOnce([guard]).mockResolvedValueOnce([]);
    const entry = { kind: 'perk', id: row.id, forCharacterId: guard.id } as const;
    await expect(readEntry(entry, key)).resolves.toMatchObject({ characterId: guard.id, requirementChecks: [
      { text: expect.any(String), met: true }, { text: expect.any(String), met: false },
    ] });
    await expect(readEntry(entry, 'other')).rejects.toMatchObject({ status: 404 });
    expect(getCharactersVisibleToApiKeyByIds).toHaveBeenLastCalledWith([guard.id], 'other');
  });

  it('returns a visible character link and includes only the requested card sections', async () => {
    const guard = { ...card, id: 'guard', apiKeys: [key] };
    queryCharacters.mockResolvedValue([{ id: guard.id, name: guard.name, shortName: guard.shortName, tags: guard.tags }]);
    const [hit] = await searchEntries({ kind: 'character', query: 'Guard', limit: 1, offset: 0 }, key);
    expect(hit).toMatchObject({ id: guard.id, name: guard.name, href: '/characters/guard' });
    vi.mocked(getCharactersVisibleToApiKeyByIds).mockResolvedValue([guard]);
    const entry = { kind: 'character', id: hit.id } as const;
    await expect(readEntry(entry, key)).resolves.toEqual({
      ...entry, name: guard.name, href: '/characters/guard', overview: expect.objectContaining({ description: guard.description }),
    });
    await expect(readEntry({ ...entry, sections: ['statistics', 'equipment'] }, key)).resolves.toEqual({
      ...entry, name: guard.name, href: '/characters/guard',
      statistics: { characteristics: guard.characteristics, attributes: guard.attributes },
      equipment: expect.objectContaining({
        weapons: guard.equipment.weapons.map(({ id, name }) => ({ id, name })),
      }),
    });
  });
});
