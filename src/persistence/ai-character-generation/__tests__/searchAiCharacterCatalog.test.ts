import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => ({
  prisma: {
    perk: { findMany: vi.fn() },
    weapon: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prisma }));

import { searchAiCharacterCatalog } from '@/persistence/ai-character-generation/aiCharacterCatalogRepository';

/** A compendium row as Prisma returns it, relation columns and all. */
const perkRow = (grade: number, overrides: Record<string, unknown> = {}) => ({
  id: `fortel-${grade}`,
  name: 'Większy Fortel',
  grade,
  description: 'Podnosi fortel.',
  structuredRequirements: [{ kind: 'ranked', group: 'attributes', targetKey: 'artifice', value: grade }],
  replaces: [],
  price: grade * 10,
  tags: ['fortel'],
  characterIds: ['character-1'],
  ...overrides,
});

describe('searchAiCharacterCatalog', () => {
  beforeEach(() => {
    prisma.perk.findMany.mockReset();
    prisma.weapon.findMany.mockReset();
  });

  it('filters by name without minding the case', async () => {
    prisma.perk.findMany.mockResolvedValue([]);

    await searchAiCharacterCatalog('perk', '  fortel  ', 10);

    expect(prisma.perk.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { name: { contains: 'fortel', mode: 'insensitive' } },
      take: 10,
    }));
  });

  it('asks for everything when the query is blank', async () => {
    prisma.perk.findMany.mockResolvedValue([]);

    await searchAiCharacterCatalog('perk', '   ');

    expect(prisma.perk.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });

  it('orders by rank so the reviewer can walk up the ladder', async () => {
    // Each rank is its own record; raising a rank means picking the next one,
    // which only works if they arrive in order.
    prisma.perk.findMany.mockResolvedValue([perkRow(3), perkRow(1), perkRow(2)]);

    const results = await searchAiCharacterCatalog('perk', 'fortel');

    expect(results.map(result => result.grade)).toEqual([1, 2, 3]);
  });

  it('renders the requirements as prose for the reviewer to read', async () => {
    prisma.perk.findMany.mockResolvedValue([perkRow(4)]);

    const [result] = await searchAiCharacterCatalog('perk', 'fortel');

    expect(result.requirements).toEqual(['fortel ≥ 4']);
  });

  it('hands back the record in the shape a character stores it', async () => {
    prisma.perk.findMany.mockResolvedValue([perkRow(2)]);

    const [result] = await searchAiCharacterCatalog('perk', 'fortel');

    expect(result.entry).toMatchObject({ id: 'fortel-2', name: 'Większy Fortel', grade: 2, price: 20 });
    // The back-reference of the many-to-many relation belongs to the compendium
    // record, never to a character's copy of it.
    expect(result.entry).not.toHaveProperty('characterIds');
  });

  it('leaves the Combat Lab columns behind', async () => {
    prisma.perk.findMany.mockResolvedValue([
      perkRow(1, { effects: [{ kind: 'whatever' }], simulatable: false, unsupportedReason: 'poza walką' }),
    ]);

    const [result] = await searchAiCharacterCatalog('perk', 'fortel');

    expect(result.entry).not.toHaveProperty('effects');
    expect(result.entry).not.toHaveProperty('simulatable');
    expect(result.entry).not.toHaveProperty('unsupportedReason');
  });

  it('carries a weapon\'s own numbers, which are why it gets picked', async () => {
    prisma.weapon.findMany.mockResolvedValue([{
      id: 'miecz', name: 'Miecz', description: 'Jednoręczny.', tags: [], style: 'jednoręczna',
      range: 0,
      offense: { amount: 1, grade: 5, bonus: 0, isPhantom: false, critical: { power: 0, range: 0 } },
      damageBonus: { amount: 1, grade: 3, bonus: 0, isPhantom: false },
      characterIds: [],
    }]);

    const [result] = await searchAiCharacterCatalog('weapon', 'miecz');

    expect(result.statistics).toMatchObject({ style: 'jednoręczna' });
    expect(result.entry).toMatchObject({ id: 'miecz', style: 'jednoręczna' });
  });

  it('answers nothing for a kind the compendium does not have', async () => {
    await expect(searchAiCharacterCatalog('wymyslony', 'cokolwiek')).resolves.toEqual([]);
    expect(prisma.perk.findMany).not.toHaveBeenCalled();
  });
});
