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
import { defaultSpell, defaultPower } from '@/domain/characters/combat/Power';
import { toSpellPersistenceModel } from '@/persistence/mappings/spellMappings';

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
    await Promise.all([prisma.maneuver.deleteMany({ where }), prisma.perk.deleteMany({ where }), prisma.stance.deleteMany({ where }), prisma.state.deleteMany({ where }),
      prisma.spell.deleteMany({ where }), prisma.powerSpecification.deleteMany({ where })]);
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

  it('removes one grade-eight perk from 100, reattaches it and adds another without changing the other perks', async () => {
    const character = await createCharacter();
    const original = Array.from({ length: 100 }, (_, index) => ({
      id: `membership-test-${randomUUID()}`, name: index === 0 ? 'Większy Fechtunek' : `Atut ${randomUUID()}`,
      grade: 8, price: 1, description: 'Pozostaw bez zmian', tags: [], replaces: [], characterIds: [],
    }));
    const fortel = { ...original[0], id: `membership-test-${randomUUID()}`, name: 'Większy Fortel' };
    entityIds.push(...original.map(perk => perk.id), fortel.id);
    await prisma.perk.createMany({ data: [...original, fortel] });
    await prisma.character.update({ where: { id: character.id }, data: { perks: { connect: original.map(({ id }) => ({ id })) } } });

    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const remaining = toCharacter(raw).perks.filter(perk => perk.id !== original[0].id);
    const details = { name: character.name, shortName: character.shortName, description: 'Changed', tags: [], perks: remaining };
    await updateCharacterDetails(character.id, details, { expectedMembership: { perksIds: raw.perksIds }, apiKey: key });
    const afterRemoval = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(afterRemoval.perksIds).toHaveLength(99);
    expect(afterRemoval.perksIds).not.toContain(original[0].id);
    expect((await prisma.perk.findUniqueOrThrow({ where: { id: original[0].id } })).characterIds).not.toContain(character.id);

    await updateCharacterDetails(character.id, { ...details, perks: [...remaining, original[0], fortel] }, {
      expectedMembership: { perksIds: afterRemoval.perksIds }, apiKey: key,
    });
    const afterAddition = await prisma.character.findUniqueOrThrow({ where: { id: character.id } });
    expect(afterAddition.perksIds).toHaveLength(101);
    expect(afterAddition.perksIds).toEqual(expect.arrayContaining([original[0].id, fortel.id]));
    const savedPerks = await prisma.perk.findMany({ where: { id: { in: [...original.map(perk => perk.id), fortel.id] } } });
    for (const perk of savedPerks) {
      expect(perk.description).toBe('Pozostaw bez zmian');
      expect(perk.characterIds).toContain(character.id);
    }

    const edited = remaining.map((perk, index) => index === 0 ? { ...perk, description: 'Rzeczywista edycja' } : perk);
    await updateCharacterDetails(character.id, { ...details, perks: [...edited, original[0], fortel] }, {
      expectedMembership: { perksIds: afterAddition.perksIds }, apiKey: key,
    });
    expect((await prisma.perk.findUniqueOrThrow({ where: { id: remaining[0].id } })).description).toBe('Rzeczywista edycja');
    expect((await prisma.perk.findUniqueOrThrow({ where: { id: remaining[1].id } })).description).toBe('Pozostaw bez zmian');
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

  it.each(['maneuvers', 'stances', 'states'] as const)('removes one of many %s and preserves a genuine edit and simulation fields', async kind => {
    const character = await createCharacter();
    const entries = Array.from({ length: kind === 'maneuvers' ? 100 : 20 }, () => ({
      id: `membership-test-${randomUUID()}`, name: `Test ${randomUUID()}`, grade: 1, price: 1, description: 'Test',
      tags: [], replaces: [], characterIds: [], effects: [{ type: 'test' }], simulatable: false, unsupportedReason: 'Keep',
    }));
    entityIds.push(...entries.map(entry => entry.id));
    if (kind === 'maneuvers') await prisma.maneuver.createMany({ data: entries.map(entry => ({ ...entry, castTime: 'Standardowa', cooldown: 0 })) });
    else if (kind === 'stances') await prisma.stance.createMany({ data: entries });
    else await prisma.state.createMany({ data: entries });
    await prisma.character.update({ where: { id: character.id }, data: { [kind]: { connect: entries.map(({ id }) => ({ id })) } } });
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(raw);
    // The real character form strips Combat Lab metadata from its DTO.
    const parsed = toCharacter(raw);
    const incoming = parsed[kind].filter(entry => entry.id !== entries[0].id).map(({ effects: _effects, simulatable: _sim, unsupportedReason: _reason, ...entry }) => entry);
    await updateCharacterCombat(character.id, { ...parsed, [kind]: incoming }, { expectedMembership, apiKey: key });
    const after = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    expect(after[`${kind}Ids`]).toHaveLength(entries.length - 1);
    expect(after[`${kind}Ids`]).not.toContain(entries[0].id);
    const getEntry = (id: string) => kind === 'maneuvers' ? prisma.maneuver.findUniqueOrThrow({ where: { id } })
      : kind === 'stances' ? prisma.stance.findUniqueOrThrow({ where: { id } }) : prisma.state.findUniqueOrThrow({ where: { id } });
    const removed = await getEntry(entries[0].id);
    expect(removed.characterIds).not.toContain(character.id);
    const { perksIds: _afterPerks, ...nextExpected } = membershipSnapshot(after);
    const edited = incoming.map((entry, index) => index === 0 ? { ...entry, description: 'Changed' } : entry);
    await updateCharacterCombat(character.id, { ...toCharacter(after), [kind]: edited }, { expectedMembership: nextExpected, apiKey: key });
    const saved = await getEntry(incoming[0].id);
    expect(saved.description).toBe('Changed');
    expect(saved.effects).toEqual([{ type: 'test' }]);
    expect(saved.simulatable).toBe(false);
    expect(saved.unsupportedReason).toBe('Keep');
  });

  it('preserves a spell in another power, saves its cost edit, and detaches it only after the final reference', async () => {
    const character = await createCharacter();
    const spell = { ...defaultSpell, id: `membership-test-${randomUUID()}`, name: `Spell ${randomUUID()}` };
    const specId = `membership-test-${randomUUID()}`;
    entityIds.push(spell.id, specId);
    await prisma.spell.create({ data: { ...toSpellPersistenceModel(spell), replaces: [], characterIds: [] } });
    await prisma.powerSpecification.create({ data: { id: specId, name: `Spec ${randomUUID()}`, description: '', tags: [], offenses: [], characterIds: [] } });
    const powers = [1, 2].map(index => ({ ...defaultPower, id: `power-${index}`, powerSpecificationId: specId, spells: [spell] }));
    const raw = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    const { perksIds: _perks, ...expectedMembership } = membershipSnapshot(raw);
    await updateCharacterCombat(character.id, { ...toCharacter(raw), powers }, { expectedMembership, apiKey: key });
    const connected = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    expect(connected.spellsIds).toEqual([spell.id]);
    expect(connected.powerSpecificationsIds).toEqual([specId]);
    const { perksIds: _sharedPerks, ...sharedExpected } = membershipSnapshot(connected);
    const shared = toCharacter(connected);
    await updateCharacterCombat(character.id, { ...shared, powers: shared.powers.map((power, index) => ({ ...power,
      spells: power.spells.map(item => index === 0 ? { ...item, cost: { ...item.cost, baseCost: 27 } } : item),
    })) }, { expectedMembership: sharedExpected, apiKey: key });
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spell.id } })).costBase).toBe(27);
    const next = toCharacter(connected);
    const updatedPowers = next.powers.map((power, index) => ({ ...power, spells: index === 0 ? []
      : power.spells.map(item => ({ ...item, cost: { ...item.cost, baseCost: 31 } })) }));
    const { perksIds: _nextPerks, ...nextExpected } = membershipSnapshot(connected);
    await updateCharacterCombat(character.id, { ...next, powers: updatedPowers }, { expectedMembership: nextExpected, apiKey: key });
    const partial = await prisma.character.findUniqueOrThrow({ where: { id: character.id }, include: includeAllRelations });
    expect(partial.spellsIds).toEqual([spell.id]);
    expect(partial.powers.map(power => power.spellsIds)).toEqual([[], [spell.id]]);
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spell.id } })).costBase).toBe(31);
    const { perksIds: _finalPerks, ...finalExpected } = membershipSnapshot(partial);
    await updateCharacterCombat(character.id, { ...toCharacter(partial), powers: updatedPowers.map(power => ({ ...power, spells: [] })) }, { expectedMembership: finalExpected, apiKey: key });
    expect((await prisma.character.findUniqueOrThrow({ where: { id: character.id } })).spellsIds).toEqual([]);
    expect((await prisma.spell.findUniqueOrThrow({ where: { id: spell.id } })).characterIds).not.toContain(character.id);
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
