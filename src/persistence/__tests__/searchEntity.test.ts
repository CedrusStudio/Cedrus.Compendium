import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTagFacetIndex } from '@/domain/tags/tagFacets';
import type { SearchEntityPayload, SearchByIdEntityPayload } from '@/common/global/SearchPayloads';

const { characterFindMany, characterFindUnique, spellFindMany, maneuverFindMany, spellFindUnique, spellAggregate, maneuverAggregate, loadTagFacetIndex } = vi.hoisted(() => ({
  characterFindMany: vi.fn(),
  characterFindUnique: vi.fn(),
  spellFindMany: vi.fn(),
  maneuverFindMany: vi.fn(),
  spellFindUnique: vi.fn(),
  spellAggregate: vi.fn(),
  maneuverAggregate: vi.fn(),
  loadTagFacetIndex: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    character: { findMany: characterFindMany, findUnique: characterFindUnique },
    spell: { findMany: spellFindMany, findUnique: spellFindUnique, aggregateRaw: spellAggregate },
    maneuver: { findMany: maneuverFindMany, aggregateRaw: maneuverAggregate },
  },
}));

vi.mock('@/persistence/tags/tagFacetLayer', () => ({ loadTagFacetIndexForFiltering: loadTagFacetIndex }));

import { searchEntity, searchEntityById } from '@/persistence/searchEntity';

// Note: pagination is intentionally omitted from these payloads. Cursor-based
// pagination merges an extra `{ id: { gt: cursor } }` AND member (see
// createKeysetPagination in src/common/global/pagination.ts), which is
// unrelated to the visibility filter under test here and would only make the
// `where` assertions noisier.
function characterListPayload(overrides: Partial<SearchEntityPayload> = {}): SearchEntityPayload
{
  return {
    entity: 'character',
    select: { id: true, name: true },
    ...overrides,
  } as SearchEntityPayload;
}

describe('searchEntity - character visibility', () => {
  beforeEach(() => {
    characterFindMany.mockReset();
    characterFindUnique.mockReset();
    spellFindMany.mockReset();
    maneuverFindMany.mockReset();
    characterFindMany.mockResolvedValue([]);
    spellFindMany.mockResolvedValue([]);
    maneuverFindMany.mockResolvedValue([]);
  });

  it('filters public characters (isEmpty) when no API key is provided', async () => {
    await searchEntity(characterListPayload(), null);

    const where = characterFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ apiKeys: { isEmpty: true } });
  });

  it('filters public-or-matching characters (OR) when an API key is provided', async () => {
    await searchEntity(characterListPayload(), 'ABC');

    const where = characterFindMany.mock.calls[0][0].where;
    expect(where).toEqual
    ({
      OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: 'ABC' } }],
    });
  });

  it('combines the visibility condition with user search/exclude filters via AND', async () => {
    await searchEntity
    (
      characterListPayload
      ({
        search: { name: 'Geralt' },
        exclude: { tags: ['npc'] },
      }),
      'ABC'
    );

    const where = characterFindMany.mock.calls[0][0].where;
    expect(where.AND).toHaveLength(3);
    expect(where.AND).toEqual(expect.arrayContaining
    ([
      { name: { contains: 'Geralt', mode: 'insensitive' } },
      { NOT: { tags: { hasSome: ['npc'] } } },
      { OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: 'ABC' } }] },
    ]));
  });

  it('mode "publicOnly": filters to public characters (isEmpty) even with an API key present', async () => {
    await searchEntity(characterListPayload({ characterVisibilityMode: 'publicOnly' }), 'ABC');

    const where = characterFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ apiKeys: { isEmpty: true } });
  });

  it('mode "mineOnly": filters to characters scoped to the current API key only (no OR with public)', async () => {
    await searchEntity(characterListPayload({ characterVisibilityMode: 'mineOnly' }), 'ABC');

    const where = characterFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ apiKeys: { has: 'ABC' } });
  });

  it('mode "mineOnly" without an API key short-circuits to an empty result without querying the database', async () => {
    const result = await searchEntity(characterListPayload({ characterVisibilityMode: 'mineOnly' }), null);

    expect(result).toEqual([]);
    expect(characterFindMany).not.toHaveBeenCalled();
  });

  it('mode "mineOnly" with a blank API key short-circuits the same as no key', async () => {
    const result = await searchEntity(characterListPayload({ characterVisibilityMode: 'mineOnly' }), '   ');

    expect(result).toEqual([]);
    expect(characterFindMany).not.toHaveBeenCalled();
  });

  it('omitting characterVisibilityMode behaves the same as mode "all" (regression)', async () => {
    await searchEntity(characterListPayload(), 'ABC');

    const where = characterFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: 'ABC' } }] });
  });

  it('does not apply the visibility condition to non-character entities', async () => {
    const payload: SearchEntityPayload =
    {
      entity: 'spell',
      select: { id: true },
    } as SearchEntityPayload;

    await searchEntity(payload, 'ABC');

    const where = spellFindMany.mock.calls[0][0].where;
    expect(where).toBeUndefined();
  });

  it('leaves other entities (maneuver) untouched even with an API key present', async () => {
    const payload: SearchEntityPayload =
    {
      entity: 'maneuver',
      select: { id: true },
      search: { name: 'Cios' },
    } as SearchEntityPayload;

    await searchEntity(payload, 'ABC');

    const where = maneuverFindMany.mock.calls[0][0].where;
    expect(where).toEqual({ name: { contains: 'Cios', mode: 'insensitive' } });
  });

  it('ignores characterVisibilityMode for non-character entities instead of erroring', async () => {
    const payload: SearchEntityPayload =
    {
      entity: 'spell',
      select: { id: true },
      characterVisibilityMode: 'mineOnly',
    } as SearchEntityPayload;

    const result = await searchEntity(payload, null);

    expect(result).toEqual([]);
    expect(spellFindMany).toHaveBeenCalledTimes(1);
  });
});

describe('searchEntityById - character visibility', () => {
  beforeEach(() => {
    characterFindMany.mockReset();
    characterFindUnique.mockReset();
  });

  const byIdPayload: SearchByIdEntityPayload =
  {
    entity: 'character',
    select: { id: true, name: true },
  } as SearchByIdEntityPayload;

  it('returns the character when it is public', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: [] });

    const result = await searchEntityById('1', byIdPayload, null);

    expect(result).toEqual({ id: '1', name: 'Geralt' });
  });

  it('returns the character when the current API key is in apiKeys', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: ['ABC'] });

    const result = await searchEntityById('1', byIdPayload, 'ABC');

    expect(result).toEqual({ id: '1', name: 'Geralt' });
  });

  it('returns null when the current API key does not match a private character', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: ['ABC'] });

    const result = await searchEntityById('1', byIdPayload, 'XYZ');

    expect(result).toBeNull();
  });

  it('returns null when no API key is provided for a private character', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: ['ABC'] });

    const result = await searchEntityById('1', byIdPayload, null);

    expect(result).toBeNull();
  });

  it('forces apiKeys into the select so visibility can be checked, even if the caller did not request it', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: ['ABC'] });

    await searchEntityById('1', byIdPayload, 'ABC');

    expect(characterFindUnique).toHaveBeenCalledWith
    ({
      where: { id: '1' },
      select: { id: true, name: true, apiKeys: true },
    });
  });

  it('does not leak apiKeys back to the caller when it was not explicitly requested', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: ['ABC'] });

    const result = await searchEntityById<{ id: string; name: string; apiKeys?: string[] }>('1', byIdPayload, 'ABC');

    expect(result).not.toHaveProperty('apiKeys');
  });

  it('keeps apiKeys in the response when the caller explicitly selected it', async () => {
    characterFindUnique.mockResolvedValue({ id: '1', name: 'Geralt', apiKeys: ['ABC'] });

    const payloadWithApiKeys: SearchByIdEntityPayload =
    {
      entity: 'character',
      select: { id: true, name: true, apiKeys: true },
    } as SearchByIdEntityPayload;

    const result = await searchEntityById<{ id: string; name: string; apiKeys?: string[] }>('1', payloadWithApiKeys, 'ABC');

    expect(result).toMatchObject({ apiKeys: ['ABC'] });
  });

  it('returns null for a missing character (findUnique returns null) without throwing', async () => {
    characterFindUnique.mockResolvedValue(null);

    const result = await searchEntityById('missing', byIdPayload, 'ABC');

    expect(result).toBeNull();
  });
});

describe('search dispatch and pagination', () => {
  beforeEach(() => {
    maneuverFindMany.mockReset().mockResolvedValue([]);
    spellFindMany.mockReset().mockResolvedValue([]);
    spellFindUnique.mockReset();
    spellAggregate.mockReset();
    maneuverAggregate.mockReset();
    loadTagFacetIndex.mockReset();
    characterFindUnique.mockReset();
    characterFindMany.mockReset().mockResolvedValue([]);
  });

  it('combines cursor, include/exclude filters and character visibility', async () => {
    await searchEntity(characterListPayload({
      search: { name: 'Aldara' }, exclude: { tags: ['npc'] },
      pagination: { cursor: 'character-20', pageSize: 10 }, sort: [{ name: 'asc' }],
      requirementFilters: [{ kind: 'text', text: 'zwiad' }],
    }), 'KEY');
    expect(characterFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [
        { name: { contains: 'Aldara', mode: 'insensitive' } },
        { NOT: { tags: { hasSome: ['npc'] } } },
        { OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: 'KEY' } }] },
        { id: { gt: 'character-20' } },
      ] },
      take: 10,
      orderBy: [{ id: 'asc' }, { name: 'asc' }],
    }));
  });

  it.each([
    { name: undefined, where: { id: { gt: 'entry-5' } } },
    { name: 'Cios', where: { AND: [{ name: { contains: 'Cios', mode: 'insensitive' } }, { id: { gt: 'entry-5' } }] } },
  ])('builds the cursor query with name $name', async ({ name, where }) => {
    await searchEntity({ entity: 'maneuver', search: { name }, pagination: { cursor: 'entry-5', pageSize: 5 } });
    expect(maneuverFindMany).toHaveBeenCalledWith(expect.objectContaining({ where, take: 5 }));
  });

  it('preserves relation includes on lookups by ID', async () => {
    const spell = { id: 'spell-1', name: 'Ogień' };
    spellFindUnique.mockResolvedValue(spell);
    await expect(searchEntityById('spell-1', { entity: 'spell', include: { characters: true } })).resolves.toEqual(spell);
    expect(spellFindUnique).toHaveBeenCalledWith({ where: { id: 'spell-1' }, include: { characters: true } });
    const character = { id: 'character-1', apiKeys: ['KEY'], perks: [] };
    characterFindUnique.mockResolvedValue(character);
    await expect(searchEntityById('character-1', { entity: 'character', include: { perks: true } }, 'KEY')).resolves.toEqual(character);
    expect(characterFindUnique).toHaveBeenCalledWith({ where: { id: 'character-1' }, include: { perks: true } });
  });

  it('passes category aliases into the same aggregation as requirements and offset', async () => {
    loadTagFacetIndex.mockResolvedValue(buildTagFacetIndex('maneuvers', [
      { key: 'role', label: 'Rola', order: 0, entities: ['maneuvers'], selectionMode: 'multi', supportsNone: true },
    ], [{ tag: 'osłona', facetKey: 'role', aliases: [{ alias: 'zasłona', entities: ['maneuvers'] }] }]));
    maneuverAggregate.mockResolvedValue([{ _id: 'maneuver-1', name: 'Pchnięcie' }]);
    await expect(searchEntity({
      entity: 'maneuver', requirementFilters: [{ kind: 'text', text: 'trening' }],
      tagFacetFilters: [{ facetKey: 'role', tags: ['osłona'] }], pagination: { pageNumber: 2, pageSize: 10 },
    })).resolves.toEqual([{ id: 'maneuver-1', name: 'Pchnięcie' }]);
    expect(loadTagFacetIndex).toHaveBeenCalledExactlyOnceWith('maneuvers');
    expect(maneuverFindMany).not.toHaveBeenCalled();
    const [query] = maneuverAggregate.mock.calls[0];
    expect(query.pipeline).toEqual(expect.arrayContaining([{ $skip: 10 }, { $limit: 10 }]));
    expect(query.pipeline[0].$match.$and).toContainEqual({ tags: { $in: ['osłona', 'zasłona'] } });
  });

  it('converts aggregate spell costs after normalizing the database ID', async () => {
    spellAggregate.mockResolvedValue([{
      _id: 'spell-1', name: 'Ogień', description: 'Płomień', grade: 1, price: 2,
      tags: [], castTime: 'Standardowa', costBase: 8, costScalingMode: 'fixed', cooldown: null,
    }]);
    const payload = { entity: 'spell', requirementFilters: [{ kind: 'text', text: 'trening' }] } satisfies SearchEntityPayload;
    await expect(searchEntity(payload)).resolves.toEqual([
      expect.objectContaining({ id: 'spell-1', name: 'Ogień', cost: expect.objectContaining({ baseCost: 8, scalingMode: 'fixed' }) }),
    ]);
    spellAggregate.mockResolvedValue(null);
    await expect(searchEntity(payload)).resolves.toEqual([]);
    expect(spellFindMany).not.toHaveBeenCalled();
  });

  it('uses offset pagination with the typed delegate when there are no requirement filters', async () => {
    await searchEntity({
      entity: 'maneuver', search: { name: 'Cios' }, pagination: { pageNumber: 3, pageSize: 5 },
    });
    expect(maneuverFindMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 5 }));
    expect(loadTagFacetIndex).not.toHaveBeenCalled();
  });
});
