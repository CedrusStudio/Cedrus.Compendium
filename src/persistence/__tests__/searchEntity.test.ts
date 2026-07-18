import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchEntityPayload, SearchByIdEntityPayload } from '@/common/global/SearchPayloads';

const { characterFindMany, characterFindUnique, spellFindMany, maneuverFindMany } = vi.hoisted(() => ({
  characterFindMany: vi.fn(),
  characterFindUnique: vi.fn(),
  spellFindMany: vi.fn(),
  maneuverFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    character: { findMany: characterFindMany, findUnique: characterFindUnique },
    spell: { findMany: spellFindMany },
    maneuver: { findMany: maneuverFindMany },
  },
}));

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
