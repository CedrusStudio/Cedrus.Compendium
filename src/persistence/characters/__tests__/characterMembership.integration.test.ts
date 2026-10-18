import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const testUrl = vi.hoisted(() => {
  const value = process.env.MEMBERSHIP_TEST_DATABASE_URL;
  if (value) {
    const url = new URL(value);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.startsWith('/cedrus_membership_test')) {
      throw new Error('Membership integration tests require a dedicated local cedrus_membership_test database.');
    }
    process.env.DATABASE_CONNECTION_STRING = value;
  }
  return value;
});
vi.mock('@/lib/env', () => ({ adminApiKeys: ['test-key'] }));

import prisma from '@/lib/prisma';
import { setCharacterMembership } from '../characterMembershipRepository';
import { updateCharacterCombat, updateCharacterDetails } from '../charactersRepository';
import { toCharacterHeaderPersistenceModel, toCharacter } from '@/persistence/mappings/characterMapping';
import { includeAllRelations } from '@/infrastructure/searchQueries/characters/allCharacterRelations';
import { membershipSnapshot } from '@/domain/characters/characterMembership';
import { CharacterMembershipConflictError } from '../characterMembershipErrors';

describe.skipIf(!testUrl)('character membership against real MongoDB', () => {
  const characterIds: string[] = [];
  const entityIds: string[] = [];
  const key = 'test-key';
  async function expectConflict(promise: Promise<unknown>) {
    try { await promise; throw new Error('Expected conflict'); } catch (error) {
      if (!(error instanceof CharacterMembershipConflictError)) throw error;
    }
  }

  async function createCharacter(apiKeys: string[] = []) {
    const id = `membership-test-${randomUUID()}`;
    const data = toCharacterHeaderPersistenceModel({ name: id, shortName: id, description: 'Test', tags: [] });
    const character = await prisma.character.create({ data: { ...data, id, apiKeys } });
    characterIds.push(id);
    return character;
  }
  async function createEntry(kind: 'maneuver' | 'perk' | 'stance' | 'state') {
    const id = `membership-test-${randomUUID()}`;
    const common = { id, name: id, grade: 1, description: 'Test', price: 1, tags: [], characterIds: [] };
    if (kind === 'maneuver') await prisma.maneuver.create({ data: { ...common, castTime: 'Standardowa', cooldown: 0 } });
    else if (kind === 'perk') await prisma.perk.create({ data: common });
    else if (kind === 'stance') await prisma.stance.create({ data: common });
    else await prisma.state.create({ data: common });
    entityIds.push(id);
    return id;
  }

  beforeAll(async () => { await prisma.$connect(); });
  afterAll(async () => {
    await prisma.character.deleteMany({ where: { id: { in: characterIds } } });
    const where = { id: { in: entityIds } };
    await Promise.all([prisma.maneuver.deleteMany({ where }), prisma.perk.deleteMany({ where }), prisma.stance.deleteMany({ where }), prisma.state.deleteMany({ where })]);
    await prisma.$disconnect();
  });

  it.each([['maneuvers', 'maneuver'], ['perks', 'perk'], ['stances', 'stance'], ['states', 'state']] as const)('connects/disconnects %s idempotently and maintains both sides', async (kind, model) => {
    const character = await createCharacter();
    const other = await createCharacter();
    const id = await createEntry(model);
    const response = await setCharacterMembership(character.id, kind, id, true, key);
    expect(response).toMatchObject({ changed: true, characterPatch: { [`${kind}Ids`]: [id], [kind]: [expect.objectContaining({ id })] } });
    expect(Object.keys(response.characterPatch!).sort()).toEqual([kind, `${kind}Ids`].sort());
    expect(await setCharacterMembership(character.id, kind, id, true, key)).toMatchObject({ changed: false });
    const saved = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(saved[`${kind}Ids`]).toEqual([id]);
    const entity = await (prisma[model] as typeof prisma.perk).findUniqueOrThrow({ where: { id } });
    expect(entity.characterIds).toEqual([character.id]);
    expect(entity.description).toBe('Test');
    expect((await prisma.character.findUniqueOrThrow({ where: { id: other.id } }))[`${kind}Ids`]).toEqual([]);
    expect(await setCharacterMembership(character.id, kind, id, false, key)).toMatchObject({ characterPatch: { [`${kind}Ids`]: [], [kind]: [] } });
    expect(await setCharacterMembership(character.id, kind, id, false, key)).toMatchObject({ changed: false });
    expect((await (prisma[model] as typeof prisma.perk).findUniqueOrThrow({ where: { id } })).characterIds).toEqual([]);
  });

  it('preserves two simultaneous additions and has no duplicates for simultaneous identical additions', async () => {
    const character = await createCharacter();
    const a = await createEntry('maneuver'), b = await createEntry('maneuver');
    await Promise.all([setCharacterMembership(character.id, 'maneuvers', a, true, key), setCharacterMembership(character.id, 'maneuvers', b, true, key)]);
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds.sort()).toEqual([a, b].sort());
    await Promise.all([setCharacterMembership(character.id, 'maneuvers', a, true, key), setCharacterMembership(character.id, 'maneuvers', a, true, key)]);
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds).toHaveLength(2);
  });

  it('does not let an old details form undo a new perk, including on legacy missing ID arrays', async () => {
    const character = await createCharacter();
    const snapshot = membershipSnapshot(character);
    const perk = await createEntry('perk');
    await setCharacterMembership(character.id, 'perks', perk, true, key);
    const data = { name: character.name, shortName: character.shortName, description: 'Changed', tags: [], perks: [] };
    await expectConflict(updateCharacterDetails(character.id, data, { expectedMembership: { perksIds: snapshot.perksIds }, apiKey: key }));
    const after = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(after.perksIds).toEqual([perk]);
    expect(after.description).toBe('Test');
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const parsed = toCharacter(raw);
    await updateCharacterDetails(character.id, { ...data, perks: parsed.perks }, { expectedMembership: { perksIds: raw.perksIds }, apiKey: key });
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).description).toBe('Changed');
  });

  it('rejects a stale combat form and rolls back nested entity edits', async () => {
    const character = await createCharacter();
    const a = await createEntry('maneuver'), b = await createEntry('maneuver');
    await setCharacterMembership(character.id, 'maneuvers', a, true, key);
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const parsed = toCharacter(raw);
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(raw);
    await setCharacterMembership(character.id, 'maneuvers', b, true, key);
    const combat = { ...parsed, maneuvers: parsed.maneuvers.map(item => ({ ...item, description: 'Should roll back' })) };
    await expectConflict(updateCharacterCombat(character.id, combat, { expectedMembership, apiKey: key }));
    expect((await prisma.maneuver.findUniqueOrThrow({ where: { id: a } })).description).toBe('Test');
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds).toHaveLength(2);
  });

  it('enforces visibility and does not turn unknown additions into dangling links', async () => {
    const hidden = await createCharacter(['another-key']);
    const id = await createEntry('perk');
    await expect(setCharacterMembership(hidden.id, 'perks', id, true, key)).rejects.toMatchObject({ status: 404 });
    await expect(setCharacterMembership(hidden.id, 'perks', id, true, 'another-key')).resolves.toMatchObject({ changed: true });
    const visible = await createCharacter();
    await expect(setCharacterMembership(visible.id, 'perks', 'missing', true, key)).rejects.toMatchObject({ status: 404 });
    await expect(setCharacterMembership(visible.id, 'perks', 'missing', false, key)).resolves.toMatchObject({ changed: false });
  });

  it('removes a dangling relation even when its compendium record no longer exists', async () => {
    const character = await createCharacter();
    await prisma.character.update({ where: { id: character.id }, data: { maneuversIds: ['deleted-entry'] } });
    await setCharacterMembership(character.id, 'maneuvers', 'deleted-entry', false, key);
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).maneuversIds).toEqual([]);
  });

  it('enforces the limit atomically for two requests competing for the last slot', async () => {
    const character = await createCharacter();
    // Existing scalar IDs need not have hydrated relation rows to count towards capacity.
    await prisma.character.update({ where: { id: character.id }, data: { stancesIds: Array.from({ length: 19 }, (_, i) => `existing-${i}`) } });
    const a = await createEntry('stance'), b = await createEntry('stance');
    const results = await Promise.allSettled([setCharacterMembership(character.id, 'stances', a, true, key), setCharacterMembership(character.id, 'stances', b, true, key)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { status: 422 } });
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).stancesIds).toHaveLength(20);
  });
});
